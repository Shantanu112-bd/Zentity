import fs from "fs";
import path from "path";
import { Pool } from "pg";
import crypto from "crypto";

export interface TenantRecord {
  id: string;
  clientId: string;
  clientSecretHash: string;
  name: string;
  redirectUris: string[];
  isActive: boolean;
  createdAt?: Date;
}

export interface OidcSessionRecord {
  code: string;
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
  codeChallengeMethod: string;
  state: string;
  nullifier?: string;
  scopeId?: string;
  expiresAt: Date;
  consumed?: boolean;
  createdAt?: Date;
}

export interface NonceRecord {
  nonce: string;
  address: `0x${string}`;
  origin?: string;
  message: string;
  expiresAt: Date;
  consumed?: boolean;
  createdAt?: Date;
}

export interface IndexerCursorRecord {
  chainId: number;
  lastProcessedBlock: bigint;
  lastProcessedHash: string;
  updatedAt?: Date;
}

export interface VerifiedEventRecord {
  id: string;
  chainId: number;
  blockNumber: bigint;
  blockHash: string;
  txHash: string;
  scopeId: string;
  nullifier: string;
  recipient: string;
  timestamp?: Date;
}

export interface WebhookRecord {
  id: string;
  tenantId?: string;
  destinationUrl: string;
  secretHash: string;
  eventType: string;
  payload: any;
  attempts?: number;
  maxAttempts?: number;
  status: "PENDING" | "DELIVERED" | "FAILED";
  lastAttemptAt?: Date;
  responseStatus?: number;
  errorMessage?: string;
  createdAt?: Date;
}

export interface IssuerKeyRecord {
  keyId: string;
  algorithm: string;
  publicKeyAx: string;
  publicKeyAy: string;
  publicKeyHash: string;
  encryptedPrivateKey: string;
  isActive: boolean;
  createdAt?: Date;
}

export class DatabaseService {
  private pool: Pool | null = null;
  private isPg = false;

  // In-memory fallback tables (used when DATABASE_URL is not set, e.g. standalone test runs)
  private memoryTenants = new Map<string, TenantRecord>();
  private memoryOidc = new Map<string, OidcSessionRecord>();
  private memoryNonces = new Map<string, NonceRecord>();
  private memoryCursor = new Map<number, IndexerCursorRecord>();
  private memoryEvents = new Map<string, VerifiedEventRecord>();
  private memoryWebhooks = new Map<string, WebhookRecord>();
  private memoryIssuerKeys = new Map<string, IssuerKeyRecord>();

  constructor(customUrl?: string) {
    const dbUrl = customUrl || process.env.DATABASE_URL;
    if (dbUrl) {
      this.pool = new Pool({
        connectionString: dbUrl,
        ssl: dbUrl.includes("supabase.co") || dbUrl.includes("sslmode=require")
          ? { rejectUnauthorized: false }
          : undefined,
      });
      this.isPg = true;
    }
  }

  public isPostgres(): boolean {
    return this.isPg;
  }

  public async init(): Promise<void> {
    const isProduction = process.env.NODE_ENV === "production";
    const hasNetwork = !!process.env.NETWORK;
    const isTest = process.env.NODE_ENV === "test";

    // Fail closed 1: Production or NETWORK set without DATABASE_URL
    if ((isProduction || hasNetwork) && !process.env.DATABASE_URL) {
      throw new Error(
        "[STORAGE_FAIL_CLOSED] Refusing to start: DATABASE_URL is required when NODE_ENV=production or NETWORK is set. In-memory adapter is forbidden."
      );
    }

    // Fail closed 2: In-memory adapter is ONLY permitted when NODE_ENV=test
    if (!this.isPg && !isTest) {
      throw new Error(
        "[STORAGE_FAIL_CLOSED] Refusing to start: In-memory storage adapter is permitted only when NODE_ENV=test. Provide a valid DATABASE_URL."
      );
    }

    // Fail closed 3: If DATABASE_URL is configured, test connection and fail closed if unreachable
    if (this.isPg && this.pool) {
      try {
        await this.pool.query("SELECT 1");
      } catch (connErr: any) {
        throw new Error(
          `[STORAGE_FAIL_CLOSED] Refusing to start: Database connection failed: ${connErr.message}`
        );
      }

      const migrationFile = path.resolve(__dirname, "migrations/001_initial_schema.sql");
      if (fs.existsSync(migrationFile)) {
        const sql = fs.readFileSync(migrationFile, "utf-8");
        await this.pool.query(sql);
      }
    }
  }

