# Pramaan-ZK — Privacy-Preserving Zero-Knowledge Attribute Verification

> **Honesty Notice:** *Synthetic testnet credential. Real Aadhaar QR support is future work (milestone M2).*  
> This system proves that an attribute statement holds (e.g. *credential holder age &ge; 18*); it **never** claims "identity verified by government". All write interactions remain strictly on testnets.

---

## 1. What is Pramaan-ZK?

**Pramaan-ZK** is a zero-knowledge attribute verification protocol designed for the **MST Blockchain** ecosystem. It enables individuals to prove statements about their credentials (currently **age &ge; 18**) purely client-side using **Groth16 zk-SNARKs** over the BN254 elliptic curve without leaking their date of birth, name, photo, or government identity number.

Proofs can be verified across three distinct channels:
1. **Channel A (Web3):** Smart contracts on MST Coral Testnet (`PramaanVerifier.sol` and `PramaanRegistry.sol`) verifying Groth16 proofs via EVM precompiles (`0x06`, `0x07`, `0x08`) and tracking scoped nullifiers.
2. **Channel B (Web2):** An OIDC-lite gateway issuing signed JWT ID tokens with pairwise pseudonymous subjects (`sub = HMAC(nullifier, clientId)`) via PKCE authorization code flow.
3. **Channel C (Government/DPI):** A signed-webhook simulation stub clearly marked as an operational prototype (`SIMULATION — NOT A GOVERNMENT INTEGRATION`).

---

## 2. System Architecture

```mermaid
flowchart TD
    subgraph Client["Client Browser (Zero-PII Egress)"]
        A["Synthetic Credential\n(Signed by DEMO ISSUER via BabyJubjub EdDSA)"] --> B["AgeCredential.circom\n(5,014 R1CS Constraints)"]
        B --> C["SnarkJS Prover (WASM)\nComputes Groth16 Proof (BN254)"]
        C --> D["Proof & Public Signals\n(Nullifier, Scope, Recipient, ChainId)"]
    end

    subgraph ChannelA["Channel A: Web3 Smart Contracts (MST Coral Testnet 54635)"]
        D -->|On-Chain Tx| E["PramaanRegistry.sol\n(Replay & Recipient Guard)"]
        E -->|staticcall| F["PramaanVerifier.sol\n(BN254 0x06, 0x07, 0x08 Precompiles)"]
        E --> G["Nullifier Storage\nisNullifierSpent[scopeId][nullifier]"]
    end

    subgraph ChannelB["Channel B: Web2 OIDC Gateway"]
        D -->|Off-Chain Verify| H["Fastify OIDC Gateway\n(RFC 7636 PKCE)"]
        H --> I["Pairwise Sub:\nHMAC(nullifier, clientId)"]
        I --> J["Consumer Relying Party App\n(Receives age_over_18: true)"]
    end

    subgraph ChannelC["Channel C: Simulated Enterprise Stub"]
        H --> K["Signed Webhook Simulation Stub\n(HMAC-SHA256 Header)"]
    end
```

---

## 3. Transparency Table: What is Real, Mocked, & Unverified

| Feature / Layer | Implementation Status | Evidence / Notes |
|---|---|---|
| **MST Coral Testnet Contracts** | `REAL & DEPLOYED` | `PramaanVerifier` (`0x1ad0bfee...`), `PramaanRegistry` (`0x39f84204...`), and `PrecompileProbe` (`0x41219ca5...`) deployed on Chain 54635 and 100% verified on Blockscout. Old registry `0x8c182a53...` is permanently paused. |
| **BN254 EVM Precompiles** | `REAL & MEASURED` | Measured on live Coral Testnet: `0x06` (552 gas), `0x07` (6,396 gas), `0x08` (113,447 gas). |
| **On-Chain Gas Consumption** | `REAL & MEASURED` | `PramaanVerifier.verifyProof`: 259,208 gas; `PramaanRegistry.verifyAndRecord`: 288,906 gas on MST Coral Testnet. |
| **Circuit & Prover** | `REAL & VERIFIED` | `AgeCredential.circom` compiles to 5,014 constraints; snarkjs generates valid Groth16 proofs client-side in ~636ms (desktop unthrottled). Artifact hashes in `circuits/hashes.json`. |
| **On-Chain Negative Paths** | `REAL & TESTED` | 7/7 negative paths verified on Coral testnet: tampered proof, unregistered issuer, chain mismatch, recipient mismatch, nullifier spent (replay), contract paused, tampered public signal. |
| **Fastify API & OIDC-Lite** | `REAL & TESTED` | Fastify + `jose` issuing ES256 signed ID tokens with PKCE code verification, backed by PostgreSQL migrations, multi-tenant hashing, and envelope encryption. |
| **Credential Container** | `SYNTHETIC (DEMO)` | EdDSA-Poseidon signature over BabyJubjub curve issued by persisted authority key. Real Aadhaar RSA-in-circuit is milestone M2. |
| **Nullifier Formula** | `UNREVIEWED (DEMO)` | `nullifier = Poseidon(credentialSecret, scopeId)`. Unreviewed primitive; not formally audited. |
| **Ceremony** | `DEV-ONLY` | Regenerated with runtime 64-byte random entropy (DEV-ONLY). Production multi-party ceremony required before release. |
| **Database & Fail-Closed Storage** | `REAL & FAIL-CLOSED` | PostgreSQL database with SQL migrations and Row-Level Security (RLS). Server strictly fails closed outside `NODE_ENV=test` if `DATABASE_URL` is missing. |
| **Government Channel** | `SIMULATED STUB` | Signed webhook simulation stub. Not a live government integration. |
| **Contract Source on Explorer** | `100% VERIFIED` | Source code 100% verified with green checkmarks on Coral Blockscout (`coral.mstscan.com`). |
| **Contract Ownership** | `EOA SINGLE KEY` | Deployed and owned by single developer EOA (`0xded55a728b4ef6e91643ea947699c36e49cffefa`); multisig/timelock not yet configured. |

