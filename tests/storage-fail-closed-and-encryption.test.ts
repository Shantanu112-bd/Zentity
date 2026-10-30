import assert from "node:assert";
import crypto from "crypto";
import { DatabaseService } from "../server/db/index.ts";
import {
  encryptEnvelope,
  decryptEnvelope,
  rotateEnvelope,
  deriveMasterKey,
  LocalSoftwareKmsProvider,
} from "../server/services/keyEncryptionService.ts";
import { getOrInitIssuerKey } from "../server/services/issuerKeyService.ts";

describe("Pre-P0 Invariants: Storage Fail-Closed & Envelope Key Encryption", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv, NODE_ENV: "test" };
  });

  afterEach(() => {
    process.env = { ...originalEnv, NODE_ENV: "test" };
  });

  describe("1. Storage Fail-Closed Policy", () => {
    it("strictly refuses to start when NODE_ENV=production and DATABASE_URL is missing", async () => {
      process.env.NODE_ENV = "production";
      delete process.env.DATABASE_URL;

      const db = new DatabaseService();
      let threw = false;
      try {
        await db.init();
      } catch (err: any) {
        threw = true;
        assert.ok(err.message.includes("[STORAGE_FAIL_CLOSED]"));
        assert.ok(err.message.includes("DATABASE_URL is required when NODE_ENV=production"));
      }
      assert.strictEqual(threw, true);
    });

    it("strictly refuses to start when NETWORK is set and DATABASE_URL is missing", async () => {
      process.env.NODE_ENV = "test";
      process.env.NETWORK = "mstCoralTestnet";
      delete process.env.DATABASE_URL;

      const db = new DatabaseService();
      let threw = false;
      try {
        await db.init();
      } catch (err: any) {
        threw = true;
        assert.ok(err.message.includes("[STORAGE_FAIL_CLOSED]"));
        assert.ok(err.message.includes("DATABASE_URL is required"));
      }
      assert.strictEqual(threw, true);
    });

    it("strictly refuses to start if DATABASE_URL connection fails", async () => {
      process.env.NODE_ENV = "test";
      delete process.env.NETWORK;
      const invalidUrl = "postgres://invalid_user:invalid_pass@127.0.0.1:54321/nonexistent_db";

      const db = new DatabaseService(invalidUrl);
      let threw = false;
      try {
        await db.init();
      } catch (err: any) {
        threw = true;
        assert.ok(err.message.includes("[STORAGE_FAIL_CLOSED]"));
        assert.ok(err.message.includes("Database connection failed"));
      } finally {
        await db.close().catch(() => {});
      }
      assert.strictEqual(threw, true);
    });

    it("allows in-memory adapter ONLY when NODE_ENV=test and no NETWORK is set", async () => {
      process.env.NODE_ENV = "test";
      delete process.env.NETWORK;
      delete process.env.DATABASE_URL;

      const db = new DatabaseService();
      await db.init();
      assert.strictEqual(db.isPostgres(), false);
      await db.close();
    });
  });

  describe("2. Issuer Key Envelope Encryption at Rest", () => {
    const testMasterKey = crypto.randomBytes(32);
    const testPrvKey = crypto.randomBytes(32);

    it("encrypts with AES-256-GCM envelope format (enc:v1:<iv>:<tag>:<ciphertext>)", () => {
      const envelope = encryptEnvelope(testPrvKey, testMasterKey);
      assert.match(envelope, /^enc:v1:[a-f0-9]{24}:[a-f0-9]{32}:[a-f0-9]{64}$/);

      const decrypted = decryptEnvelope(envelope, testMasterKey);
      assert.strictEqual(decrypted.equals(testPrvKey), true);
    });

    it("strictly rejects tampered authentication tag (integrity guarantee)", () => {
      const envelope = encryptEnvelope(testPrvKey, testMasterKey);
      const parts = envelope.split(":");
      // Corrupt the tag byte
      const corruptedTag = "ff" + parts[3].slice(2);
      const corruptedEnvelope = `${parts[0]}:${parts[1]}:${parts[2]}:${corruptedTag}:${parts[4]}`;

      assert.throws(() => decryptEnvelope(corruptedEnvelope, testMasterKey));
    });

    it("supports zero-downtime key rotation from old master key to new master key", () => {
      const newMasterKey = crypto.randomBytes(32);
      const envelopeV1 = encryptEnvelope(testPrvKey, testMasterKey);

      const envelopeV2 = rotateEnvelope(envelopeV1, testMasterKey, newMasterKey);
      assert.match(envelopeV2, /^enc:v1:[a-f0-9]{24}:[a-f0-9]{32}:[a-f0-9]{64}$/);
      assert.notStrictEqual(envelopeV2, envelopeV1);

      const decrypted = decryptEnvelope(envelopeV2, newMasterKey);
      assert.strictEqual(decrypted.equals(testPrvKey), true);
    });

    it("LocalSoftwareKmsProvider implements KeyManagementProvider contract", async () => {
      const kms = new LocalSoftwareKmsProvider(testMasterKey);
      const ciphertext = await kms.encrypt(testPrvKey);
      const decrypted = await kms.decrypt(ciphertext);

      assert.strictEqual(decrypted.equals(testPrvKey), true);

      const newKms = new LocalSoftwareKmsProvider(crypto.randomBytes(32));
      const rotated = await kms.rotate!(ciphertext, newKms);
      const decryptedRotated = await newKms.decrypt(rotated);

      assert.strictEqual(decryptedRotated.equals(testPrvKey), true);
    });

    it("Persisted issuer key is stored as envelope ciphertext and never exposes plain prvKey in DB", async () => {
      const issuer = await getOrInitIssuerKey();
      assert.strictEqual(typeof issuer.pubKeyHash, "string");
      assert.ok(Buffer.isBuffer(issuer.prvKey));

      const { db } = await import("../server/db/index.ts");
      const activeRecord = await db.getActiveIssuerKey();
      assert.ok(activeRecord);
      assert.match(activeRecord!.encryptedPrivateKey, /^enc:v1:/);
      assert.strictEqual(activeRecord!.encryptedPrivateKey.includes(issuer.prvKey.toString("hex")), false);
    });
  });
});
