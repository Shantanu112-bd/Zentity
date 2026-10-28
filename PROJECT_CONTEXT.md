# PROJECT_CONTEXT.md — Pramaan-ZK / Zentity

## Project Summary
**Pramaan-ZK** (Zentity) is a privacy-preserving attribute verification system (initially proving age ≥ 18 and optionally state) from signed government credential QR payloads, proven client-side using zero-knowledge proofs (Groth16/Circom), consumed via:
- **Channel A (Web3):** dApps and smart contracts on MST Blockchain verifying or querying on-chain registry state.
- **Channel B (Web2):** Enterprise OIDC Gateway issuing signed, scoped, pairwise-subject claims.
- **Channel C (Government/DPI):** Signed-webhook simulation stub (strictly labeled as a stub; never claiming live government integration).

## Target Network
**MST Blockchain** (EVM-compatible L1, PoSA consensus).
- Authoritative target: **MST Coral Testnet** (Chain ID 54635; RPC UNVERIFIED; absent from official documentation).
- Diagnostic target: **Legacy Testnet** (Chain ID 91562037, RPC `https://testnetrpc.mstblockchain.com`).
- Direct precompile probes (`0x06`, `0x07`, `0x08`) via `eth_call` **PASSED** on both Legacy Testnet and Mainnet (8/8 probes).
- Precompile gas figures are currently labeled as `LOCAL` (Hardhat node); task scheduled to re-measure on MST via deployed `PrecompileProbe.sol`.

## Current Stage
**Stage:** Milestone M0 — Gate 0 Feasibility
- Status: `Legacy-testnet diagnostic completed; overall Gate 0 OPEN pending Coral testnet verification`.
- **Constraint:** Strictly NO real circuits or M1 work until Gate 0 is fully settled.

## MVP Scope
1. Synthetic test credential generator for offline QR format.
2. Client-side Groth16 proof generation proving:
   - Digital signature from issuer key is valid.
   - Age calculated from birth date ≥ 18 years.
   - (Optional) State equals target state.
   - Nullifier generated bound to credential secret and scope ID.
   - Proof bound to chainId, registry address, recipient address, nonce/action, deadline.
3. On-chain verifier (`PramaanVerifier.sol`) and state registry (`PramaanRegistry.sol`) on MST.
4. Gas relayer service for sponsored transactions.
5. Web2 OIDC service issuing pairwise JWT claims.
6. Minimal end-to-end integration demo.

## Out of Scope for MVP
- Mainnet deployments (strictly testnet only).
- Face matching, biometric matching, client-side liveness checks.
- Real Aadhaar / real PII ingestion (synthetic credentials only).
- GNN fraud detection or natural language circuit synthesis.
- Native SARAL gas sponsorship (until proven with official documentation).
- Complex UI / canvas portals (deferred to M9).

## Active Blockers (from §7)
- **B-01:** Coral Testnet official config (RPC, WSS, explorer, faucet).
- **B-02:** BN254 precompiles + EVM hardfork on MST (Gate 0 precompiles passed; on-chain testnet deployment pending B-04).
- **B-03:** Official docs leaf pages (Resolved: 9 pages retrieved into `docs/reference/mst-docs/`).
- **B-04:** Funded test-only wallet for MST testnet.
- **B-05:** Authoritative UIDAI Secure QR spec version and certificate handling.
- **B-06:** Legal/regulatory opinion on offline verification & DPDP.
- **B-07:** JS SDK package name discrepancies (Resolved: `@mstblockchain/mst-sdk` wraps ethers v6; D-13 adopted).
- **B-08:** Planet Jumping reference URL.
- **B-09:** Low/mid-range physical Android benchmark devices.
- **B-10:** Remainder of original idea description after Component 4.
- **B-11:** Human sign-off on decisions D-03, D-04, D-15.