---

## 4. UI Architecture & Design System

The frontend is built on a **Cinematic Liquid-Glass Design System**:
- **Canvas:** Pure OLED Black (`#000000`).
- **Materials:** Multi-layer liquid glass cards (`.liquid-glass`) with luminosity blending, backdrop blur, inset specular highlights, and 1.4px gradient masked borders.
- **Typography:** **Inter** font family loaded with geometric tracking.
- **Operational Modules:**
  - **Overview:** Live network telemetry (5,014 constraints, 288k gas, block progression) and contract cards with direct links to Coral Blockscout.
  - **Prover Studio:** 3-step proof lifecycle (Synthetic Attestation &rarr; Local In-Browser WASM Proof &rarr; Coral Settlement).
  - **Registry Explorer:** Live interactive on-chain query tool for nullifier spent status and issuer authority.
  - **Audit Log:** On-chain transaction receipt auditor decoding `ProofVerifiedAndRecorded` event logs and gas metrics.
  - **Coral Explorer:** Direct link to block explorer.

---

## 5. Quickstart & Verification Commands

### Prerequisites
- **Node.js:** `v22.23.1` (or `>= 20.x`)
- **pnpm:** `11.13.0` (or `>= 9.x`)
- **Circom:** `v2.1.8` (for compiling circuits)

### Installation
```bash
# Clone repository
git clone https://github.com/Shantanu112-bd/Zentity.git
cd Zentity

# Install dependencies
pnpm install
```

### Run Full Test Suite
```bash
# Runs 74 automated unit, circuit, smart contract, fail-closed, and zero-egress tests
pnpm test
```

### Build Frontend
```bash
# Compiles Vite production bundle into frontend/dist
pnpm run build:frontend
```

### Preflight Live Network Check
```bash
# Queries live MST Coral Testnet RPC (54635)
pnpm run preflight:coral
```

### Database Connection String (Supabase Connection Pooler)
Pramaan-ZK connects to managed PostgreSQL using the Supabase **Connection Pooler** (which provides IPv4 network routing and transaction pooling):

```bash
# In your local .env (or Render / Railway / Fly secret store):
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-1-[REGION].pooler.supabase.com:6543/postgres"
```

> **Supabase Configuration:**
> 1. In Supabase Dashboard &rarr; **Project Settings** &rarr; **Database** &rarr; **Connection string**.
> 2. Select **URI** &rarr; select **Transaction** (port `6543`) or **Session** (port `5432`).
> 3. Check **Use connection pooling**. (Do not use direct `db.[ref].supabase.co` as direct connection is IPv6-only).
> 4. If your password contains punctuation (e.g. `%`, `#`), reset it in **Database password** &rarr; **Reset database password** to an alphanumeric passphrase so URI parsers do not alter it.

### Start Local Database (Postgres Alternative)
If developing locally without an active cloud database, you can run PostgreSQL via Docker Compose:

```bash
# Start local PostgreSQL via Docker Compose (maps port 5432)
docker compose up -d

# Add connection string to your .env
echo 'DATABASE_URL="postgres://postgres:postgres@localhost:5432/pramaan"' >> .env
```

### Run Migrations & RLS Verification
```bash
# Runs 001_initial_schema.sql and 002_enable_rls.sql, audits RLS status, and saves docs/evidence/
pnpm run migrate:db
```

### Fresh Database Setup — Exact Order of Operations
When connecting to a brand-new PostgreSQL database (Supabase or local):
1. **Set `DATABASE_URL`**: Add the Supabase pooler connection URI to `.env` (or cloud host secret manager).
2. **Execute Schema & RLS Migrations**:
   ```bash
   pnpm run migrate:db
   ```
   Applies `001_initial_schema.sql` and `002_enable_rls.sql`, forces RLS on all 7 tables, and verifies zero public/anon leaks.
3. **Start API Server (Seeds Tenants & Key)**:
   ```bash
   pnpm run server
   ```
   Auto-seeds default tenant (`pramaan-relying-party-alpha`) and initializes the encrypted BabyJubjub issuer key at rest.
