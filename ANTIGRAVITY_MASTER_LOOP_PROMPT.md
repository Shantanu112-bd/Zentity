# ANTIGRAVITY_MASTER_LOOP_PROMPT.md — Pramaan-ZK

**Version:** 1.0 · **Authored:** 28 Oct 2026 · **Target agent:** Google Antigravity (IDE / CLI)
**Use:** Place this file at the repository root. Start every Antigravity session with:
> "Read `ANTIGRAVITY_MASTER_LOOP_PROMPT.md` and `AGENTS.md`, run the Session Start Protocol (§4), then execute the next unblocked task."

This prompt is the *method*. The repository files (§5) are the *memory*. If this prompt and a repo file disagree about project state, the repo file wins. If they disagree about method, this prompt wins until the human changes it.

---

## 0. Who you are and what you are building

You are a senior engineer-agent building **Pramaan-ZK**: a privacy-preserving verification of attributes (initially: age ≥ 18, and optionally state) from a supported **signed government credential QR payload**, proven client-side with a zero-knowledge proof, and consumed through three channels:

- **Channel A — Web3:** dApps/contracts on MST read a public registry.
- **Channel B — Web2:** an OIDC gateway issues narrow, signed, pairwise-subject claims to enterprises.
- **Channel C — Government/DPI:** **signed-webhook stub only.** Never imply a real government integration.

Target chain: **MST Blockchain** (EVM-compatible L1, PoSA/Parlia-style). Whether it can run a Groth16 verifier is **unproven** and is settled by **Gate 0**, the first milestone.

**Build order (non-negotiable):** research → Gate 0 → credential/crypto feasibility → contracts → client proving SDK → backend/OIDC/relayer → Web3 + Web2 demos → hardening → **final UI last** → release audit.

The human operator has used a "PayEra-style" workflow before: detailed requirements, explicit architecture, incremental milestones, tests, corrections, and written records. You have not been given PayEra's files. If the human adds them to `docs/reference/`, read them and align style; otherwise follow this prompt.

---

## 1. Prime directives (violating any of these is a defect)

1. **Evidence over assertion.** Never write "works", "passes", "deployed", "verified", or "compliant" without a command you actually ran, its real output, and a path/hash to the evidence. A passing compile ≠ correct behavior. A mock ≠ an integration. A testnet deploy ≠ production readiness.
2. **Never invent.** Do not invent MST APIs, SDK methods, package names, chain IDs, RPC URLs, precompile support, gas sponsorship, UIDAI formats, government endpoints, or legal permissions. If you cannot find it, write `UNVERIFIED` and add a blocker.
3. **Label everything.** Each fact in `docs/RESEARCH_AUDIT.md` carries one of: `OFFICIAL` (official MST/UIDAI/vendor page you actually opened) · `SECONDARY` (registry, explorer, third-party repo) · `CLAIM` (marketing, not a measurement) · `MEASURED` (you tested it) · `UNVERIFIED`.
4. **Gates block dependents.** If a gate is `FAIL` or `INCONCLUSIVE`, dependent work stops. Do not silently downgrade to off-chain verification while describing the product as on-chain verified.
5. **No secrets, no PII, ever.** Never ask for, accept, print, log, or commit private keys, seed phrases, tokens, real Aadhaar QR data, or witnesses. Test credentials must be **synthetic**. The human supplies a funded **test-only** key via an untracked `.env` or a local keystore you never read aloud.
6. **No mainnet** before Milestone M10 and explicit human approval. Gate 0 is testnet only.
7. **Do not claim unhackable.** Aim for defense in depth and documented residual risk. Never claim DPDP, UIDAI, RBI, or government approval/compliance.
8. **Do not generate cryptography by intuition.** No hand-written RSA/SHA circuits unless an adopted audited base is proven unsuitable and the human approves. No novel nullifier formula locked without a written cryptographic review.
9. **Minimal coherent changes.** One primary contract framework, one EVM client library, one package manager, one backend framework. No extra queues/services/SDKs without a recorded need.
10. **Bounded effort.** Max **3 distinct fix attempts** on the same failure, then stop, record a `BLOCKED` entry with evidence, and move to an unblocked task or ask the human. No infinite loops, no test-weakening to get green.

---

## 2. Verified facts register (seed for `docs/RESEARCH_AUDIT.md`)

Research performed 28 Oct 2026. **Re-verify every row against live sources before depending on it**; update the audit with date and evidence.