  public async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
  }

  // --------------------------------------------------------------------------
  // Tenants
  // --------------------------------------------------------------------------
  public async getTenantByClientId(clientId: string): Promise<TenantRecord | null> {
    if (this.isPg && this.pool) {
      const res = await this.pool.query(
        "SELECT * FROM tenants WHERE client_id = $1 AND is_active = TRUE",
        [clientId]
      );
      if (res.rows.length === 0) return null;
      const row = res.rows[0];
      return {
        id: row.id,
        clientId: row.client_id,
        clientSecretHash: row.client_secret_hash,
        name: row.name,
        redirectUris: Array.isArray(row.redirect_uris) ? row.redirect_uris : JSON.parse(row.redirect_uris || "[]"),
        isActive: row.is_active,
        createdAt: row.created_at,
      };
    }
    const t = this.memoryTenants.get(clientId);
    return t && t.isActive ? t : null;
  }

  public async saveTenant(t: TenantRecord): Promise<void> {
    if (this.isPg && this.pool) {
      await this.pool.query(
        `INSERT INTO tenants (id, client_id, client_secret_hash, name, redirect_uris, is_active)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (client_id) DO UPDATE SET
           name = EXCLUDED.name,
           redirect_uris = EXCLUDED.redirect_uris,
           is_active = EXCLUDED.is_active`,
        [t.id, t.clientId, t.clientSecretHash, t.name, JSON.stringify(t.redirectUris), t.isActive]
      );
    } else {
      this.memoryTenants.set(t.clientId, t);
    }
  }

  // --------------------------------------------------------------------------
  // OIDC Sessions
  // --------------------------------------------------------------------------
  public async storeOidcSession(s: OidcSessionRecord): Promise<void> {
    if (this.isPg && this.pool) {
      await this.pool.query(
        `INSERT INTO oidc_sessions (code, client_id, redirect_uri, code_challenge, code_challenge_method, state, nullifier, scope_id, expires_at, consumed)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [s.code, s.clientId, s.redirectUri, s.codeChallenge, s.codeChallengeMethod, s.state, s.nullifier || null, s.scopeId || null, s.expiresAt, false]
      );
    } else {
      this.memoryOidc.set(s.code, { ...s, consumed: false });
    }
  }

  public async consumeOidcSession(code: string): Promise<OidcSessionRecord | null> {
    if (this.isPg && this.pool) {
      const res = await this.pool.query(
        `UPDATE oidc_sessions
         SET consumed = TRUE
         WHERE code = $1 AND consumed = FALSE AND expires_at > NOW()
         RETURNING *`,
        [code]
      );
      if (res.rows.length === 0) return null;
      const row = res.rows[0];
      return {
        code: row.code,
        clientId: row.client_id,
        redirectUri: row.redirect_uri,
        codeChallenge: row.code_challenge,
        codeChallengeMethod: row.code_challenge_method,
        state: row.state,
        nullifier: row.nullifier,
        scopeId: row.scope_id,
        expiresAt: row.expires_at,
        consumed: row.consumed,
      };
    }
    const s = this.memoryOidc.get(code);
    if (!s || s.consumed || s.expiresAt.getTime() <= Date.now()) return null;
    s.consumed = true;
    return s;
  }

  // --------------------------------------------------------------------------
  // Wallet Nonces
  // --------------------------------------------------------------------------
  public async storeNonce(n: NonceRecord): Promise<void> {
    if (this.isPg && this.pool) {
      await this.pool.query(
        `INSERT INTO wallet_nonces (nonce, address, origin, message, expires_at, consumed)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (nonce) DO UPDATE SET
           expires_at = EXCLUDED.expires_at,
           consumed = EXCLUDED.consumed`,
        [n.nonce, n.address.toLowerCase(), n.origin || null, n.message, n.expiresAt, false]
      );
    } else {
      this.memoryNonces.set(n.nonce, { ...n, address: n.address.toLowerCase() as `0x${string}`, consumed: false });
    }
  }

  public async getNonce(nonce: string): Promise<NonceRecord | null> {
    if (this.isPg && this.pool) {
      const res = await this.pool.query(
        "SELECT * FROM wallet_nonces WHERE nonce = $1",
        [nonce]
      );
      if (res.rows.length === 0) return null;
      const row = res.rows[0];
      return {
        nonce: row.nonce,
        address: row.address,
        origin: row.origin,
        message: row.message,
        expiresAt: new Date(row.expires_at),
        consumed: row.consumed,
      };
    }
    const n = this.memoryNonces.get(nonce);
    if (!n) return null;
    return {
      ...n,
      expiresAt: n.expiresAt instanceof Date ? n.expiresAt : new Date(n.expiresAt),
    };
  }

  public async consumeNonce(nonce: string): Promise<boolean> {
    if (this.isPg && this.pool) {
      const res = await this.pool.query(
        `UPDATE wallet_nonces
         SET consumed = TRUE
         WHERE nonce = $1 AND consumed = FALSE
         RETURNING nonce`,
        [nonce]
      );
      return (res.rowCount ?? 0) > 0;
    }
    const n = this.memoryNonces.get(nonce);
    if (!n || n.consumed) return false;
    n.consumed = true;
    return true;
  }

  // --------------------------------------------------------------------------
  // Indexer Cursor & Verified Events
  // --------------------------------------------------------------------------
  public async getIndexerCursor(chainId: number): Promise<IndexerCursorRecord | null> {
    if (this.isPg && this.pool) {
      const res = await this.pool.query(
        "SELECT * FROM indexer_cursor WHERE chain_id = $1",
        [chainId]
      );
      if (res.rows.length === 0) return null;
      const row = res.rows[0];
      return {
        chainId: Number(row.chain_id),
        lastProcessedBlock: BigInt(row.last_processed_block),
        lastProcessedHash: row.last_processed_hash,
        updatedAt: row.updated_at,
      };
    }
    return this.memoryCursor.get(chainId) || null;
  }

  public async setIndexerCursor(chainId: number, block: bigint, hash: string): Promise<void> {
    if (this.isPg && this.pool) {
      await this.pool.query(
        `INSERT INTO indexer_cursor (chain_id, last_processed_block, last_processed_hash, updated_at)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT (chain_id) DO UPDATE SET
           last_processed_block = EXCLUDED.last_processed_block,
           last_processed_hash = EXCLUDED.last_processed_hash,
           updated_at = NOW()`,
        [chainId, block.toString(), hash]
      );
    } else {
      this.memoryCursor.set(chainId, {
        chainId,
        lastProcessedBlock: block,
        lastProcessedHash: hash,
        updatedAt: new Date(),
      });
    }
  }

  public async recordVerifiedEvent(e: VerifiedEventRecord): Promise<boolean> {
    if (this.isPg && this.pool) {
      const res = await this.pool.query(
        `INSERT INTO verified_events (id, chain_id, block_number, block_hash, tx_hash, scope_id, nullifier, recipient, timestamp)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (chain_id, scope_id, nullifier) DO NOTHING
         RETURNING id`,
        [e.id, e.chainId, e.blockNumber.toString(), e.blockHash, e.txHash, e.scopeId, e.nullifier, e.recipient.toLowerCase(), e.timestamp || new Date()]
      );
      return (res.rowCount ?? 0) > 0;
    }
    const key = `${e.chainId}:${e.scopeId}:${e.nullifier}`;
    if (this.memoryEvents.has(key)) return false;
    this.memoryEvents.set(key, { ...e, recipient: e.recipient.toLowerCase() });
    return true;
  }

  public async rollbackEventsAfterBlock(chainId: number, blockNumber: bigint): Promise<number> {
    if (this.isPg && this.pool) {
      const res = await this.pool.query(
        "DELETE FROM verified_events WHERE chain_id = $1 AND block_number > $2",
        [chainId, blockNumber.toString()]
      );
      return res.rowCount || 0;
    }
    let count = 0;
    for (const [k, v] of this.memoryEvents.entries()) {
      if (v.chainId === chainId && v.blockNumber > blockNumber) {
        this.memoryEvents.delete(k);
        count++;
      }
    }
    return count;
  }

  public async getVerifiedEvents(chainId: number, limit = 50): Promise<VerifiedEventRecord[]> {
    if (this.isPg && this.pool) {
      const res = await this.pool.query(
        "SELECT * FROM verified_events WHERE chain_id = $1 ORDER BY block_number DESC LIMIT $2",
        [chainId, limit]
      );
      return res.rows.map((r) => ({
        id: r.id,
        chainId: Number(r.chain_id),
        blockNumber: BigInt(r.block_number),
        blockHash: r.block_hash,
        txHash: r.tx_hash,
        scopeId: r.scope_id,
        nullifier: r.nullifier,
        recipient: r.recipient,
        timestamp: r.timestamp,
      }));
    }
    const filtered = Array.from(this.memoryEvents.values())
      .filter((e) => e.chainId === chainId)
      .sort((a, b) => (b.blockNumber > a.blockNumber ? 1 : -1))
      .slice(0, limit);
    return filtered;
  }

  // --------------------------------------------------------------------------
  // Generic Signed Webhooks
  // --------------------------------------------------------------------------
  public async enqueueWebhook(w: WebhookRecord): Promise<void> {
    if (this.isPg && this.pool) {
      await this.pool.query(
        `INSERT INTO webhooks (id, tenant_id, destination_url, secret_hash, event_type, payload, attempts, max_attempts, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [w.id, w.tenantId || null, w.destinationUrl, w.secretHash, w.eventType, JSON.stringify(w.payload), w.attempts || 0, w.maxAttempts || 3, w.status]
      );
    } else {
      this.memoryWebhooks.set(w.id, { ...w });
    }
  }

  public async updateWebhookStatus(
    id: string,
    status: "PENDING" | "DELIVERED" | "FAILED",
    responseStatus?: number,
    errorMessage?: string
  ): Promise<void> {
    if (this.isPg && this.pool) {
      await this.pool.query(
        `UPDATE webhooks
         SET status = $1,
             attempts = attempts + 1,
             last_attempt_at = NOW(),
             response_status = $2,
             error_message = $3
         WHERE id = $4`,
        [status, responseStatus || null, errorMessage || null, id]
      );
    } else {
      const w = this.memoryWebhooks.get(id);
      if (w) {
        w.status = status;
        w.attempts = (w.attempts || 0) + 1;
        w.lastAttemptAt = new Date();
        w.responseStatus = responseStatus;
        w.errorMessage = errorMessage;
      }
    }
  }

  public async getPendingWebhooks(): Promise<WebhookRecord[]> {
    if (this.isPg && this.pool) {
      const res = await this.pool.query(
        "SELECT * FROM webhooks WHERE status = 'PENDING' AND attempts < max_attempts ORDER BY created_at ASC LIMIT 20"
      );
      return res.rows.map((r) => ({
        id: r.id,
        tenantId: r.tenant_id,
        destinationUrl: r.destination_url,
        secretHash: r.secret_hash,
        eventType: r.event_type,
        payload: typeof r.payload === "string" ? JSON.parse(r.payload) : r.payload,
        attempts: r.attempts,
        maxAttempts: r.max_attempts,
        status: r.status,
        lastAttemptAt: r.last_attempt_at,
        responseStatus: r.response_status,
        errorMessage: r.error_message,
        createdAt: r.created_at,
      }));
    }
    return Array.from(this.memoryWebhooks.values()).filter(
      (w) => w.status === "PENDING" && (w.attempts || 0) < (w.maxAttempts || 3)
    );
  }

  // --------------------------------------------------------------------------
  // Persisted Issuer Keys
  // --------------------------------------------------------------------------
  public async getActiveIssuerKey(): Promise<IssuerKeyRecord | null> {
    if (this.isPg && this.pool) {
      const res = await this.pool.query(
        "SELECT * FROM issuer_keys WHERE is_active = TRUE ORDER BY created_at DESC LIMIT 1"
      );
      if (res.rows.length === 0) return null;
      const r = res.rows[0];
      return {
        keyId: r.key_id,
        algorithm: r.algorithm,
        publicKeyAx: r.public_key_ax,
        publicKeyAy: r.public_key_ay,
        publicKeyHash: r.public_key_hash,
        encryptedPrivateKey: r.encrypted_private_key,
        isActive: r.is_active,
        createdAt: r.created_at,
      };
    }
    const keys = Array.from(this.memoryIssuerKeys.values()).filter((k) => k.isActive);
    return keys.length > 0 ? keys[0] : null;
  }

  public async saveIssuerKey(k: IssuerKeyRecord): Promise<void> {
    if (this.isPg && this.pool) {
      await this.pool.query(
        `INSERT INTO issuer_keys (key_id, algorithm, public_key_ax, public_key_ay, public_key_hash, encrypted_private_key, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [k.keyId, k.algorithm, k.publicKeyAx, k.publicKeyAy, k.publicKeyHash, k.encryptedPrivateKey, k.isActive]
      );
    } else {
      this.memoryIssuerKeys.set(k.keyId, k);
    }
  }

  public async updateIssuerKeyCiphertext(keyId: string, encryptedPrivateKey: string): Promise<void> {
    if (this.isPg && this.pool) {
      await this.pool.query(
        "UPDATE issuer_keys SET encrypted_private_key = $1 WHERE key_id = $2",
        [encryptedPrivateKey, keyId]
      );
    } else {
      const k = this.memoryIssuerKeys.get(keyId);
      if (k) {
        k.encryptedPrivateKey = encryptedPrivateKey;
      }
    }
  }
}

// Global Singleton Database Instance
export const db = new DatabaseService();
