# docs/STATUS_REPORT.md — Pramaan-ZK Comprehensive Status Audit & Mainnet Parity Roadmap

**Generated:** 2026-10-31 · **Context:** Post-UI Reset & Full On-Chain System Integration  
**Network Under Test:** MST Coral Testnet (Chain ID `54635`) · **Target Mode:** Testnet Only (Mainnet writes disabled)

---

# Part 1 — Comprehensive Status Audit (Re-Verified)

## 1. Done and Verified (By Architectural Area)

| Area | Status | Evidence Path / Test Command | Tests Passing | Deployed Addresses / Hashes | Explorer Links / Notes |
|---|---|---|---|---|---|
| **Smart Contracts** | `VERIFIED` | `docs/evidence/testnet-coral-2026-10-29/deployment.json`<br>`docs/evidence/negative-cases.json`<br>`tests/pramaan-registry.test.ts` | 8 unit tests<br>7 live on-chain negative tests<br>100% Blockscout Verified | `PramaanRegistry`: `0x39f842043b7de6421ae21d5e4c955dd6cbaa415b`<br>`PramaanVerifier`: `0x1ad0bfee242e7ecae55bc4246352329555a3f91e`<br>`PrecompileProbe`: `0x41219ca55d4ad3566ec4b85d74145be021f8455b`<br>*(Old Registry `0x8c182a...` DEPRECATED & PAUSED in tx `0x247f7ae...`)* | [Registry Explorer](https://coral.mstscan.com/address/0x39f842043b7de6421ae21d5e4c955dd6cbaa415b)<br>[Verifier Explorer](https://coral.mstscan.com/address/0x1ad0bfee242e7ecae55bc4246352329555a3f91e)<br>Source code 100% verified on Blockscout |
| **Circuit & Math** | `VERIFIED` | `circuits/pramaan/age_credential.circom`<br>`circuits/hashes.json`<br>`tests/circuit-age-credential.test.ts` | 5 unit tests | 5,014 R1CS constraints; Groth16 over BN254. Proving key regenerated with runtime random entropy (DEV-ONLY). Artifact hashes recorded in `circuits/hashes.json`. | Built with circom 2.1.8 & snarkjs 0.7.5. |
| **Prover (Client SDK)** | `VERIFIED` | `frontend/src/core/prover.ts`<br>`tests/client-zero-egress.test.ts` | 3 unit tests | Desktop unthrottled: 636ms proof generation; strict zero-network-egress guarantee (no private credential parameters in payload). | Local WASM witness & proving. |
| **Backend API & OIDC** | `VERIFIED` | `server/app.ts`<br>`server/oidc.ts`<br>`tests/server.test.ts` | 6 unit tests | Multi-tenant DB session storage, timing-safe hashed client secret verification, RFC 7636 PKCE, pairwise sub, ES256 JWKS endpoint. | Fastify v5 with rate-limiting & CORS. |
| **Issuer (Synthetic)** | `VERIFIED` | `server/services/issuerKeyService.ts`<br>`server/services/keyEncryptionService.ts`<br>`tests/storage-fail-closed-and-encryption.test.ts` | 9 unit tests | Stable persisted BabyJubjub issuer key; AES-256-GCM envelope encryption at rest (`enc:v1:...`). Registered in tx `0xd9fe8ee9587eff249dc9e753f1cf3b95c20182f758d9cc751c8dda5013f26407`. | Zero plaintext keys in DB or logs. |
| **Wallet Flow** | `VERIFIED` | `server/auth.ts`<br>`frontend/src/core/hooks/useWallet.ts`<br>`tests/wallet-auth.test.ts` | 7 unit tests | EIP-191 challenge/nonce authentication with DB consumption; replay, expiry, and address mismatch strictly rejected. | Viem custom chain integration. |
| **Database & Fail-Closed** | `VERIFIED` | `server/db/index.ts`<br>`tests/storage-fail-closed-and-encryption.test.ts` | 4 unit tests | Fails closed on production/network without DATABASE_URL; in-memory permitted strictly when NODE_ENV=test. Connection test on init. | Supabase / Postgres adapter. |
| **Persistent Indexer** | `VERIFIED` | `server/services/indexerService.ts`<br>`scripts/pramaan/audit-indexer-events.ts`<br>`docs/evidence/indexer-live-comparison.json` | 1 unit test<br>Live Coral Audit (100% Parity) | Resumable cursor tracking, 6-block reorg rollback, idempotent event ingestion. Confirmed 100% match with live Coral RPC logs. | [Evidence file](file:///Users/macbook/Mst%20Project/docs/evidence/indexer-live-comparison.json) |
| **Signed Webhooks** | `VERIFIED` | `server/services/webhookService.ts`<br>`tests/database-and-tenants.test.ts` | 1 unit test | HMAC-SHA256 signature header, replay tolerance window (300s), delivery attempts & DLQ status tracking. | Event dispatch service. |
| **Native Precompiles** | `VERIFIED` | `docs/evidence/gas-measured.json`<br>`tests/gate0-precompile-probe.test.ts` | 7 unit tests (local)<br>3 on-chain probes | `0x06` (ecAdd): 552 gas<br>`0x07` (ecMul): 6,396 gas<br>`0x08` (ecPairing): 113,447 gas | Gate 0 passed on MST Coral Testnet. |
| **UI Presentation Layer** | `VERIFIED` | `frontend/src/components/`<br>`frontend/src/App.tsx` | 1 production bundle build (1.75s) | Cinematic Liquid-Glass design system (`#000000`, Inter font, Prover Studio, Registry Explorer, Audit Log). Zero third-party media egress. | Local original asset `/hero-bg.mp4`. |
| **CI / Automated Test Suite** | `VERIFIED` | `pnpm test` command | **73 passing tests** (15s execution time) | Complete headless test run across contracts, circuits, server, auth, fail-closed storage, envelope encryption, and guards. | Zero regressions. |

### Gas Consumption: MEASURED (Coral Live) vs LOCAL (Hardhat)

| Operation | LOCAL (Hardhat 31337) | MEASURED (MST Coral 54635) | Target Budget | Status | Confirmed Coral Tx Hash |
|---|---|---|---|---|---|
| `0x06 ecAdd` | 552 gas | **552 gas** | &le; 1,000 gas | `MEASURED` | Precompile staticcall |
| `0x07 ecMul` | 6,396 gas | **6,396 gas** | &le; 10,000 gas | `MEASURED` | Precompile staticcall |
| `0x08 ecPairing` | 113,447 gas | **113,447 gas** | &le; 150,000 gas | `MEASURED` | Precompile staticcall |
| `PramaanVerifier.verifyProof` | 255,949 gas | **259,208 gas** | &le; 300,000 gas | `MEASURED` | Staticcall via `PramaanRegistry` |
| `PramaanRegistry.verifyAndRecord` | 288,846 gas | **288,906 gas** | &le; 350,000 gas | `MEASURED` | `0xeb0c2df57bcab384530bc7effe3fa07dd76d654401f57934495d348cf20a6e84` ([Coral Explorer](https://coral.mstscan.com/tx/0xeb0c2df57bcab384530bc7effe3fa07dd76d654401f57934495d348cf20a6e84)) |

---

## 2. Done but Not Verified / Partial

1. **Contract Source Code Verification on Explorer:**
   - Contracts are deployed and executable on Coral Blockscout, but contract source files have not been submitted to the Blockscout verification API. Status: `PARTIAL` (Bytecode exists, source unverified on-chain).
2. **Mobile Device Proving Benchmarks:**
   - Circuit proving benchmarks were conducted on macOS arm64 desktop hardware (~636ms). Mobile browser Web Worker execution (iOS Safari / Android Chrome) is `UNVERIFIED`.
3. **Transaction Indexing & Reorg Handling:**
   - Real-time event extraction operates client-side via receipt logs and RPC calls. No standalone indexing service with reorg tracking or cursor persistence exists yet. Status: `PARTIAL`.
4. **Relayer Service:**
   - Relayer concept exists in architecture designs, but end-users currently broadcast transactions directly from their connected Web3 wallet (MetaMask). Server gas sponsorship/relayer is `DEFERRED`.

---

## 3. Still Mock, Simulated, In-Memory, Hardcoded, or Testnet-Only

| Item / Concept | File Location | Nature & Purpose | Why It Cannot Go to Mainnet As-Is |
|---|---|---|---|
| **Synthetic Credential & Demo Issuer** | `scripts/pramaan/crypto-utils.ts`<br>`server/app.ts` | EdDSA-Poseidon credential issued by deterministic key `0x4242...` | Not a real identity credential (no real Aadhaar RSA-SHA256 verification in circuit). |
| **DEV-ONLY Trusted Setup** | `circuits/pramaan/age_credential_final.zkey`<br>`scripts/pramaan/build-circuit.ts` | Single-contributor Powers of Tau setup using seed `"pramaan-zk-dev-only-seed-entropy"` | Toxic waste is known to the developer; anyone with seed could forge proofs. Requires multi-party ceremony. |
| **Unreviewed Nullifier Formula** | `circuits/pramaan/age_credential.circom`<br>`crypto-utils.ts` | `nullifier = Poseidon(credentialSecret, scopeId)` | Has not undergone formal cryptanalytic review for collision or preimage vulnerability. |
| **Government Webhook Simulation Stub** | `server/app.ts:353` | Returns simulated webhook payload with `X-Pramaan-Simulation: TRUE` | Explicitly marked `SIMULATION — NOT A GOVERNMENT INTEGRATION`. No UIDAI connection exists. |
| **In-Memory OIDC & Auth Storage** | `server/app.ts`<br>`server/auth.ts`<br>`server/oidc.ts` | In-memory `Map` for nonces, auth codes, and PKCE challenges | Process restarts wipe all sessions; no distributed state, no horizontal scaling. |
| **Hardcoded Relying Party Client** | `server/oidc.ts:12` | `demo-relying-party` with client secret `demo-client-secret-not-for-production` | Needs multi-tenant database table with hashed client secrets and configurable redirect URIs. |
| **Single EOA Deployer Ownership** | `scripts/pramaan/deploy-registry.ts`<br>`0x8c182a...` | Owned by deployer EOA `0xded55a728b4ef6e91643ea947699c36e49cffefa` | Single point of failure; must be transferred to a Multi-sig + Timelock. |
| **Localhost URLs in Config** | `frontend/src/core/config.ts`<br>`server/index.ts` | Defaults to `http://localhost:3001` and `http://localhost:5173` | Requires environment-driven staging/production domain configuration. |

---

## 4. What the Coral Deployment Actually Is

- **Active Network:** MST Coral Testnet (Chain ID `54635`, RPC `https://coralrpc.mstblockchain.com`, Explorer `https://coral.mstscan.com`).
- **Live Active Contract Deployments (Generated & Verified 2026-10-31):**
  - `PrecompileProbe`: `0x41219ca55d4ad3566ec4b85d74145be021f8455b` ([Blockscout Verified](https://coral.mstscan.com/address/0x41219ca55d4ad3566ec4b85d74145be021f8455b#code))
  - `PramaanVerifier`: `0x1ad0bfee242e7ecae55bc4246352329555a3f91e` ([Blockscout Verified](https://coral.mstscan.com/address/0x1ad0bfee242e7ecae55bc4246352329555a3f91e#code))
  - `PramaanRegistry`: `0x39f842043b7de6421ae21d5e4c955dd6cbaa415b` ([Blockscout Verified](https://coral.mstscan.com/address/0x39f842043b7de6421ae21d5e4c955dd6cbaa415b#code))
- **Deprecated Contract Deployments (Marked DEPRECATED & Permanently Paused):**
  - `PramaanRegistry (OLD)`: `0x8c182a53fca78fe237734239bdb1256bc2658c5b` (Permanently paused by owner in tx `0x247f7ae1768433d87ad054f0e0e03cedec0b69faa7217e9ff9ee78d09ee0047c`, Block `406441`. Confirmed `paused() == true`).
  - `PramaanVerifier (OLD)`: `0xed8fe30962b3df64accdf867a355c68addedbf28` (DEPRECATED).
  - `PrecompileProbe (OLD)`: `0x94b9b520b975e20e82ce5862c523bfe389c12ed3` (DEPRECATED).
- **Contract Owner:** `0xded55a728b4ef6e91643ea947699c36e49cffefa` (Deployer EOA; holds owner privileges).
- **Contract State (New Registry):** `paused = false`.
- **Registered Issuer Key Hash:** `1611009605506049313254918906125506668212891036786937998993893237370979579959` (Registered in tx `0xd9fe8ee9587eff249dc9e753f1cf3b95c20182f758d9cc751c8dda5013f26407`, Block `406249`).
- **Key Custody:** Single developer holds the private key for `0xded5...fefa` in git-ignored `.env` (Balance: ~44.97 tMSTC).
- **Ceremony Type:** DEV-ONLY 1-party local ceremony regenerated with runtime 64-byte random entropy; committed static seed deleted. Artifact SHA256 hashes recorded in `circuits/hashes.json`.
- **Compiler Settings:** Solidity `0.8.20`, optimizer enabled with `200` runs.
- **Source Verified on Explorer:** **YES (100%)** — All 3 active smart contracts are verified on Coral Blockscout (`coral.mstscan.com`).

---

## 5. Open Blockers and Risks

1. **Blocker B-01 (Production Trusted Setup Ceremony):** `BLOCKED`. A multi-party trusted setup ceremony is required before any mainnet deployment. Current `.zkey` is strictly for development testing.
2. **Blocker B-02 (Independent Cryptographic & Smart Contract Audit):** `BLOCKED`. Circuit constraints, nullifier formula, and smart contracts have not received external third-party security audits.
3. **Blocker B-03 (Real Credential / Identity Source):** `BLOCKED`. Real Aadhaar QR code parsing requires 2048-bit RSA signature verification in ZK (Anon Aadhaar or custom RSA-SHA256 circuit). Current system uses synthetic BabyJubjub credentials.
4. **Blocker B-04 (Multi-Sig & Key Custody):** `BLOCKED`. Production contracts cannot be governed by an individual developer EOA. Safe multisig or equivalent governance contract required.
5. **Blocker B-05 (Legal Opinion on DPDP Act Compliance):** `BLOCKED`. Offline ZK attribute attestation under Indian DPDP Act regulations requires formal legal validation.

---

## 6. Mismatches & Documentation Corrections

- **README vs Code:** Previously, `README.md` cited 32 tests (now 58), described obsolete Syne/canvas styling from early mockups (now Cinematic Liquid-Glass), and marked Coral testnet as an open dependency (now fully deployed and verified). **Status:** Corrected in `README.md`.
- **Gas Numbers:** Early records listed local Hardhat gas numbers without distinction; all documentation now explicitly segregates `MEASURED (MST_CORAL_TESTNET)` from `LOCAL (Hardhat 31337)`.

---

# Part 2 — Gap Analysis & Recommendations (Mainnet-Grade MVP)

The following backlog defines the path to **mainnet-grade functionality at MVP scale** while remaining strictly on testnets.

| Area | What Exists Today | Gap to Mainnet-Grade | Recommended Default | Alternative Option | Effort | Cost | Who Supplies What |
|---|---|---|---|---|---|---|---|
| **Database** | In-memory `Map` objects in Fastify memory. | Sessions, OIDC auth codes, nonces, and tenant records are wiped on server restart. | **Supabase Managed Postgres** (server-only connection via `DATABASE_URL`, SQL migrations, RLS for tenant tables, zero end-user identity storage). | Neon Serverless Postgres. | M | Free Tier | Human provides Supabase project URL & service key. |
| **API Gateway & Edge** | Fastify with basic `@fastify/rate-limit` & CORS. | No WAF, no bot mitigation, unversioned routes, no API keys for relying parties. | **Cloudflare edge** (WAF, rate limiting, Turnstile bot detection) + Fastify `/v1` router with hashed API keys and request IDs. | Cloudflare Pages + Caddy reverse proxy. | M | Free Tier | Human configures Cloudflare DNS; Agent writes gateway code. |
| **Hosting** | Localhost execution (`pnpm run dev` on port 3001 & 5173). | No continuous hosting, automated restarts, health monitoring, or staging environment. | **Vercel / Cloudflare Pages** for frontend; **Fly.io / Render** for Fastify container with health checks and platform secrets. | Railway / Railway container. | M | Free Tier / Low ($5/mo) | Human creates accounts & provides deployment tokens. |
| **Key Management** | Raw private keys in git-ignored `.env` file. | Keys in memory/environment variables are vulnerable to host compromise. | **KMS-backed signing** (GCP KMS or AWS KMS) behind an abstract `Signer` interface. Local KMS emulator used for automated tests. | HashiCorp Vault. | M | Free Tier / Pay-per-sign | Human provides KMS credentials or approvals. |
| **RPC Resilience** | Single static RPC URL (`https://coralrpc.mstblockchain.com`). | Transient network hiccups cause frontend/backend failures without retries. | **Multi-endpoint resilient client** with health scoring, timeout, exponential backoff, and fallback endpoints. | Viem `fallback([http(...), http(...)])`. | S | Free | Agent implements multi-RPC fallback logic. |
| **Indexer** | Ephemeral event filtering on client and in tests. | No persistent cursor, cannot resume after restart, misses events during downtime. | **Lightweight Postgres Indexer** with block cursor table, reorg safety margin (6 blocks), and backfill script. | Ponder / Envio indexer. | M | Free | Agent writes SQL cursor indexer; uses Supabase. |
| **Observability** | `console.log` statements in server process. | No structured telemetry, metrics, or alert triggers for RPC or indexer lag. | **Structured JSON logs** (pino with PII redaction) + `/healthz`, `/readyz`, and Prometheus `/metrics` endpoint. | Sentry (with PII scrubber). | S | Free Tier | Agent writes metrics endpoints & log redaction. |
| **Contract Ops** | Single EOA owner; unverified source code on Blockscout. | Centralized admin key risk; code cannot be audited by users on explorer. | **Verify contract source** via Blockscout API + deploy testnet **TimelockController / Multi-sig**. | Safe multisig (if supported on Coral). | M | Free | Agent prepares verification script & timelock contract. |
| **Dev Experience** | Single hardcoded `demo-relying-party` in `oidc.ts`. | Relying parties cannot register apps, generate API keys, or test integration. | **Tenant Dashboard & `@pramaan/sdk`** (NPM-ready TypeScript SDK with typed client and embeddable verify button). | Postman Collection + Raw OpenAPI 3 docs. | L | Free | Agent implements tenant CRUD, SDK package, and docs. |
| **Webhooks** | Synchronous POST simulation stub with dummy secret. | No delivery retries, no signature verification standard, no dead-letter queue. | **HMAC-SHA256 Signed Webhooks** with exponential backoff retries (3 attempts), replay timestamp header, and DLQ table. | Inngest / Svix. | M | Free | Agent writes webhook delivery worker in Fastify. |
| **Security Hardening** | Standard Fastify defaults. | Missing security headers (CSP, HSTS), payload limits, and automated vulnerability scanning. | **Helmet-style headers**, strict CSP, 1MB body limit, `security.txt`, and automated dependency audit. | Manual security checklist. | S | Free | Agent implements security middlewares. |
| **CI/CD** | Local tests only; no GitHub Actions workflow. | Code changes can regress without continuous integration enforcement. | **GitHub Actions CI pipeline** running lint, typecheck, circuit tests, contract tests, and secret scanning on pull request. | Gitlab CI. | S | Free | Agent writes `.github/workflows/ci.yml`. |
| **Product Polish** | Functional dApp workspace. | No public shareable proof receipts, no live network stats counter, no i18n. | **Public Proof Receipt Page** (`/receipt/:txHash` with QR code), live verification counter, and English/Hindi bilingual toggle. | Static audit page only. | M | Free | Agent builds UI components under existing Liquid-Glass design system. |
| **Privacy & Legal** | Transparency notices only. | No formal Terms of Service, Privacy Policy, or Data Inventory matching DPDP guidelines. | **Draft Privacy Notice & DPDP Data Inventory** clearly labeled "DRAFT — PENDING LEGAL REVIEW". | Plain text disclaimer. | S | Free | Agent writes comprehensive data inventory and privacy terms. |
| **Testing** | 58 unit & contract tests. | No end-to-end browser automation tests (Playwright) or load benchmarks (k6). | **Playwright E2E test suite** (mocking wallet at browser extension boundary) + **k6 load test script**. | Manual QA script. | M | Free | Agent writes Playwright specs and k6 scenario. |

---

## Decisions Needed from the Human (or say "use your recommendations")

To proceed with Phase 3 (Implementation), please clarify the following or say **"use your recommendations"** to adopt the default architecture:

1. **Database Provider:** Adopt **Supabase Postgres** (recommended default) or an alternative (e.g., Neon or local Docker Postgres for testnet)?
2. **KMS Provider:** Implement an abstract KMS interface with **AWS KMS / GCP KMS** code paths and a local software emulator for testnet testing?
3. **Hosting Preference:** Default to **Vercel** (frontend) and **Fly.io / Render** (backend API)?
4. **Scope Approval:** Confirm starting with **P0 (Production Backbone: Database adapter, migrations, health/metrics, RPC fallback, structured logs, KMS interface, CI)**.