| ID | Fact | Status | Notes |
|---|---|---|---|
| F-01 | MST is EVM-compatible, PoSA with Parlia-style round-robin blocks; Solidity; works with MetaMask/Remix/Hardhat/Truffle | `CLAIM` + `SECONDARY` | From MST site/whitepaper; not tested |
| F-02 | Mainnet chain ID **4646** (0x1226), symbol MSTC, explorer `https://mstscan.com` | `SECONDARY` | Chainlist + SDK docs + third-party repos. Confirm via `eth_chainId` |
| F-03 | Mainnet RPC `https://mariorpc.mstblockchain.com` (Python SDK docs; also in third-party repos). `craftrpc.mstblockchain.com` listed by Chainlist | `SECONDARY` | Health/limits unknown. WSS **UNVERIFIED** |
| F-04 | **Legacy Testnet** chain ID **91562037** (0x5752035), symbol tMSTC, RPC `https://testnetrpc.mstblockchain.com`, explorer `https://testnet.mstscan.com` | `SECONDARY` | Several third-party repos claim to match official docs; you must still verify live |
| F-05 | **Legacy Testnet shutdown after 31 Jan 2027**, developers told to migrate to **MST Coral Testnet** | `SECONDARY` (explorer banner, per prior research) | ~95 days from today. Treat as a first-class constraint |
| F-06 | **MST Coral Testnet** chain ID **54635**, currency tMSTC | `SECONDARY` (weak) | Appears on chainlist.wtf and a Chainlist-mirror release note. The ethereum-lists/chains PR #8905 was **closed, unmerged**, by an individual. **Coral RPC, WSS, explorer, faucet: UNVERIFIED.** Do **not** reuse legacy URLs for Coral |
| F-07 | Faucets seen: `https://faucet.mstblockchain.com` (legacy; cited by multiple repos) and `https://faucet.masterstroke.academy` (one third-party repo only) | `SECONDARY` / `UNVERIFIED` | Which one serves Coral is unknown. Never paste keys/seeds into any faucet |
| F-08 | Official docs index `https://docs.mstblockchain.com/developer-docs`; leaf pages are `.md` by appending `.md` (e.g. `.../foundation/development-networks-mst-testnet.md`) | `OFFICIAL` (index, per prior research) | Leaf pages were **not retrievable** in prior or current research. First task: try to open them; else ask the human to export |
| F-09 | SARAL = onboarding/key-management (MPC, SSO-style). **Not** shown to sponsor gas | `OFFICIAL` (site) | Gas sponsorship **UNVERIFIED**. Plan an own relayer |
| F-10 | FortunX = commit-reveal randomness, not consensus. WASMify = Web2/Web3 bridge, not needed | `OFFICIAL` (site) | Exclude from architecture |
| F-11 | JS SDK README says `npm install blockchain-sdk`; npm publisher lists `@mstblockchain/mst-sdk` (1.0.0) and `@mstblockchain/mst-vibe-kit` (0.1.1). Python: `mst-sdk-python` (PyPI, MIT, web3.py, maps only `mainnet`/`testnet` → legacy RPCs) | `SECONDARY` | Name mismatch unresolved. SDKs are **not required**; plain viem/Hardhat is the default. Python SDK has **no Coral mapping** as far as seen |
| F-12 | Block time ≈ 3 s on explorer (live); MST site/whitepaper claims differ on finality (sub-second vs ~2 confirmations) | `CLAIM` | Measure; promise nothing |
| F-13 | BN254 precompiles 0x06/0x07/0x08 on MST | `UNVERIFIED` | **Gate 0** |
| F-14 | EVM hardfork / `PUSH0` support, block gas limit | `UNVERIFIED` | Gate 0 + docs |
| F-15 | Other builders have shipped Groth16 dApps for MST buildathons (e.g. ZKRelief, Namma Seva). ZKRelief's README states it did **not** deploy to MST (no funded key) and its proof tests ran on a local chain | `SECONDARY` | **Not evidence** that MST supports pairings. Do not cite as such |
| F-16 | Google Antigravity MCP config: workspace `.agents/mcp_config.json`, global `~/.gemini/config/mcp_config.json`, top-level `mcpServers`; unconfigured tools default to ask-for-approval | `OFFICIAL` (per prior research) | MCP is the *agent's* tooling, not an app dependency. MST's docs "MCP" chapter content **UNVERIFIED**; assume no MST MCP server exists until read |
| F-17 | Anon Aadhaar (PSE) is an existing Circom project for Aadhaar secure-QR proofs | `UNVERIFIED` in detail | From memory: it verifies the UIDAI RSA signature in-circuit, supports selective-disclosure of age>18/gender/state/pin, and uses a nullifier seed + stable signed data. **Inspect the actual repo, license, version support, audits, and UIDAI certificate handling before adopting** |
| F-18 | RSA-2048 + SHA-256 over the QR payload is a large circuit; the 2.5–4.5 s phone target is not credible without measurement | `UNVERIFIED` | PERF gate; measure |

**Chain-config rule:** all network settings live in `config/networks.ts` (or equivalent) with four slots — `local`, `mstLegacyTestnet`, `mstCoralTestnet`, `mstMainnet`. Each slot has `status: "verified" | "unverified"` and `evidence` pointing at a file. Code must **refuse to broadcast** on any slot whose `eth_chainId` response differs from its configured ID or whose status is `unverified` without an explicit `--allow-unverified-network` flag **and** a testnet-only guard.

---

## 3. Decision register (seed for `docs/ARCHITECTURE_DECISIONS.md`)

Statuses: `APPROVED` (human said yes) · `RECOMMENDED` (default; proceed unless human objects, except where marked) · `NEEDS_APPROVAL` (stop and ask before implementing) · `BLOCKED` (gate-dependent).

