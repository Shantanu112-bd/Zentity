# docs/VERIFICATION_AUDIT.md — Verification & Evidence Audit

**Status:** Active · **Created:** 2026-10-28

All entries require a path to concrete command output or transaction receipt stored in `docs/evidence/`. Statuses: `PLANNED` · `IN_PROGRESS` · `IMPLEMENTED` · `TESTED` · `VERIFIED` · `BLOCKED` · `DEFERRED`.

| Target / Artifact | Stage | Status | Evidence Path | Verified By / Date | Notes |
|---|---|---|---|---|---|
| Git & Directory Layout | M0 | `VERIFIED` | Repository tree | Antigravity / 2026-10-28 | Clean git repo initialized on `main` branch |
| Toolchain (Node, Pnpm, Git, Docker, Snarkjs, Circom) | M0 | `VERIFIED` | `docs/ACTIVITY_LOG.md` | Antigravity / 2026-10-28 | Node v22.23.1, pnpm 11.13.0, circom 2.1.8, snarkjs 0.7.6 |
| Official Documentation Retrieval | M0 | `VERIFIED` | `docs/reference/mst-docs/` | Antigravity / 2026-10-28 | Retrieved 9 leaf markdown pages via direct HTTP |
| MST Legacy Testnet RPC Preflight | M0 | `VERIFIED` | `docs/evidence/preflight-mstLegacyTestnet.json` | Antigravity / 2026-10-28 | Chain ID 91562037 verified; block time ~2.73s |
| MST Mainnet RPC Preflight (Read-only) | M0 | `VERIFIED` | `docs/evidence/preflight-mstMainnet.json` | Antigravity / 2026-10-28 | Chain ID 4646 verified; block time ~2.88s; 14ms latency |
| BN254 Mathematical Test Vectors | M0 | `VERIFIED` | `scripts/gate0/vectors.json` | Antigravity / 2026-10-28 | Generated via `@noble/curves/bn254` v2.4.0 (EIP-196/197) |
| MST Legacy Testnet Precompile Probes | M0 | `VERIFIED` | `docs/evidence/precompile-probes-mstLegacyTestnet.json` | Antigravity / 2026-10-28 | 8/8 probes passed (`0x06`, `0x07`, `0x08`) via `eth_call` |
| MST Mainnet Precompile Probes | M0 | `VERIFIED` | `docs/evidence/precompile-probes-mstMainnet.json` | Antigravity / 2026-10-28 | 8/8 probes passed (`0x06`, `0x07`, `0x08`) via `eth_call` |
| Precompile Probe Gas Consumption | M0 | `VERIFIED` | `tests/gate0-precompile-probe.test.ts` | Antigravity / 2026-10-28 | Measured via `PrecompileProbe.sol` staticcall: add=552, mul=6396, pairing=113447 |
| Toy Circom Circuit & SnarkJS Setup | M0 | `VERIFIED` | `circuits/gate0/` | Antigravity / 2026-10-28 | `multiplier.circom` compiled, proved, and verified locally |
| Solidity Verifier & Tamper Rejection | M0 | `VERIFIED` | `tests/gate0-verifier.test.ts` | Antigravity / 2026-10-28 | 12/12 unit and tamper tests passing in Hardhat |
| MST Legacy Testnet Verifier Deployment | M0 | `BLOCKED` | `docs/evidence/gate0-verifier-mstLegacyTestnet.json` | Pending B-04 testnet key | Blocked on human-funded wallet |
| MST Coral Testnet Precompile Probe | M0 | `BLOCKED` | `docs/evidence/precompile-probes-mstCoralTestnet.json` | Blocked on B-01 (Coral RPC) | Authoritative target network config required |
