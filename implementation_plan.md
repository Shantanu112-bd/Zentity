# implementation_plan.md — Pramaan-ZK Implementation Roadmap

**Status Vocabulary:** `PLANNED` · `IN_PROGRESS` · `IMPLEMENTED` · `TESTED` · `VERIFIED` · `BLOCKED` · `DEFERRED`

---

## Milestone M0 — Repository, Research, & Gate 0 Feasibility
- **Status:** `IN_PROGRESS (Legacy-testnet diagnostic completed; overall Gate 0 OPEN pending Coral)`
- **Objective:** Establish repository structure, execute Gate 0 preflight and precompile probes, determine BN254 Groth16 feasibility on MST, inspect SDKs in scratchpad, draft support questions and open questions.
- **Tasks:**
  - [x] Bootstrap repository structure, configuration files, and doc skeletons
  - [x] Retrieve official MST documentation pages (§10.1) and audit for Coral / migration notices
  - [x] Run JSON-RPC preflight against Legacy Testnet and Mainnet (§9-A) & record gas limit discrepancy
  - [x] Build and validate Gate 0 test harness on local Hardhat node (§9-B, C, D)
  - [x] Direct precompile probes (`0x06`, `0x07`, `0x08`) via `eth_call` on Legacy Testnet and Mainnet (8/8 passed)
  - [ ] Deploy `PrecompileProbe.sol` to MST Testnet to re-measure native precompile gas costs on-chain (Pending B-04)
  - [ ] Deploy `Groth16Verifier.sol` to MST Legacy Testnet with default evmVersion first, then paris if needed (Pending B-04)
  - [x] Inspect `@mstblockchain/mst-sdk` and `@mstblockchain/mst-vibe-kit` in scratch directory (§10.2)
  - [x] Draft initial `THREAT_MODEL.md`, `PRIVACY_AND_COMPLIANCE.md`, `MST_SUPPORT_QUESTIONS.md`
- **Exit Gate:** `docs/GATE0_TEST_REPORT.md` contains PASS/FAIL/INCONCLUSIVE verdict with raw evidence. Overall Gate 0 remains **OPEN** pending Coral testnet verification.
- **Rule:** Do NOT start M1 or any real circuit work before Gate 0 is verified.

---

## Milestone M1 — Foundations & Core Tooling
- **Status:** `PLANNED`
- **Objective:** Configure pnpm workspaces monorepo, lint/typecheck pipelines, `config/networks.ts` with refuse-to-broadcast guard, ChainAdapter interface, and synthetic credential fixture generator.
- **Exit Gate:** CI green on clean clone; guard tests verify refusal to broadcast on unverified networks.

---

## Milestone M2 — Credential & Cryptographic Feasibility
- **Status:** `PLANNED`
- **Objective:** Audit Anon Aadhaar Circom circuits, design proof statements, public/private signals, nullifier derivation formula, binding fields (scopeId, chainId, registry, recipient, deadline), and mobile benchmark.
- **Exit Gate:** Written approval of D-03 and D-04; device benchmarks logged; underconstraint review complete.

---

## Milestone M3 — Smart Contracts (`PramaanVerifier` & `PramaanRegistry`)
- **Status:** `PLANNED`
- **Objective:** Deploy and verify real Groth16 circuit verifier and registry contract on MST testnet with replay protection, nullifier tracking, versioned issuer keys, and pausable admin roles.
- **Exit Gate:** Unit + fuzz tests pass; contract deployed on target network; valid proofs accepted and tampered/replayed rejected with tx evidence.

---

## Milestone M4 — Client Proving SDK (`packages/client`)
- **Status:** `PLANNED`
- **Objective:** Build TypeScript client SDK for offline QR parsing, witness generation, and snarkjs proving inside Web Worker with zero network leakage.
- **Exit Gate:** Synthetic QR generates proof accepted locally and on-chain; network-egress test confirms zero PII leaves client.

---

## Milestone M5 — Backend, OIDC Gateway, Relayer
- **Status:** `PLANNED`
- **Objective:** Fastify OIDC server issuing pairwise pseudonymous claims (`sub`), PKCE, JWKS rotation, off-chain proof verification, and gas relayer with nonce management and idempotency.
- **Exit Gate:** OIDC conformance checks pass; relayer handles nonce gaps and RPC re-orgs cleanly.

---

## Milestone M6 — Integrations (Web3 SDK, Web2 Demo, Government Stub)
- **Status:** `PLANNED`
- **Objective:** `packages/web3-sdk`, relying party demo app, and signed-webhook government stub (clearly marked simulation).
- **Exit Gate:** End-to-end user journeys pass across Web3 and Web2 channels.

---

## Milestone M7 — Hardening & Security Audit
- **Status:** `PLANNED`
- **Objective:** Adversarial testing matrix (§11), static analysis (Slither/Circomspect/Semgrep), secret scanning, privacy leakage audit.
- **Exit Gate:** Zero open Critical/High issues in `VERIFICATION_AUDIT.md`.

---

## Milestone M8 — Pre-Release Readiness
- **Status:** `PLANNED`
- **Objective:** Deployment runbooks, operational monitoring, incident response drills, testnet dry run.
- **Exit Gate:** Human sign-off on testnet readiness.

---

## Milestone M9 — Final UI/UX (Original Proof Gate)
- **Status:** `PLANNED`
- **Objective:** Build refined, accessible frontend interface with proof gate visualization (reflecting actual proving states) wired to verified SDK.
- **Exit Gate:** Lighthouse / a11y budgets met on throttled Android profile; visual QA signed off.

---

## Milestone M10 — Release Gate (Human-Run)
- **Status:** `PLANNED`
- **Objective:** Production trusted-setup ceremony, mainnet audit reviews, human operator deployment.
- **Exit Gate:** Formal sign-off and production release.