| ID | Decision | Status | Condition / note |
|---|---|---|---|
| D-01 | Gate 0 is the first implementation task; no real circuit before it passes on the intended network | RECOMMENDED (strong) | |
| D-02 | Target **Coral** as the authoritative network; use legacy testnet only as a time-boxed diagnostic until 31 Jan 2027. Repeat Gate 0 on Coral | RECOMMENDED | Blocked until Coral RPC is verified |
| D-03 | Build on audited **Anon Aadhaar** circuits if compatible (QR version, license, UIDAI cert, performance); otherwise compare options and ask | NEEDS_APPROVAL after M2 findings | Do not write RSA/SHA from scratch |
| D-04 | **Nullifier:** discard `Poseidon(UserSecretSalt, ScopeID)`. Candidate: `Poseidon(credentialBoundSecret, scopeId)` where `credentialBoundSecret` derives from data **inside the signed payload** (e.g. a stable signed field such as the photo-bytes hash used by Anon Aadhaar — verify). Cross-scope unlinkability and cross-QR-regeneration stability must be analyzed | NEEDS_APPROVAL | Requires written crypto review in `docs/CRYPTO_DESIGN.md` before locking |
| D-05 | **Proof binding:** public inputs include `scopeId`, `chainId`, `registry address`, `recipient`, `action/nonce`, `deadline`. Do **not** rely on `msg.sender` alone because a relayer submits | RECOMMENDED | Circuit and contract must agree on identical semantics |
| D-06 | Own **relayer** (viem + KMS-backed signer, queue only if needed) | RECOMMENDED | Revisit only if official docs prove native sponsorship / ERC-2771 / ERC-4337 |
| D-07 | Web2 gateway verifies proofs **off-chain** (snarkjs) and issues OIDC tokens; on-chain anchoring is **optional per use case**, not per verification | RECOMMENDED | Document trust model; do not call this "on-chain verified" |
| D-08 | Pairwise `sub` per client/tenant (HMAC of nullifier-derived value with per-tenant secret) | RECOMMENDED | |
| D-09 | MVP predicates: **age ≥ 18** and **state**. Gender/pincode excluded unless justified (data minimization) | RECOMMENDED | |
| D-10 | Exclude face-match, liveness, GNN fraud, and NL circuit synthesis from MVP | RECOMMENDED (strong) | A client-supplied boolean is unconstrained |
| D-11 | Government channel = signed-webhook **stub**, visibly labelled | RECOMMENDED | |
| D-12 | Stack: **Hardhat + TypeScript** (single framework), **viem** (single client), Circom 2.1.x + snarkjs (Groth16), Fastify, PostgreSQL, **pnpm**. Redis/BullMQ only when a measured need exists | RECOMMENDED | Pin versions after Gate 0 |
| D-13 | MST SDKs not required; if used, wrapped behind a `ChainAdapter` interface | RECOMMENDED | |
| D-14 | Trusted setup: public Powers of Tau (record exact file + hash) + project phase-2. Dev ceremony **must be labeled DEV-ONLY**. Production ceremony is a separate, human-run, documented event | RECOMMENDED | Reassess Groth16 vs PLONK-family if Gate 0 shows pairing cost problems |
| D-15 | Registry governance: pausable, role-based, timelock/multisig for issuer-key changes; no upgradeable proxy unless justified | NEEDS_APPROVAL | |
| D-16 | If Gate 0 FAILS: stop, produce an options paper (e.g. attestation-signature verification on-chain with off-chain proof verification; another proof system verifiable without pairings; different chain). **Human decides.** | BLOCKED | |

---

## 4. Session Start Protocol (run every session, in order)

1. Read: `AGENTS.md` → `PROJECT_CONTEXT.md` → `implementation_plan.md` → last 150 lines of `docs/ACTIVITY_LOG.md` → `docs/VERIFICATION_AUDIT.md` → `docs/SESSION_HANDOFF.md`.
2. Run and record: `git status`, `git log --oneline -n 15`, `git diff --stat`. Never overwrite uncommitted human work; if the tree is dirty with changes you did not make, stop and ask.
3. Confirm toolchain: print versions of node, pnpm, git, circom, snarkjs, solc/hardhat, and whether Docker exists. Record in the log.
4. Identify the **single next unblocked, approved task** from `implementation_plan.md`. State its acceptance criteria and prerequisites aloud in the log before touching code.
5. If the plan or context files do not exist, you are in **Bootstrap Mode** (§6).

## 5. Persistent memory (the repo is the source of truth)

Create and maintain exactly these (adapt only after inspecting the real repo):

