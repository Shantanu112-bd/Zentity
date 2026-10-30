import crypto from "crypto";

export interface KeyManagementProvider {
  name: string;
  encrypt(plaintext: Buffer): Promise<string>;
  decrypt(ciphertext: string): Promise<Buffer>;
  rotate?(ciphertext: string, newProvider: KeyManagementProvider): Promise<string>;
}

export function deriveMasterKey(rawKey?: string): Buffer {
  const source = rawKey || process.env.ISSUER_MASTER_KEY;
  if (!source) {
    if (process.env.NODE_ENV === "test") {
      return crypto.createHash("sha256").update("pramaan-test-master-key-2026-entropy").digest();
    }
    throw new Error(
      "[KEY_MANAGEMENT_FAIL_CLOSED] ISSUER_MASTER_KEY environment variable is required to encrypt issuer credentials at rest."
    );
  }

  // If already 64-char hex (32 bytes)
  if (/^[a-fA-F0-9]{64}$/.test(source)) {
    return Buffer.from(source, "hex");
  }

  // Derive 32-byte key via SHA-256 from passphrase
  return crypto.createHash("sha256").update(source).digest();
}

/**
 * Envelope Encryption for Private Keys (AES-256-GCM authenticated)
 * Format: enc:v1:<iv_hex>:<tag_hex>:<ciphertext_hex>
 */
export function encryptEnvelope(plaintext: Buffer, masterKey?: Buffer): string {
  const key = masterKey || deriveMasterKey();
  const iv = crypto.randomBytes(12); // 96-bit standard GCM IV
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `enc:v1:${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
}

export function decryptEnvelope(envelope: string, masterKey?: Buffer): Buffer {
  if (!envelope.startsWith("enc:v1:")) {
    throw new Error("Invalid envelope format: must start with 'enc:v1:'");
  }

  const parts = envelope.split(":");
  if (parts.length !== 5) {
    throw new Error("Invalid envelope format: corrupted delimiter structure");
  }

  const [, , ivHex, tagHex, cipherHex] = parts;
  const key = masterKey || deriveMasterKey();
  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");
  const ciphertext = Buffer.from(cipherHex, "hex");

  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return decrypted;
}

export function rotateEnvelope(envelope: string, oldKey: Buffer, newKey: Buffer): string {
  const plaintext = decryptEnvelope(envelope, oldKey);
  return encryptEnvelope(plaintext, newKey);
}

/**
 * Local Software KMS Provider (implements KeyManagementProvider interface)
 */
export class LocalSoftwareKmsProvider implements KeyManagementProvider {
  public name = "LocalSoftwareKMS";
  private masterKey: Buffer;

  constructor(key?: Buffer | string) {
    if (Buffer.isBuffer(key)) {
      this.masterKey = key;
    } else {
      this.masterKey = deriveMasterKey(key);
    }
  }

  public async encrypt(plaintext: Buffer): Promise<string> {
    return encryptEnvelope(plaintext, this.masterKey);
  }

  public async decrypt(ciphertext: string): Promise<Buffer> {
    return decryptEnvelope(ciphertext, this.masterKey);
  }

  public async rotate(ciphertext: string, newProvider: KeyManagementProvider): Promise<string> {
    const plaintext = await this.decrypt(ciphertext);
    return await newProvider.encrypt(plaintext);
  }
}

