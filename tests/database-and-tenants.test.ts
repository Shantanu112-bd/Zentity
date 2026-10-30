import assert from "node:assert";
import crypto from "crypto";
import { db } from "../server/db/index.ts";
import { seedDefaultTenants, hashClientSecret, verifyClientSecret } from "../server/db/seed-tenants.ts";
import { getOrInitIssuerKey } from "../server/services/issuerKeyService.ts";
import { PersistentIndexer } from "../server/services/indexerService.ts";
import {
  webhookService,
  computeWebhookSignature,
  verifyWebhookSignature,
} from "../server/services/webhookService.ts";

describe("Priority 1: Real Database Persistence, Multi-Tenant OIDC, Persistent Indexer & Signed Webhooks", function () {
  before(async function () {
    await db.init();
    await seedDefaultTenants();
  });

  describe("1. Multi-Tenant Database & Secret Hashing", function () {
    it("Seeds default tenant and verifies hashed client secret with timing-safe comparison", async function () {
      const tenant = await db.getTenantByClientId("pramaan-relying-party-alpha");
      assert.ok(tenant, "Default tenant must exist in database");
      assert.strictEqual(tenant.name, "Pramaan Verified Relying Party");
      assert.ok(tenant.redirectUris.includes("http://localhost:5173/relying-party"));

      // Verify valid secret
      const isValid = verifyClientSecret("pramaan-client-secret-2026-secure", tenant.clientSecretHash);
      assert.strictEqual(isValid, true, "Valid client secret must verify successfully");

      // Verify wrong secret fails
      const isWrong = verifyClientSecret("wrong-secret-1234", tenant.clientSecretHash);
      assert.strictEqual(isWrong, false, "Wrong client secret must fail verification");
    });

    it("Creates and persists a new tenant with multiple redirect URIs", async function () {
      const newTenantId = `tenant-${Date.now()}`;
      const newClientId = `client-test-${Date.now()}`;
      const secret = "test-secret-alpha-999";

      await db.saveTenant({
        id: newTenantId,
        clientId: newClientId,
        clientSecretHash: hashClientSecret(secret),
        name: "Acme Web3 Portal",
        redirectUris: ["https://acme.org/callback", "http://localhost:8080/callback"],
        isActive: true,
      });

      const loaded = await db.getTenantByClientId(newClientId);
      assert.ok(loaded);
      assert.strictEqual(loaded.name, "Acme Web3 Portal");
      assert.strictEqual(verifyClientSecret(secret, loaded.clientSecretHash), true);
    });
  });

  describe("2. Database-Backed OIDC Sessions & Consumption", function () {
    it("Stores and consumes an OIDC authorization session atomically", async function () {
      const code = `authcode-${crypto.randomBytes(16).toString("hex")}`;
      const expiresAt = new Date(Date.now() + 60000);

      await db.storeOidcSession({
        code,
        clientId: "pramaan-relying-party-alpha",
        redirectUri: "http://localhost:5173/relying-party",
        codeChallenge: "challenge-xyz-1234",
        codeChallengeMethod: "S256",
        state: "state-abc",
        nullifier: "1234567890",
        scopeId: "1",
        expiresAt,
      });

      // First consume succeeds
      const consumed = await db.consumeOidcSession(code);
      assert.ok(consumed, "Session should be consumed successfully");
      assert.strictEqual(consumed.code, code);
      assert.strictEqual(consumed.clientId, "pramaan-relying-party-alpha");

      // Second consume fails (replay prevention)
      const replayed = await db.consumeOidcSession(code);
      assert.strictEqual(replayed, null, "Consumed code cannot be reused");
    });
  });

  describe("3. Persisted Stable Issuer Key Record", function () {
    it("Initializes and returns stable persisted BabyJubjub issuer key", async function () {
      const issuer = await getOrInitIssuerKey();
      assert.ok(issuer.keyId);
      assert.ok(issuer.pubKeyAx);
      assert.ok(issuer.pubKeyAy);
      assert.strictEqual(
        issuer.pubKeyHash,
        "1611009605506049313254918906125506668212891036786937998993893237370979579959",
        "Must match Coral testnet registered issuer key hash"
      );

      // Verify record is stored in database
      const dbKey = await db.getActiveIssuerKey();
      assert.ok(dbKey);
      assert.strictEqual(dbKey.publicKeyHash, issuer.pubKeyHash);
      assert.strictEqual(dbKey.isActive, true);
    });
  });

  describe("4. Persistent Blockchain Indexer & Reorg Handling", function () {
    it("Tracks cursor, records verified events idempotently, and rolls back on reorg", async function () {
      const testChainId = 99999;

      // Set initial cursor
      await db.setIndexerCursor(testChainId, 100n, "0xhash100");
      let cursor = await db.getIndexerCursor(testChainId);
      assert.ok(cursor);
      assert.strictEqual(cursor.lastProcessedBlock, 100n);
      assert.strictEqual(cursor.lastProcessedHash, "0xhash100");

      // Record 3 events at block 101, 102, 103
      await db.recordVerifiedEvent({
        id: "ev-1",
        chainId: testChainId,
        blockNumber: 101n,
        blockHash: "0xhash101",
        txHash: "0xtx1",
        scopeId: "1",
        nullifier: "111",
        recipient: "0x1111111111111111111111111111111111111111",
      });
      await db.recordVerifiedEvent({
        id: "ev-2",
        chainId: testChainId,
        blockNumber: 102n,
        blockHash: "0xhash102",
        txHash: "0xtx2",
        scopeId: "1",
        nullifier: "222",
        recipient: "0x2222222222222222222222222222222222222222",
      });
      await db.recordVerifiedEvent({
        id: "ev-3",
        chainId: testChainId,
        blockNumber: 103n,
        blockHash: "0xhash103",
        txHash: "0xtx3",
        scopeId: "1",
        nullifier: "333",
        recipient: "0x3333333333333333333333333333333333333333",
      });

      let events = await db.getVerifiedEvents(testChainId);
      assert.strictEqual(events.length, 3, "All 3 events should be indexed");

      // Duplicate insertion is rejected idempotently
      const dup = await db.recordVerifiedEvent({
        id: "ev-dup",
        chainId: testChainId,
        blockNumber: 103n,
        blockHash: "0xhash103",
        txHash: "0xtx3_dup",
        scopeId: "1",
        nullifier: "333", // duplicate nullifier in same scope
        recipient: "0x3333333333333333333333333333333333333333",
      });
      assert.strictEqual(dup, false, "Duplicate event must be ignored");

      // Simulate reorg rollback after block 101 (blocks 102 and 103 rolled back)
      const rolledBackCount = await db.rollbackEventsAfterBlock(testChainId, 101n);
      assert.strictEqual(rolledBackCount, 2, "2 events should have been rolled back");

      events = await db.getVerifiedEvents(testChainId);
      assert.strictEqual(events.length, 1, "Only block 101 event should remain");
      assert.strictEqual(events[0].blockNumber, 101n);
    });
  });

  describe("5. Generic Signed Webhooks & Replay Verification", function () {
    it("Enqueues webhook, computes HMAC-SHA256 signature, and verifies valid signature header", async function () {
      const secret = "whsec_test_secret_987654321";
      const payload = {
        event: "PROOF_VERIFIED_AND_RECORDED",
        scopeId: "1",
        nullifier: "555666777",
        recipient: "0x1234567890123456789012345678901234567890",
      };

      const webhook = await webhookService.enqueue(
        "https://api.relying-party.com/webhook",
        "PROOF_VERIFIED_AND_RECORDED",
        payload,
        secret
      );

      assert.ok(webhook.id.startsWith("wh-"));
      assert.strictEqual(webhook.status, "PENDING");

      // Signature verification
      const timestamp = Math.floor(Date.now() / 1000);
      const signature = computeWebhookSignature(payload, secret, timestamp);
      const header = `t=${timestamp},v1=${signature}`;

      const isValid = verifyWebhookSignature(payload, header, secret);
      assert.strictEqual(isValid, true, "Signature must verify successfully");

      // Tampered payload fails
      const isTampered = verifyWebhookSignature({ ...payload, nullifier: "999" }, header, secret);
      assert.strictEqual(isTampered, false, "Tampered payload must fail signature check");

      // Expired timestamp fails
      const oldHeader = `t=${timestamp - 400},v1=${signature}`;
      const isExpired = verifyWebhookSignature(payload, oldHeader, secret, 300);
      assert.strictEqual(isExpired, false, "Expired timestamp outside tolerance must fail");
    });
  });
});