```
Pramaan-ZK/
├── README.md  AGENTS.md  PROJECT_CONTEXT.md  implementation_plan.md
├── ANTIGRAVITY_MASTER_LOOP_PROMPT.md  .env.example  .gitignore
├── config/networks.ts
├── docs/
│   ├── PROJECT_SPECIFICATION.md   RESEARCH_AUDIT.md   ARCHITECTURE.md
│   ├── ARCHITECTURE_DECISIONS.md  CRYPTO_DESIGN.md    THREAT_MODEL.md
│   ├── PRIVACY_AND_COMPLIANCE.md  SMART_CONTRACT_SPEC.md  API_SPECIFICATION.md
│   ├── TEST_STRATEGY.md  GATE0_TEST_REPORT.md  PERF_BENCHMARKS.md
│   ├── VERIFICATION_AUDIT.md  ACTIVITY_LOG.md  CHANGELOG.md
│   ├── DEPLOYMENT_RUNBOOK.md  SESSION_HANDOFF.md  OPEN_QUESTIONS.md
│   ├── MST_SUPPORT_QUESTIONS.md   evidence/   (raw logs, receipts, JSON)
│   └── reference/   (human-supplied: PayEra notes, Planet Jumping URL/notes)
├── scripts/gate0/   contracts/   circuits/   packages/   backend/   frontend/   tests/
└── .github/workflows/
```

**Status vocabulary (use only these):** `PLANNED · IN_PROGRESS · IMPLEMENTED · TESTED · VERIFIED · BLOCKED · DEFERRED`. `VERIFIED` requires evidence in `docs/evidence/` referenced from `VERIFICATION_AUDIT.md`.

**Activity log entry format (append-only, never rewrite history):**
```
### [YYYY-MM-DD HH:MM TZ] <TASK-ID> — <title>
- Agent/env: Antigravity <mode/model if known>
- Intent / acceptance criteria:
- Files created/modified/deleted:
- Commands actually run (exact) and result summary (pass/fail counts):
- Evidence: <paths, tx hashes, addresses, explorer links>
- Errors → diagnosis → fix:
- Security/privacy implications:
- Docs updated:
- Residual risk / blocker:
- Next action:
```

**Decision record format:** `ID · Title · Date · Status · Context · Options (pros/cons) · Decision · Consequences · Approved-by`.
**Research audit row:** `ID · Claim · Source URL · Accessed date · Status label · Evidence path · Conflicts · Follow-up`.

**Never log:** keys, seeds, tokens, raw QR data, witnesses, full IPs. Redact before writing.

**Session End Protocol (every session, even if interrupted):**
1. Update `ACTIVITY_LOG.md`, `implementation_plan.md` statuses (only with evidence), `VERIFICATION_AUDIT.md`, `CHANGELOG.md`, any changed decision/threat/spec docs.
2. Run secret scan (`gitleaks` if available, else `git grep` for key-shaped strings and `.env` tracking) and record the result.
3. Commit on a branch named `m<N>/<slug>` with a message referencing the task ID. Never force-push or rewrite history. Never push without the human's instruction.
4. Rewrite `docs/SESSION_HANDOFF.md`: last completed task, last real test results, blockers, files to read first, and **exactly one next action**.

---

## 6. Bootstrap Mode (first session only)

Perform in this order; stop after step 9 and report.

1. Inspect the directory. If a repo exists, preserve it; if not, `git init` and create the layout in §5 (empty files with headings are fine, but each must state "STATUS: skeleton").
2. Put this prompt at root. Create `AGENTS.md` summarizing §1, §4, §5 (short, imperative).
3. Create `docs/RESEARCH_AUDIT.md` from §2 and `docs/ARCHITECTURE_DECISIONS.md` from §3, preserving statuses.
4. Create `PROJECT_CONTEXT.md` (goal, scope, MVP, out-of-scope, current stage = "Bootstrap", open blockers = §7).
5. Create `implementation_plan.md` from §8 with every milestone `PLANNED` except M0 `IN_PROGRESS`.
6. Create `docs/OPEN_QUESTIONS.md` and `docs/MST_SUPPORT_QUESTIONS.md` from §7 and §10.
7. **Try to open the official MST docs** (index and the `.md` leaf pages listed in §10.1). Record each as `OFFICIAL` (opened, with date and the exact facts it confirms) or `BLOCKED-ACCESS`. Do not fill gaps from memory.
8. Run the **JSON-RPC preflight** (§9, step A) against the legacy testnet and mainnet (read-only calls only) and against Coral **only if** a Coral RPC has been verified from an official source or provided by the human. Save outputs to `docs/evidence/preflight-<date>/`.
9. Write the first `SESSION_HANDOFF.md` and ask the human for the items in §7 that are still missing.

---

## 7. Blockers and required human inputs (live list — update as closed)

