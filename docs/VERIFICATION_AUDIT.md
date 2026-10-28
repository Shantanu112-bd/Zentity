# docs/VERIFICATION_AUDIT.md — Verification & Evidence Audit

**Status:** Active · **Created:** 2026-10-28

All entries require a path to concrete command output or transaction receipt stored in `docs/evidence/`. Statuses: `PLANNED` · `IN_PROGRESS` · `IMPLEMENTED` · `TESTED` · `VERIFIED` · `BLOCKED` · `DEFERRED`.

| Target / Artifact | Stage | Status | Evidence Path | Verified By / Date | Notes |
|---|---|---|---|---|---|
| Git & Directory Layout | M0 | `VERIFIED` | Repository tree | Antigravity / 2026-10-28 | Clean git repo initialized on `main` branch |
| Toolchain (Node, Pnpm, Git, Docker, Snarkjs, Circom) | M0 | `VERIFIED` | `docs/ACTIVITY_LOG.md` | Antigravity / 2026-10-28 | Node v22.23.1, pnpm 11.13.0, circom 2.1.8, snarkjs 0.7.6 |
| Official Documentation Retrieval | M0 | `VERIFIED` | `docs/reference/mst-docs/` | Antigravity / 2026-10-28 | Retrieved 9 leaf markdown pages via direct HTTP. Note: Coral and 31 Jan 2027 shutdown are absent from docs |
| MST Legacy Testnet RPC Preflight | M0 | `VERIFIED` | `docs/evidence/preflight-mstLegacyTestnet.json` | Antigravity / 2026-10-28 | Chain ID 91562037 verified; block time ~2.73s; measured gas limit 55M |
| MST Mainnet RPC Preflight (Read-only) | M0 | `VERIFIED` | `docs/evidence/preflight-mstMainnet.json` | Antigravity / 2026-10-28 | Chain ID 4646 verified; block time ~2.88s; 14ms latency; measured gas limit 30M |
| BN254 Mathematical Test Vectors | M0 | `VERIFIED` | `scripts/gate0/vectors.json` | Antigravity / 2026-10-28 | Generated via `@noble/curves/bn254` v2.4.0 (EIP-196/197) |
| MST Legacy Testnet Precompile Probes | M0 | `VERIFIED` | `docs/evidence/precompile-probes-mstLegacyTestnet.json` | Antigravity / 2026-10-28 | 8/8 probes passed (`0x06`, `0x07`, `0x08`) via `eth_call` (legacy-testnet diagnostic) |
| MST Mainnet Precompile Probes | M0 | `VERIFIED` | `docs/evidence/precompile-probes-mstMainnet.json` | Antigravity / 2026-10-28 | 8/8 probes passed (`0x06`, `0x07`, `0x08`) via `eth_call` (mainnet diagnostic) |
| Precompile Probe Gas Consumption (LOCAL) | M0 | `VERIFIED` | `tests/gate0-precompile-probe.test.ts` | Antigravity / 2026-10-28 | **LOCAL (Hardhat node 31337):** add=552, mul=6396, pairing=113447 |
| Precompile Probe On-Chain Re-Measurement (MST) | M0 | `PLANNED` | `docs/evidence/gate0-precompile-gas-mst.json` | Pending B-04 testnet funds | Deploy `PrecompileProbe.sol` to MST to measure native gas costs |
| Toy Circom Circuit & SnarkJS Setup | M0 | `VERIFIED` | `circuits/gate0/` | Antigravity / 2026-10-28 | `multiplier.circom` compiled, proved, and verified locally |
| Solidity Verifier & Tamper Rejection (LOCAL) | M0 | `VERIFIED` | `tests/gate0-verifier.test.ts` | Antigravity / 2026-10-28 | 12/12 unit and tamper tests passing in Hardhat |
| MST Coral Testnet RPC Preflight | M0 | `VERIFIED` | `docs/evidence/preflight-coral-2026-10-29.json` | Antigravity / 2026-10-29 | Chain ID 54635 (0xd56b) verified; Geth v1.7.8; 30M gas limit; ecAdd, ecMul, ecPairing passed via eth_call |
| Network Guard & Safety Bounds | M0 | `VERIFIED` | `tests/network-guard.test.ts` | Antigravity / 2026-10-29 | 5/5 unit tests: chain ID mismatch aborts, mainnet write prohibited, unverified slot refused |
| Off-Chain Wallet Authentication (EIP-191) | MVP | `VERIFIED` | `tests/wallet-auth.test.ts` | Antigravity / 2026-10-29 | 7/7 unit tests: nonce challenge, replay rejection, expiry rejection, address mismatch rejection |
| On-Chain Negative Path Reverts | MVP | `VERIFIED` | `docs/evidence/negative-cases.json` | Antigravity / 2026-10-29 | 7/7 paths verified: InvalidProof, UnregisteredIssuer, ChainIdMismatch, RecipientMismatch, NullifierAlreadySpent, ContractPaused |
| Measured Gas Benchmark | M0/MVP | `VERIFIED` | `docs/evidence/gas-measured.json` | Antigravity / 2026-10-29 | ecAdd=552, ecMul=6396, ecPairing=113447, verifyProof=255949, verifyAndRecord=288846 gas |
| Proof-Gate UI Cinematic Walkthrough & Visual Parity | MVP | `VERIFIED` | `docs/evidence/ui/` (9 screenshots) | Antigravity / 2026-10-29 | 375px, 768px, 1440px screenshots across 3 chapters; zero scrollbars; 100% original brand assets |
| UI & Route Performance Benchmarks | MVP | `VERIFIED` | `docs/evidence/ui-perf-benchmarks.json` | Antigravity / 2026-10-29 | 663ms DOMContentLoaded, 732ms FCP, 11MB heap, 60fps, 0 canvases on `/prove` route |
| MST Coral Testnet On-Chain Deployment | M0/MVP | `BLOCKED` | `docs/evidence/testnet-mstCoralTestnet-2026-10-29/` | Pending B-04 testnet funds | Deployer `0xDED55a728B4ef6E91643eA947699C36e49CFfEFA` awaiting faucet funds from https://coral-faucet.mstblockchain.com/ |
| MST Legacy Testnet Verifier Deployment | M0 | `DEFERRED` | `docs/evidence/gate0-verifier-mstLegacyTestnet.json` | Fallback slot | Coral is preferred target network (shuts down 31 Jan 2027) |
