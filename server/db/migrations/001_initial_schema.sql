-- Pramaan-ZK PostgreSQL Initial Schema
-- Designed for Supabase / PostgreSQL 14+ with Row-Level Security (RLS)

-- 1. Tenants (Relying Parties)
CREATE TABLE IF NOT EXISTS tenants (
    id TEXT PRIMARY KEY,
    client_id TEXT UNIQUE NOT NULL,
    client_secret_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    redirect_uris JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS for tenants
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- 2. OIDC Sessions (Replaces in-memory authSessions Map)
CREATE TABLE IF NOT EXISTS oidc_sessions (
    code TEXT PRIMARY KEY,
    client_id TEXT NOT NULL,
    redirect_uri TEXT NOT NULL,
    code_challenge TEXT NOT NULL,
    code_challenge_method TEXT NOT NULL DEFAULT 'S256',
    state TEXT,
    nullifier TEXT,
    scope_id TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    consumed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_oidc_sessions_client_id ON oidc_sessions(client_id);
CREATE INDEX IF NOT EXISTS idx_oidc_sessions_expires_at ON oidc_sessions(expires_at);

-- 3. Wallet Nonces (Replaces in-memory authNonces Map)
CREATE TABLE IF NOT EXISTS wallet_nonces (
    nonce TEXT PRIMARY KEY,
    address TEXT NOT NULL,
    origin TEXT,
    message TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    consumed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wallet_nonces_address ON wallet_nonces(address);

-- 4. Persistent Indexer Cursor
CREATE TABLE IF NOT EXISTS indexer_cursor (
    chain_id NUMERIC PRIMARY KEY,
    last_processed_block NUMERIC NOT NULL,
    last_processed_hash TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Verified Events (Zero-PII event store)
CREATE TABLE IF NOT EXISTS verified_events (
    id TEXT PRIMARY KEY,
    chain_id NUMERIC NOT NULL,
    block_number NUMERIC NOT NULL,
    block_hash TEXT NOT NULL,
    tx_hash TEXT NOT NULL,
    scope_id TEXT NOT NULL,
    nullifier TEXT NOT NULL,
    recipient TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_verified_events_chain_scope_nullifier 
ON verified_events(chain_id, scope_id, nullifier);

CREATE INDEX IF NOT EXISTS idx_verified_events_block_number ON verified_events(block_number);

-- 6. Generic Signed Webhooks & Delivery Log
CREATE TABLE IF NOT EXISTS webhooks (
    id TEXT PRIMARY KEY,
    tenant_id TEXT,
    destination_url TEXT NOT NULL,
    secret_hash TEXT NOT NULL,
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL,
    attempts INT NOT NULL DEFAULT 0,
    max_attempts INT NOT NULL DEFAULT 3,
    status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING, DELIVERED, FAILED
    last_attempt_at TIMESTAMPTZ,
    response_status INT,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS for webhooks
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;

-- 7. Persisted Issuer Key Records
CREATE TABLE IF NOT EXISTS issuer_keys (
    key_id TEXT PRIMARY KEY,
    algorithm TEXT NOT NULL,
    public_key_ax TEXT NOT NULL,
    public_key_ay TEXT NOT NULL,
    public_key_hash TEXT NOT NULL,
    encrypted_private_key TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