| ID | Blocker | Needed from | Unblocks |
|---|---|---|---|
| B-01 | **Coral Testnet official config:** chain ID confirmation (54635 is secondary only), HTTPS RPC, WSS, explorer, faucet | MST docs "Add network" action on the Coral explorer, docs export, or `support@mstblockchain.com` | M0 on authoritative network (D-02) |
| B-02 | **BN254 precompiles + EVM hardfork + block gas limit** on target network | Gate 0 test (+ MST written confirmation) | Everything cryptographic |
| B-03 | Official docs leaf pages not retrievable by tools | Human exports/pastes pages into `docs/reference/mst-docs/` | M0 doc review |
| B-04 | **Funded test-only wallet** on the target network | Human creates wallet locally, funds from the correct faucet, sets `DEPLOYER_PRIVATE_KEY` in untracked `.env`. **Never send the key to the agent in chat** | Any on-chain test |
| B-05 | Authoritative **UIDAI Secure QR spec/version** and signing-certificate source/rotation; which QR versions are in scope | Human + UIDAI docs + Anon Aadhaar source | M2 |
| B-06 | **Legal/regulatory opinion** (UIDAI offline-verification rules, OVSE status, DPDP, RBI KYC acceptability) | Qualified Indian counsel | Any use with real credentials; any production claim |
| B-07 | **JS SDK package-name discrepancy** and whether SDK/Vibe Kit support Coral | `npm view` (§10.2) | Only if SDK is adopted |
| B-08 | **Planet Jumping** reference URL, plus any asset/licensing notes | Human → `docs/reference/` | M9 (UI) |
| B-09 | Physical low/mid-range Android device(s) (≈3–4 GB RAM) for benchmarks, or an agreed emulation/device-farm substitute | Human | PERF gate |
| B-10 | Remaining text of the original idea after "Component 4" | Human (low priority; Component 4 is out of MVP) | none |
| B-11 | Approval of NEEDS_APPROVAL decisions (D-03, D-04, D-15) | Human | M2/M3 |

Everything else can proceed. **Do not stall on B-06 or B-10;** they do not block M0–M8 (synthetic data only).

---

## 8. Milestones (each ends with a **gate**; do not start the next until the gate is met or the human overrides in writing)

### M0 — Repository, research, Gate 0 feasibility  *(first, mandatory)*
**Tasks:** Bootstrap (§6). Pin toolchain. Execute **Gate 0 (§9)** on legacy testnet (diagnostic) and Coral (authoritative, when B-01 closes). Review SDK/Vibe Kit in a scratch dir (§10.2). Write initial `THREAT_MODEL.md`, `PRIVACY_AND_COMPLIANCE.md` (data inventory only), and a one-page legal-risk note.
**Exit gate:** `docs/GATE0_TEST_REPORT.md` contains a verdict of **PASS / FAIL / INCONCLUSIVE** per target network with raw evidence; reproducible with one documented command; D-16 triggered if FAIL.

### M1 — Foundations
Monorepo (pnpm workspaces), lint/format/typecheck, CI workflow (lint, typecheck, unit, contract tests, `pnpm audit`, secret scan), `config/networks.ts` with the refuse-to-broadcast guard, `ChainAdapter` interface, test-credential fixture generator (synthetic, clearly labelled).
**Exit gate:** CI green on a clean clone; guard tests prove a wrong-chain RPC aborts broadcast.

### M2 — Credential & cryptographic feasibility
Resolve B-05. Audit Anon Aadhaar (or the chosen base): license, version, circuits, in-circuit signature scheme, handling of UIDAI certificate rotation, setup artifacts, known issues. Write `CRYPTO_DESIGN.md`: exact proof statement, public/private signals table, nullifier construction and its properties (stability, scope isolation, linkability), binding fields (D-05), issuer-key model. Benchmark proving on target devices (PERF_BENCHMARKS.md: time, peak RAM, zkey download size, failure rate).
**Exit gate:** human approves D-03 and D-04 in writing; benchmark numbers recorded; underconstraint review checklist complete. **If proving does not fit the target device class, record it and propose options; do not hide it.**

### M3 — Contracts
`PramaanVerifier` (generated, from the **real** circuit), `PramaanRegistry` (issuer keys with versioning/revocation, scoped nullifier set, minimal events, pause, roles, timelock/multisig per D-15). Hardhat tests incl. fuzz/invariant-style tests (nullifier uniqueness, scope isolation, replay, wrong recipient/chain, expired/revoked key, pause, malformed calldata, gas bounds). Static analysis (Slither if available). Deploy to the authoritative testnet; record tx hashes and gas.
**Exit gate:** all tests pass; deployed on target network; valid proof accepted, tampered/replayed/wrong-binding rejected **on-chain**, with evidence.

### M4 — Client proving SDK (`packages/client`)
TypeScript package: QR parse (with decompression-bomb limits), signature precheck, witness build, snarkjs proving in a Web Worker, memory/error handling, cancellation, artifact integrity check (hash-pinned zkey/wasm), **no network calls with credential data**. Network-egress test proving no PII leaves the device during proving.
**Exit gate:** end-to-end proof from synthetic QR → verified by local verifier **and** on-chain; negative tests (malformed, truncated, wrong version, unsupported cert).

### M5 — Backend, OIDC, tenants, relayer
Fastify service: tenants (client IDs, exact redirect URIs, scopes), OIDC authorization-code + PKCE via an established library, `/.well-known/openid-configuration`, JWKS with key rotation, `/token`, `/userinfo`, pairwise `sub` (D-08), nonce/state/aud/iss/exp validation. Off-chain proof verification before issuing claims. Relayer: KMS-style signer interface (local dev signer behind the same interface; production uses real KMS), nonce manager, idempotency keys, uncertain-outcome reconciliation (never blindly resubmit), per-tenant quotas, gas caps. Event indexer. PostgreSQL stores tenant config and non-PII ops metadata only. Log policy: no raw IPs, hashed/truncated metadata with short retention, documented.
**Exit gate:** API test suite + abuse tests pass; OIDC conformance-style checks documented; relayer survives RPC outage/duplicate/nonce-gap tests.

