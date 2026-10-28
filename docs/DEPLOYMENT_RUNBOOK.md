# docs/DEPLOYMENT_RUNBOOK.md — Deployment & Operations Runbook

**STATUS: SKELETON** · **Created:** 2026-10-28

## 1. Network Deployment Prerequisite Checklist
- [ ] Network status is `verified` in `config/networks.ts`.
- [ ] Deployer address verified and funded with sufficient native currency (`tMSTC`).
- [ ] Gate 0 PASS verdict documented in `docs/GATE0_TEST_REPORT.md`.
- [ ] Compiler version and `evmVersion` pinned.
- [ ] Contract artifact checksums recorded.

## 2. Smart Contract Deployment Steps
1. Verify target network connection: `pnpm run preflight --network <target>`
2. Deploy `PramaanVerifier.sol`: `pnpm hardhat run scripts/deploy-verifier.ts --network <target>`
3. Deploy `PramaanRegistry.sol`: `pnpm hardhat run scripts/deploy-registry.ts --network <target>`
4. Initialize active issuer key hashes.
5. Record addresses and transaction hashes into `docs/evidence/deployments/`.

## 3. Emergency Procedures
- In case of critical exploit or key compromise: invoke `pause()` on `PramaanRegistry` via multi-sig / admin key.