4. **Check & Register Issuer On-Chain**:
   ```bash
   pnpm issuer:status
   # If unregistered:
   pnpm issuer:register
   ```
   Registers the database-backed issuer key hash on `PramaanRegistry.sol` using deployer credentials in local `.env` (never on cloud hosts).
5. **Start Blockchain Indexer Worker**:
   ```bash
   npx tsx scripts/pramaan/indexer-worker.ts
   ```
   Resumes cursor from database and syncs verified events on Coral Testnet.

### Start Development Server
```bash
# Runs backend gateway (:3001) and Vite React app (:5173) concurrently
pnpm run dev
```
Open **http://localhost:5173** in your browser.

### Verify On-Chain Transaction Evidence
```bash
# Audits receipt, decodes event logs, verifies nullifier state, and records evidence in docs/evidence/
pnpm verify:tx <TRANSACTION_HASH>
```

---

## 6. Live Deployments & Environment Variables

### Verified Smart Contracts (MST Coral Testnet - Chain 54635)
* **PramaanRegistry:** [`0x39f842043b7de6421ae21d5e4c955dd6cbaa415b`](https://coral.mstscan.com/address/0x39f842043b7de6421ae21d5e4c955dd6cbaa415b) (Blockscout Verified)
* **PramaanVerifier:** [`0x1ad0bfee242e7ecae55bc4246352329555a3f91e`](https://coral.mstscan.com/address/0x1ad0bfee242e7ecae55bc4246352329555a3f91e) (Blockscout Verified)
* **PrecompileProbe:** [`0x41219ca55d4ad3566ec4b85d74145be021f8455b`](https://coral.mstscan.com/address/0x41219ca55d4ad3566ec4b85d74145be021f8455b) (Blockscout Verified)
* *Old Deprecated Registry:* `0x8c182a53fca78fe237734239bdb1256bc2658c5b` (Permanently paused in block `406441`, tx `0x247f7ae1...`)

### Production Hosting Configuration

#### Frontend: Vercel / Cloudflare Pages
* **Root Directory:** `./` (or `frontend`)
* **Build Command:** `pnpm run build:frontend` (or `pnpm run build` if root is `frontend`)
* **Output Directory:** `frontend/dist` (or `dist` if root is `frontend`)
* **Framework:** Vite
* **Environment Variables:**
  | Variable | Type | Description |
  |---|---|---|
  | `VITE_API_URL` | Public | URL of deployed Fastify backend (e.g. `https://pramaan-api.onrender.com`) |
  *(Note: Never prefix database URLs, master keys, or private keys with `VITE_`)*

#### Backend API & Indexer Worker: Render / Railway / Fly.io
* **Health Check Path:** `/healthz`
* **Docker:** Multi-stage `Dockerfile` (Node 22 Alpine, port `3001`)
* **Render Manifest:** `render.yaml` (includes `pramaan-zk-api` web service and `pramaan-zk-indexer` worker)
* **Environment Variables:**
  | Variable | Type | Description |
  |---|---|---|
  | `DATABASE_URL` | **SECRET** | Managed PostgreSQL connection string (Supabase pooler on port 6543/5432) |
  | `ISSUER_MASTER_KEY` | **SECRET** | 64-character hex master key for AES-256-GCM envelope encryption of issuer keys |
  | `FRONTEND_ORIGIN` | Config | Allowed origin for strict CORS (e.g. `https://pramaan-zk.vercel.app`) |
  | `MST_CORAL_TESTNET_RPC` | Config | `https://coralrpc.mstblockchain.com` |
  | `PORT` | Config | `3001` |
  | `NODE_ENV` | Config | `production` |

---

## 7. Limits & Explicit Boundary Conditions

> [!CAUTION]
> **Strict Operational Limits (Production Gates Blocked):**
> 1. **Synthetic Testnet Issuer Only:** The current issuer signs self-entered dates of birth using an in-protocol BabyJubjub key. It does **not** consume or verify real Aadhaar XML, QR data, or government identity records. No UIDAI relationship or regulatory authorization exists.
> 2. **DEV-ONLY Trusted Setup:** Circuit proving keys were generated using a local single-party ceremony with runtime entropy. A production deployment strictly requires an open multi-party trusted setup (MPC) before high-value deployment.
> 3. **Unreviewed Nullifier Formula:** The nullifier derivation `Poseidon(credentialSecret, scopeId)` is an MVP construction and has **not** undergone peer-reviewed cryptanalytic publication or formal auditing.
> 4. **No Smart Contract or Security Audit:** Smart contracts and circuits have been verified against 7/7 automated on-chain negative cases, but have **not** received an external third-party security audit.
> 5. **No Legal or Regulatory Approval:** This software is an engineering proof-of-concept for Zero-Knowledge attribute proofs and carries no legal, regulatory, or governmental compliance certification.
> 6. **Single EOA Admin Key:** Contract ownership on MST Coral Testnet currently belongs to a single developer EOA; ownership has not yet been transferred to a multisig or timelock contract.

---

## 8. License
GPL-3.0 / MIT.
