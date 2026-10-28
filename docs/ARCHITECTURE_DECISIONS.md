# docs/ARCHITECTURE_DECISIONS.md — Architecture Decision Register

**Created:** 2026-10-28 · **Status:** Active
**Allowed Statuses:** `APPROVED` · `RECOMMENDED` · `NEEDS_APPROVAL` · `BLOCKED`

| ID | Title / Decision | Status | Context & Condition |
|---|---|---|---|
| D-01 | Gate 0 is the first implementation task; no real circuit before it passes on the intended network | `RECOMMENDED` (strong) | Settles whether MST supports Groth16 pairings before building complex circuits |
| D-02 | Target Coral as authoritative network; use legacy testnet only as time-boxed diagnostic until 31 Jan 2027. Repeat Gate 0 on Coral | `RECOMMENDED` | Blocked until Coral RPC is officially verified (B-01) |
| D-03 | Build on audited Anon Aadhaar circuits if compatible (QR version, license, UIDAI cert, performance); otherwise compare options and ask | `NEEDS_APPROVAL` after M2 findings | Avoid writing RSA/SHA from scratch |
| D-04 | Nullifier: discard `Poseidon(UserSecretSalt, ScopeID)`. Candidate: `Poseidon(credentialBoundSecret, scopeId)` derived from signed payload | `NEEDS_APPROVAL` | Requires written crypto review in `docs/CRYPTO_DESIGN.md` before locking |
| D-05 | Proof binding: public inputs include `scopeId`, `chainId`, `registry address`, `recipient`, `action/nonce`, `deadline` | `RECOMMENDED` | Circuit and contract must agree on identical semantics; do not rely on `msg.sender` |
| D-06 | Own relayer (viem + KMS-backed signer, queue only if needed) | `RECOMMENDED` | Revisit only if official docs prove native gas sponsorship / ERC-2771 / ERC-4337 |
| D-07 | Web2 gateway verifies proofs off-chain (snarkjs) and issues OIDC tokens; on-chain anchoring is optional per use case | `RECOMMENDED` | Document trust model; do not claim off-chain verification is on-chain verified |
| D-08 | Pairwise `sub` per client/tenant (HMAC of nullifier-derived value with per-tenant secret) | `RECOMMENDED` | Prevents cross-relying-party tracking while maintaining per-tenant sybil resistance |
| D-09 | MVP predicates: age ≥ 18 and state. Gender/pincode excluded unless justified (data minimization) | `RECOMMENDED` | Strict adherence to privacy and data minimization |
| D-10 | Exclude face-match, liveness, GNN fraud, and NL circuit synthesis from MVP | `RECOMMENDED` (strong) | A client-supplied boolean is unconstrained in ZK |
| D-11 | Government channel = signed-webhook stub, visibly labelled | `RECOMMENDED` | Simulation only; never imply real government integration |
| D-12 | Stack: Hardhat + TypeScript (single framework), viem (single client), Circom 2.1.x + snarkjs (Groth16), Fastify, PostgreSQL, pnpm | `RECOMMENDED` | Pin exact versions after Gate 0 |
| D-13 | MST SDKs not required; if used, wrapped behind a `ChainAdapter` interface | `RECOMMENDED` | Avoid vendor lock-in and unresolved SDK package discrepancies |
| D-14 | Trusted setup: public Powers of Tau + project phase-2. Dev ceremony must be labeled DEV-ONLY. Production ceremony is separate | `RECOMMENDED` | Reassess Groth16 vs PLONK-family if Gate 0 reveals pairing cost issues |
| D-15 | Registry governance: pausable, role-based, timelock/multisig for issuer-key changes; no upgradeable proxy unless justified | `NEEDS_APPROVAL` | Security against key compromise and registry tampering |
| D-16 | If Gate 0 FAILS: stop, produce options paper (attestation-signature verification on-chain, alternative proof system, or different chain). Human decides | `BLOCKED` | Triggered only if Gate 0 fails |

