-- ==============================================================================
-- 002_enable_rls.sql
-- Pramaan-ZK Row-Level Security (RLS) Enforcement
-- Server connects via dedicated backend role (postgres / service role).
-- Strict Deny-All for public/anon/authenticated roles.
-- ==============================================================================

-- 1. Enable & Force RLS on Tenants Table
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants FORCE ROW LEVEL SECURITY;

-- 2. Enable & Force RLS on OIDC Sessions Table
ALTER TABLE oidc_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE oidc_sessions FORCE ROW LEVEL SECURITY;

-- 3. Enable & Force RLS on Wallet Nonces Table
ALTER TABLE wallet_nonces ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_nonces FORCE ROW LEVEL SECURITY;

-- 4. Enable & Force RLS on Indexer Cursor Table
ALTER TABLE indexer_cursor ENABLE ROW LEVEL SECURITY;
ALTER TABLE indexer_cursor FORCE ROW LEVEL SECURITY;

-- 5. Enable & Force RLS on Verified Events Table
ALTER TABLE verified_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE verified_events FORCE ROW LEVEL SECURITY;

-- 6. Enable & Force RLS on Webhooks Table
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhooks FORCE ROW LEVEL SECURITY;

-- 7. Enable & Force RLS on Issuer Keys Table
ALTER TABLE issuer_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE issuer_keys FORCE ROW LEVEL SECURITY;

