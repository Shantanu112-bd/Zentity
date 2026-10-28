# docs/OPEN_QUESTIONS.md — Open Questions & Blockers Log

**Status:** Active · **Created:** 2026-10-28

## Active Blockers

| ID | Category | Question / Blocker | Needed From | Impact | Status |
|---|---|---|---|---|---|
| B-01 | Network | What is the official MST Coral Testnet RPC URL, WebSocket URL, explorer URL, and faucet? Is Chain ID 54635 confirmed? | MST documentation or support | Gate 0 execution on authoritative network | OPEN |
| B-02 | Cryptography | Does MST EVM support BN254 pairing precompiles (`0x06`, `0x07`, `0x08`) at standard gas costs? What EVM hardfork is active? | Gate 0 empirical probe + MST team | Milestone M0 Gate 0 verdict | IN_PROGRESS (Gate 0 harness) |
| B-03 | Documentation | Official MST docs `.md` leaf pages return errors when accessed via HTTP. Can an export be provided? | Human operator | Reviewing validator specs and native features | OPEN |
| B-04 | Key / Faucet | Funded test-only private key (`DEPLOYER_PRIVATE_KEY` in untracked `.env`) on MST Legacy Testnet / Coral Testnet | Human operator | Broadcasting transactions on MST testnets | OPEN |
| B-05 | Identity | What specific UIDAI QR specification versions (v1, v2) and public keys/certs need to be supported? | Human operator + UIDAI specs | Anon Aadhaar circuit compatibility (M2) | OPEN |
| B-06 | Legal | Legal/regulatory evaluation under DPDP Act 2023, Aadhaar Act offline verification regulations, and RBI KYC guidelines | Qualified Indian legal counsel | Production deployments (M10) | OPEN (Non-blocking for synthetic M0-M8) |
| B-07 | SDK | Discrepancy between `@mstblockchain/mst-sdk` and `blockchain-sdk` on npm; does either support Coral? | Scratchpad inspection | Tooling choices (M1) | IN_PROGRESS |
| B-08 | Design | Exact reference URL and assets/notes for "Planet Jumping" UI reference | Human operator | Final UI design (M9) | OPEN (Non-blocking for M0-M8) |
| B-09 | Testing | Physical low/mid-range Android test device availability (e.g. 3-4GB RAM) for proving benchmarks | Human operator | Mobile performance gate (M2/PERF) | OPEN |
| B-10 | Scope | Remaining text of the original idea specification following "Component 4" | Human operator | Post-MVP features | OPEN (Non-blocking) |
| B-11 | Architecture | Human approval for Decisions D-03 (Anon Aadhaar base), D-04 (Nullifier formula), D-15 (Governance) | Human operator | Milestones M2 and M3 | PENDING M2 FINDINGS |