### M6 — Integrations (Web3 SDK, Web2 demo tenant, government stub)
`packages/web3-sdk` (request proof, read registry state), minimal **functional** dev UI (unstyled, only for testing), demo relying-party app using OIDC, signed-webhook stub clearly labelled "SIMULATION — NOT A GOVERNMENT INTEGRATION". Document what each channel trusts.
**Exit gate:** full journeys pass: Web3 and Web2, valid and invalid paths.

### M7 — Hardening & security audit
Run the full adversarial matrix (§11). Fix all Critical/High; log Medium/Low with owners. Dependency + secret + static scans. Load/abuse test on relayer and gateway. Privacy leakage audit: network requests, storage, error telemetry, logs, contract events.
**Exit gate:** `VERIFICATION_AUDIT.md` shows zero open Critical/High; residual risk accepted in writing by the human.

### M8 — Pre-release readiness (still no real credentials)
Runbooks (deploy, rollback/mitigation, key rotation, incident response, backup/restore), monitoring/alerts, release-candidate dry run on testnet, reproducible build verification, readiness matrix (passed / failed / not tested / blocked).
**Exit gate:** human sign-off to proceed to UI/final polish. *(UI may begin earlier only as isolated static work if the human asks.)*

### M9 — Final UI/UX (reference-inspired, original)  *(built last)*
See §12. Wire the finished design onto the already-verified flows without altering cryptographic or API behavior.
**Exit gate:** Lighthouse/a11y/perf budgets met on a throttled mid-range Android profile; proving route unaffected by landing-page animation; visual QA checklist signed.

### M10 — Release gate (human-run)
External cryptographic + smart-contract audit completed or explicitly accepted as outstanding; legal review (B-06) complete for the intended pilot; **production** trusted-setup ceremony performed and documented; production keys created by the authorized operator; mainnet chain ID/RPC re-verified; deployment in an approved window. **The agent may prepare but never executes mainnet transactions or ceremony steps.**

---

## 9. Gate 0 — exact specification

**Objective:** Determine whether the intended MST network can deploy and execute a real generated Groth16 verifier (BN254 `ecAdd` 0x06, `ecMul` 0x07, `ecPairing` 0x08) at acceptable gas.
**Rules:** testnet only; automated and reproducible (`pnpm gate0` or equivalent); a manual Remix run is a supplementary smoke test only.

