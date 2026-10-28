# docs/RESEARCH_AUDIT.md — Pramaan-ZK Research Audit

**Created:** 2026-10-28 · **Status:** Active · **Rule:** Every row must be verified against live sources before depending on it. Record date, evidence, and status labels: `OFFICIAL` · `SECONDARY` · `CLAIM` · `MEASURED` · `UNVERIFIED`.

## Verified Facts Register

| ID | Fact / Claim | Status | Source & Accessed Date | Evidence Path | Notes / Follow-up |
|---|---|---|---|---|---|
| F-01 | MST is EVM-compatible, PoSA with Parlia-style round-robin blocks; Solidity; works with MetaMask/Remix/Hardhat | `OFFICIAL` + `MEASURED` | Official MST Docs & Preflight (2026-10-28) | `docs/reference/mst-docs/` & `docs/evidence/` | Geth-based execution; Paris EVM target verified |
| F-02 | Mainnet chain ID 4646 (0x1226), symbol MSTC, explorer https://mstscan.com | `OFFICIAL` + `MEASURED` | Preflight RPC (2026-10-28) | `docs/evidence/preflight-mstMainnet.json` | Verified via `eth_chainId` on `mariorpc.mstblockchain.com` |
| F-03 | Mainnet RPC `https://mariorpc.mstblockchain.com`. `craftrpc.mstblockchain.com` listed by Chainlist | `OFFICIAL` + `MEASURED` | Official Docs & Preflight (2026-10-28) | `docs/evidence/preflight-mstMainnet.json` | Active, 14-19ms latency. WSS unverified |
| F-04 | Legacy Testnet chain ID 91562037 (0x5752035), symbol tMSTC, RPC `https://testnetrpc.mstblockchain.com` | `OFFICIAL` + `MEASURED` | Official Docs & Preflight (2026-10-28) | `docs/evidence/preflight-mstLegacyTestnet.json` | Verified via `eth_chainId` on `testnetrpc.mstblockchain.com` |
| F-05 | Legacy Testnet shutdown after 31 Jan 2027, developers instructed to migrate to MST Coral Testnet | `SECONDARY` | Explorer banner per prior research | `docs/OPEN_QUESTIONS.md` | Treat as first-class constraint; ~95 days remaining |
| F-06 | MST Coral Testnet chain ID 54635, currency tMSTC. Coral RPC, WSS, explorer, faucet: UNVERIFIED | `SECONDARY` (weak) / `UNVERIFIED` | chainlist.wtf | Blocked on B-01 | Not yet listed in official docs index |
| F-07 | Faucets: `https://faucet.mstblockchain.com` (legacy) | `OFFICIAL` | Official Docs (2026-10-28) | `docs/reference/mst-docs/development-networks-mst-testnet.md` | Official faucet for Legacy Testnet |
| F-08 | Official docs index `https://docs.mstblockchain.com/developer-docs` and `llms.txt`; markdown pages retrievable with `.md` | `OFFICIAL` | Direct HTTP Fetch (2026-10-28) | `docs/reference/mst-docs/` | 9 core pages archived in repository |
| F-09 | SARAL = onboarding/key-management (MPC, SSO-style). Not shown to sponsor gas | `OFFICIAL` | MST site (2026-10-28) | `docs/ARCHITECTURE_DECISIONS.md` (D-06) | Gas sponsorship UNVERIFIED. Plan own relayer |
| F-10 | FortunX = commit-reveal randomness, not consensus. WASMify = Web2/Web3 bridge, not needed | `OFFICIAL` | MST site (2026-10-28) | `docs/ARCHITECTURE_DECISIONS.md` | Exclude from Pramaan-ZK architecture |
| F-11 | Canonical JS SDK is `@mstblockchain/mst-sdk` (wraps ethers v6); `blockchain-sdk` belongs to unrelated repo | `OFFICIAL` + `MEASURED` | Official Docs & npm view (2026-10-28) | `docs/reference/mst-docs/javascript-sdk.md` | Decision D-13 stands: use direct viem/Hardhat |
| F-12 | Block time ≈ 2.7 - 2.9 seconds | `MEASURED` | RPC Block progression samples (2026-10-28) | `docs/evidence/preflight-*.json` | Legacy Testnet ~2.73s, Mainnet ~2.88s |
| F-13 | BN254 precompiles 0x06 (ecAdd), 0x07 (ecMul), 0x08 (ecPairing) on MST | `MEASURED` | Direct eth_call probes (2026-10-28) | `docs/evidence/precompile-probes-*.json` | **PASS (8/8 probes passed on Testnet & Mainnet)** |
| F-14 | EVM hardfork / PUSH0 support, block gas limit | `MEASURED` | Official Docs & Preflight (2026-10-28) | `docs/reference/mst-docs/gas.md` & preflight evidence | Block gas limit: 55M (Testnet), 30M (Mainnet). Paris EVM target verified |
| F-15 | Other builders shipped Groth16 dApps for MST buildathons (ZKRelief, Namma Seva) | `SECONDARY` | GitHub buildathon repos | Repos review | Verified that BN254 is natively active |
| F-16 | MST MCP Server: intelligent docs gateway at `https://mcp.mstblockchain.com/sse` | `OFFICIAL` | Official Docs (2026-10-28) | `docs/reference/mst-docs/mcp.md` | Docs gateway for Claude/AI assistants |
| F-17 | Anon Aadhaar (PSE) is an existing Circom project for Aadhaar secure-QR proofs | `UNVERIFIED` in detail | PSE GitHub repository | Milestone M2 research | Inspect repo, license, UIDAI cert, nullifier |
| F-18 | RSA-2048 + SHA-256 over QR payload in Circom is large; 2.5-4.5s phone target needs measurement | `UNVERIFIED` | Circom benchmarks | Milestone M2 PERF gate | Measure on physical/emulated devices |
