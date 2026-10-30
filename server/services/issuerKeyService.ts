import crypto from "crypto";
import { getCrypto } from "../../scripts/pramaan/crypto-utils.ts";
import type { SyntheticCredential } from "../../scripts/pramaan/crypto-utils.ts";
import { db } from "../db/index.ts";
import type { IssuerKeyRecord } from "../db/index.ts";
import { encryptEnvelope, decryptEnvelope } from "./keyEncryptionService.ts";

export interface IssuerIdentity {
  keyId: string;
  prvKey: Buffer;
  pubKeyAx: string;
  pubKeyAy: string;
  pubKeyHash: string;
}

let activeIssuer: IssuerIdentity | null = null;

export async function getOrInitIssuerKey(): Promise<IssuerIdentity> {
  if (activeIssuer) return activeIssuer;

  const { eddsa, poseidon, F } = await getCrypto();

  // 1. Check if key is persisted in Database
  const dbRecord = await db.getActiveIssuerKey();
  if (dbRecord) {
    let prvKey: Buffer;
    if (dbRecord.encryptedPrivateKey.startsWith("enc:v1:")) {
      prvKey = decryptEnvelope(dbRecord.encryptedPrivateKey);
    } else {
      // Automatic migration: legacy unencrypted key -> AES-256-GCM envelope
      prvKey = Buffer.from(dbRecord.encryptedPrivateKey, "hex");
      const encrypted = encryptEnvelope(prvKey);
      await db.updateIssuerKeyCiphertext(dbRecord.keyId, encrypted);
    }

    activeIssuer = {
      keyId: dbRecord.keyId,
      prvKey,
      pubKeyAx: dbRecord.publicKeyAx,
      pubKeyAy: dbRecord.publicKeyAy,
      pubKeyHash: dbRecord.publicKeyHash,
    };
    return activeIssuer;
  }

  // 2. Fall back to environment variable or stable registered key
  const envHex = process.env.ISSUER_PRIVATE_KEY_HEX;
  const prvKey = envHex
    ? Buffer.from(envHex, "hex")
    : Buffer.from("3a8b49f2c18d96005e3f1672986427d1490284abce9123847592019483756201", "hex");

  const pubKey = eddsa.prv2pub(prvKey);
  const pubKeyAx = F.toString(pubKey[0]);
  const pubKeyAy = F.toString(pubKey[1]);
  const pubKeyHash = F.toString(poseidon([pubKey[0], pubKey[1]]));
  const keyId = `issuer-key-${pubKeyHash.slice(0, 10)}`;

  // Store in database encrypted at rest (AES-256-GCM envelope encryption)
  const encryptedPrivateKey = encryptEnvelope(prvKey);

  const record: IssuerKeyRecord = {
    keyId,
    algorithm: "BabyJubjub-EdDSA-Poseidon-AES256GCM",
    publicKeyAx: pubKeyAx,
    publicKeyAy: pubKeyAy,
    publicKeyHash: pubKeyHash,
    encryptedPrivateKey,
    isActive: true,
  };

  await db.saveIssuerKey(record);

  activeIssuer = {
    keyId,
    prvKey,
    pubKeyAx,
    pubKeyAy,
    pubKeyHash,
  };

  return activeIssuer;
}

export async function issueAttestationCredential(
  dobDays: number,
  stateCode = 27
): Promise<SyntheticCredential> {
  const { eddsa, poseidon, F } = await getCrypto();
  const issuer = await getOrInitIssuerKey();

  const secretBuffer = crypto.randomBytes(31);
  const credentialSecret = BigInt("0x" + secretBuffer.toString("hex")).toString();

  const msgHash = poseidon([
    BigInt(dobDays),
    BigInt(stateCode),
    BigInt(credentialSecret),
  ]);

  const signature = eddsa.signPoseidon(issuer.prvKey, msgHash);

  return {
    dobDays,
    stateCode,
    credentialSecret,
    issuerPubKeyAx: issuer.pubKeyAx,
    issuerPubKeyAy: issuer.pubKeyAy,
    issuerPubKeyHash: issuer.pubKeyHash,
    sigR8x: F.toString(signature.R8[0]),
    sigR8y: F.toString(signature.R8[1]),
    sigS: signature.S.toString(),
    label: "Pramaan-ZK Attestation Authority (Persisted Key)",
  };
}