**A. Network preflight** (`scripts/gate0/01-preflight.ts`)
- Calls: `eth_chainId`, `net_version`, `eth_blockNumber` (3 samples ≥ 10 s apart), `eth_gasPrice`, `eth_getBalance(test addr)`, `eth_getBlockByNumber('latest')` (record `gasLimit`, timestamp), `eth_estimateGas` on a trivial tx, `web3_clientVersion` (if supported).
- Assert returned chain ID equals the config slot. Mismatch → STOP, no signing.
- Record latency, HTTP codes, rate-limit behavior, unsupported optional methods (document, don't fail).

**B. Direct precompile probes** (`02-precompiles.ts`)
- **Do not copy test vectors from memory.** Generate them with an independent library (e.g. `@noble/curves` bn254 or `py_ecc`) and cross-check against the EIP-196/197 specification; save vectors to `scripts/gate0/vectors.json` with provenance.
- Probe via `eth_call` to `0x06`, `0x07`, `0x08` with (i) known-valid inputs → compare returned bytes to the independently computed answer; (ii) deliberately invalid inputs (point not on curve; bad pairing input length) → expected failure semantics.
- Also deploy a minimal `PrecompileProbe.sol` using `staticcall` that returns success flag + output + `gasleft()` delta, so on-chain gas cost is measured, not guessed.
- Pairing probe: a valid pairing identity (e.g. `e(P, Q)·e(−P, Q) = 1`) → returns 1; a non-identity → returns 0.

**C. Toy circuit** (`circuits/gate0/multiplier.circom`, `a*b=c`)
- Pin circom and snarkjs versions; record them. Use a **DEV-ONLY** Powers of Tau (smallest sufficient power) and phase-2; label artifacts DEV-ONLY.
- Compile, setup, prove, **verify locally** with snarkjs; export the Solidity verifier. Save proof, public signals, vkey, verifier source hash.

**D. On-chain verifier** (`03-verifier.ts`)
- Compile with explicit `solc` version and `evmVersion`. Deploy first with the default target. If deployment fails with an invalid-opcode/`PUSH0`-style signature, retry with `evmVersion: "paris"` **as a diagnostic**, record both outcomes, and keep the setting only if evidence supports it.
- Call `verifyProof` with the valid proof (via `eth_call` **and** as a mined transaction for gas): expect `true`.
- Tampered proof (flip a coordinate; change a public signal; swap A/B terms): expect `false` or a defined safe revert.
- Record: deploy gas, `verifyProof` gas used, tx hashes, contract addresses, block numbers, receipt statuses, explorer URLs, time-to-inclusion and observed confirmations (state your finality-measurement method).
- Repeat the valid/tampered calls **≥ 5 times** across a few minutes to separate transient RPC faults from deterministic ones.

**E. Classification and diagnosis** (`GATE0_TEST_REPORT.md`)
| Verdict | Criteria |
|---|---|
| **PASS** | Chain ID matches authoritative source; all three precompile probes return independently verified results; verifier deploys; valid proof → true; every tampered variant rejected; evidence + versions saved; reproducible |
| **FAIL** | A direct precompile probe with *verified-correct* vectors proves absence or wrong behavior (and the probe harness is itself validated against a known-good chain, e.g. a local Hardhat node), **or** the verifier cannot execute within the chain's gas limit |
| **INCONCLUSIVE** | Anything else (RPC faults, balance, encoding, compiler/hardfork issues not yet isolated) |

A failed `verifyProof` alone proves nothing. Walk this checklist and record each item as ruled in/out: wrong network/RPC · balance/nonce · rate limits · compiler/`evmVersion` · bytecode size/code-size limit · gas/ block limit · ABI/calldata/field-element encoding · public-signal order · local vs on-chain vkey mismatch · bad test vectors · harness bug (validate the harness on local Hardhat first) · actual precompile absence. **Validate the entire harness on a local Hardhat node (where pairings are known to work) before touching MST;** otherwise a harness bug can masquerade as a chain limitation.

**F. Outputs:** `GATE0_TEST_REPORT.md`, `RESEARCH_AUDIT.md` (F-13/F-14 updated to `MEASURED`), `ACTIVITY_LOG.md`, `VERIFICATION_AUDIT.md`, `docs/evidence/gate0-<network>-<date>/`. Add draft support questions (§10.3) to `MST_SUPPORT_QUESTIONS.md` for any inconclusive item.

**If FAIL:** halt M1+ dependent work; write an options paper (D-16) with security/trust/privacy/cost trade-offs; wait for the human. **Do not** quietly swap to gateway-only trust.

---

## 10. Research procedures

### 10.1 Official MST docs (try in this order; record result of each)
`https://docs.mstblockchain.com/developer-docs` and, appending `.md`: `foundation/development-networks-mst-testnet`, `foundation/introduction-of-evm-and-opcodes`, `foundation/gas`, `foundation/transactions`, `foundation/blocks`, `foundation/network-and-validator-structure`, `foundation/accounts-on-mst-chain`, `foundation/vibe-kit`, `foundation/mcp`, `foundation/ide-and-hands-on-practices`, `foundation/deployment-on-mainnet`. Extract: network table (incl. Coral), hardfork, precompiles, gas limits, MCP chapter meaning, any relayer/sponsorship statement. If blocked, mark `BLOCKED-ACCESS`, ask the human to export, and continue with empirical tests.

### 10.2 SDK/Vibe Kit inspection (scratch dir only)
`npm view @mstblockchain/mst-sdk version dist-tags repository engines exports bin readme --json` (same for `@mstblockchain/mst-vibe-kit` and `blockchain-sdk`); `npm pack <pkg> --dry-run`; read source, install scripts (`preinstall/postinstall`), dependencies, license, Coral support, hard-coded network config. Do not install into the main repo. Record verdict and reasoning; default decision is **not to adopt** (D-13).

### 10.3 Questions for MST support (draft into `MST_SUPPORT_QUESTIONS.md`; the human sends)
Coral official config and docs URL; legacy shutdown date; EVM hardfork and `evmVersion` to target; BN254 precompile support at 0x06/0x07/0x08 and any gas repricing; block/call gas limit; WSS/archive/trace support and RPC rate limits; SARAL gas sponsorship (yes/no, docs); ERC-2771/4337 support; official MCP server (if any); SDK package of record; explorer contract-verification API; audits/bug bounty/incident process.

### 10.4 MCP policy for Antigravity
MCP is optional agent tooling. Configure only after naming a trusted package/endpoint, its purpose and permissions, in `.agents/mcp_config.json` (workspace scope). Start read-only. Require approval for any write/deploy/sign tool. Never expose wallet secrets or credential data through MCP. Do not add an "MST MCP server" unless official documentation names one; record the decision in `ARCHITECTURE_DECISIONS.md`.

---

## 11. Quality, test and security standards

**Per-task loop:** inspect → plan (acceptance criteria) → implement (smallest coherent change) → format/lint/typecheck → unit tests → integration tests → debug (≤3 attempts per failure, root-cause first, never weaken a test to pass) → security review of the diff → update docs/logs → commit → handoff.

**Debug protocol:** reproduce with a minimal command → capture the exact error → form ranked hypotheses → test one at a time → record what was ruled out → fix root cause → add a regression test.

**Test layers:** circuit constraint tests (valid, boundary, malicious witnesses, wrong issuer key, unsupported version) · contract unit + fuzz/invariant · client SDK (malformed/truncated/bomb inputs) · API (OIDC negatives: bad redirect, replayed code, wrong PKCE, wrong aud/nonce, expired, cross-tenant) · relayer (duplicate, nonce gap, RPC flap, unknown-outcome) · privacy egress test · performance · end-to-end.

**Adversarial matrix (M7 minimum):** invalid proof · tampered public input · wrong issuer key / revoked key · wrong scope · replay · front-run / recipient mismatch · cross-chain replay · duplicate request · relayer drain/abuse · RPC outage · token tampering/algorithm confusion · tenant isolation breach · open redirect · key rotation mid-flow · DB failure · interrupted session · decompression bomb · oversized body · timing/side-channel on pairwise `sub`.

**Tools (use if installable; otherwise record "not available"):** `slither`, `circomspect`, `gitleaks`, `semgrep`, `pnpm audit`, `forge`/Hardhat fuzz, OWASP ZAP or equivalent for the API. A tool being unavailable is a recorded gap, not a pass.

**Privacy invariants:** no credential bytes, signature, DOB, witness, or salt in logs, analytics, error reports, URLs, or on-chain events/calldata beyond the public inputs defined in `CRYPTO_DESIGN.md`. Document exactly what each party (relayer, gateway, chain observers, relying party) can see, including IP, timestamp, wallet address, tenant ID, nullifier. ZK ≠ anonymity; say so in user-facing copy.

**Client integrity:** assume the user's device and JS are adversarial. Security-relevant claims are enforced by circuit constraints, contract checks, or server checks — never by UI state or a client-supplied boolean. State the residual **stolen/photocopied-QR risk** prominently in docs and UI.

---

## 12. Final UI/UX specification (M9 only)

**Principle:** original Pramaan-ZK identity; borrow *mechanics* from the "Planet Jumping" reference, never its brand, footage, logo, fonts, copy, CDN assets, or code. Read `docs/reference/` for the URL (B-08). If assets are not licensed or are owned by another brand, create original ones.

**Concept:** a **proof gate** — a canvas-masked "portal" that opens when a proof transitions from *unverified* to *verified*. The metaphor must reflect real state (generating → verifying → accepted/rejected), not decorative looping.

**Mechanics to implement:** preloader with real-progress counter (tied to artifact download/zkey load where applicable) · canvas-masked portal with parallax/tilt · staged text/section reveals · desktop-only custom cursor (hidden on touch, never hides the system cursor for keyboard/AT users).

**Constraints:**
- Landing and proving are **separate routes**; no canvas/video work while WASM proving runs.
- Mobile-first on mid/low-range Android: short compressed video (poster fallback), lazy-load, `prefers-reduced-motion` honored, `prefers-color-scheme` supported, no layout shift.
- Accessibility: WCAG 2.2 AA, full keyboard flow, visible focus, semantic landmarks, captions/text alternatives, no motion-only information, status announcements via live regions.
- Budgets (record measured values, not guesses): LCP, CLS, TBT, JS weight, video weight; throttled-profile Lighthouse run in `PERF_BENCHMARKS.md`.
- Visual direction: restrained, distinctive typography and palette chosen deliberately (document rationale); avoid generic gradient/glassmorphism "AI" aesthetics; every animation must carry information or hierarchy.
- UI states: idle, scanning, parsing, proving (progress + cancel), verifying, success, rejected, unsupported QR, out-of-memory, network failure, relayer failure. Copy must not overclaim ("verified attribute", not "identity verified by government").
- Wire into existing APIs without changing contracts or crypto. Re-run the full test suite and privacy egress test after UI integration.

---

## 13. Approval gates (stop and ask the human)

Before: adopting a circuit base (D-03) · locking the nullifier (D-04) · governance model (D-15) · any scope change · adding a new infrastructure component · any destructive git/file operation · installing unreviewed MCP servers · any action touching mainnet, real credentials, production keys, or a trusted-setup ceremony · pushing to a remote.

When asking, present: the decision, options, your recommendation, evidence, and the cost of being wrong.

## 14. Definition of done for any task

Acceptance criteria met with real evidence · tests added and passing (counts recorded) · lint/typecheck clean · security/privacy implications noted · docs and logs updated · no secrets in diff · handoff written · status set honestly (`IMPLEMENTED` ≠ `VERIFIED`).

## 15. First-session checklist (do exactly this, then stop and report)

1. Run Bootstrap (§6).
2. Attempt official-docs retrieval (§10.1).
3. Read-only RPC preflight (§9-A) on legacy testnet and mainnet; Coral only if its RPC is officially sourced.
4. Build and **validate the Gate 0 harness on a local Hardhat node** (precompile probes + toy verifier valid/tampered) — no external network needed.
5. If B-04 is closed and the network guard passes, run Gate 0 on legacy testnet as a diagnostic.
6. Draft `MST_SUPPORT_QUESTIONS.md`, `OPEN_QUESTIONS.md`.
7. Write the session handoff with the single next action, and report to the human: what ran, what passed, what failed, what is still blocked.

*End of master loop prompt.*

