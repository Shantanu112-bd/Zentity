# ANTIGRAVITY_MASTER_BUILD_PROMPT.md — Pramaan-ZK final MVP build

Repo: https://github.com/Shantanu112-bd/Zentity.git
Start every session with: "Read ANTIGRAVITY_MASTER_BUILD_PROMPT.md, AGENTS.md and docs/SESSION_HANDOFF.md, then execute the highest-priority unblocked task in §5. Do not re-plan or re-research."

This file supersedes DEADLINE_MODE_PROMPT.md and the testnet amendments where they conflict. ANTIGRAVITY_MASTER_LOOP_PROMPT.md still governs honesty and evidence rules. Where this file is silent, follow that one.

## 0. Non-negotiables

1. **Never fake success.** A result is shown as verified only when a real check passed and its evidence exists. No hardcoded "verified", no simulated tx hashes.
2. **No secrets.** Never print, request, or commit a private key, seed, token, or `.env` contents. The human supplies a test-only deployer key via a git-ignored `.env`. Never ask for it in chat.
3. **Chain-ID guard before every sign/broadcast.** Live `eth_chainId` must equal the configured slot and the wallet's chain. Mismatch means abort. No mainnet without explicit written human approval.
4. **No force-push, no history rewrite, no deleting user work.** Commit sequentially; push to the existing remote and branch only.
5. **Status labels (code, UI, docs):** `DEMO / SYNTHETIC` · `LOCAL VERIFIED` · `OFF-CHAIN VERIFIED` · `TESTNET TX CONFIRMED` · `ZK VERIFIED ON-CHAIN` · never `REAL CREDENTIAL VERIFIED` (synthetic EdDSA-Poseidon credential, DEV-ONLY ceremony, unreviewed nullifier).
6. **Gate 0 stays OPEN** until every criterion in §6 passes on **Coral**. A legacy-testnet pass is diagnostic only.
7. **Bounded effort:** at most 3 distinct fix attempts per failure, then log a blocker and move to the next unblocked task.

## 1. Inspect first (≤10 min, then build)

Run and record: `git status`, `git branch --show-current`, `git log --oneline -n 20`, `git remote -v`, toolchain versions (node, pnpm, circom, snarkjs, hardhat), `pnpm install`, `pnpm test`. Read AGENTS.md, PROJECT_CONTEXT.md, implementation_plan.md, docs/SESSION_HANDOFF.md, docs/VERIFICATION_AUDIT.md, last 100 lines of docs/ACTIVITY_LOG.md. If the tree is dirty with changes you did not make, stop and ask. Reuse working code (circuit, contracts, backend, client prover, frontend); do not rewrite what passes tests.

## 2. Network configuration (`config/networks.ts`)

| Slot | Chain ID | RPC | Explorer | Status |
|---|---|---|---|---|
| **mstCoralTestnet (preferred)** | 54635 (0xd56b) | `https://coralrpc.mstblockchain.com` | `https://coral.mstscan.com` | PROVISIONAL (ChainList: https://chainlist.org/chain/54635) until live-verified |
| mstLegacyTestnet (fallback) | 91562037 (0x5752035) | `https://testnetrpc.mstblockchain.com` | `https://testnet.mstscan.com` | Verified by earlier preflight; shuts down after 31 Jan 2027; label **LEGACY** |
| mstMainnet | 4646 | `https://mariorpc.mstblockchain.com` | `https://mstscan.com` | Read-only; no writes |

Faucets (human operator uses them): Coral `https://coral-faucet.mstblockchain.com/`; legacy `https://faucet.mstblockchain.com/`.

Task: run the read-only preflight on Coral (`eth_chainId`, `eth_blockNumber` ×3, `eth_gasPrice`, `eth_getBlockByNumber('latest')` gasLimit, `eth_getBalance(deployer address)`). Save to `docs/evidence/preflight-coral-<date>.json`. Mark Coral `verified` only if chain ID matches. Otherwise record the failure and run everything on legacy, labelled LEGACY. UI and every report show the active network name, chain ID and label.

## 3. Local environment (human does this once)

```bash
# generate a test-only key into .env (prints address only), then confirm ignore
node -e "const {generatePrivateKey,privateKeyToAccount}=require('viem/accounts');const k=generatePrivateKey();require('fs').appendFileSync('.env','\nDEPLOYER_PRIVATE_KEY='+k+'\n');console.log('Fund:',privateKeyToAccount(k).address)"
git check-ignore .env      # must print .env
```
Fund the printed address from the faucet. If the key is missing or the balance is 0, continue all non-broadcast work (§5 steps 2, 4, 5 locally), and report the single local step the human must do. Never block on it silently.

## 4. Architecture (reuse as-is; do not re-argue)

Synthetic credential (DEMO ISSUER, EdDSA-Poseidon) → Circom Groth16 circuit (age ≥ 18, scoped nullifier, recipient/scope/chain binding) → browser prover (SnarkJS in a Web Worker, zero-egress) → `PramaanRegistry.verifyAndRecord` (real generated verifier, nullifier set, issuer registry, pause) → events/explorer. Backend (Fastify): demo issuer, off-chain verify, OIDC-lite, optional relayer, government **SIMULATION** stub. Database only if already used; add nothing new.

**Critical rule:** the user's connected wallet signs and sends the transaction; the proof's `recipient` must equal that wallet address; the contract must check `recipient`, `chainId`, `scopeId`, issuer registration and nullifier freshness. Relayer path is optional and secondary.

## 5. Implementation order (commit after each; `pnpm test` before each commit)

1. **Network guard + preflight (Coral → legacy fallback).** Guard unit tests: wrong chain ID aborts; unverified slot refuses broadcast; mainnet write refused.
2. **Deploy to the target testnet.** Verifier, `PramaanRegistry`, `PrecompileProbe`; register the demo issuer key hash; `pnpm run deploy:<network>`. Save `docs/evidence/testnet-<network>-<date>/deployment.json` (addresses, deploy tx hashes, blocks, gas, deployer public address, chain ID, explorer URLs). Check `eth_getCode` for each. Optionally verify source on the explorer if its API works.
3. **Wallet connect (MetaMask/injected, via viem).** Detect wrong network, offer `wallet_addEthereumChain`/switch using the configured slot only after the live chain ID check, show address and network label. No auto-signing.
4. **Wallet authentication (off-chain, optional but preferred).** Server issues a one-time random nonce with expiry bound to origin and address; the wallet signs (EIP-4361-style message); the server verifies the signature, consumes the nonce, and rejects replay/expiry/wrong-origin. Tests for replay, expiry, and wrong-address. UI text: "Signing in is free and is not a blockchain transaction."
5. **The real transaction.** On `/prove`: issue synthetic credential → generate proof (progress + cancel) → verify off-chain → explicit **"Submit to MST"** click → wallet signs `verifyAndRecord` → wait for receipt, require `status == 1` and chain ID match → decode the expected event and read back registry state → show tx hash, contract, block, gas used, and a working explorer link `<explorer>/tx/<hash>`. Persist the last result so `/verify/:tx` re-reads the chain (no cached "success").
6. **Negative paths on-chain** (via `eth_call`/`estimateGas`, no gas spent; save results): tampered proof, tampered public input, replayed nullifier, wrong recipient, wrong scope, unregistered issuer, paused registry. UI shows the real revert reason.
7. **Measured gas.** Use `PrecompileProbe` and the verifier call to replace every `LOCAL` gas figure with `MEASURED(<network>)`; record docs-vs-live block gas limit discrepancy as-is.
8. **Explorer check.** Fetch/open the explorer page for the tx; confirm sender, target, block, status match the receipt. Save sanitized evidence. If the explorer is unreachable, say "receipt confirmed, explorer unchecked".
9. **Integration pages.** `/relying-party` (OIDC-lite, pairwise sub), `/dapp` (reads registry state for the connected wallet), government stub with "SIMULATION — NOT A GOVERNMENT INTEGRATION". Reuse existing code; fix only what fails.
10. **UI polish (after steps 1–8 work).** Using the reference site, screenshots and assets the human places in `docs/reference/ui/` (read them first), reproduce layout, preloader with real progress, canvas "proof-gate" portal with parallax/tilt, staged reveals, desktop-only custom cursor, motion and interaction patterns, in Pramaan-ZK's own brand (own name, logo, copy, typography, palette, procedural visuals; no copied footage, logos, fonts, copy, or CDN assets). If no reference is present, build to the existing `/` design and say so. Requirements: responsive from 360 px, `prefers-reduced-motion`, keyboard focus, AA contrast, landing code-split from the prover route, no heavy animation during proving, state-accurate portal (opens only on a real verified result).
11. **Docs and handoff.** README (run commands, demo script ≤3 min, real/mocked/unverified table), update ACTIVITY_LOG, VERIFICATION_AUDIT, GATE0_TEST_REPORT, RESEARCH_AUDIT (endpoint provenance + live results), CHANGELOG, implementation_plan, SESSION_HANDOFF with exactly one next action.

**Cut order if time runs out:** UI effects beyond portal+preloader → government stub → `/dapp` → OIDC-lite → wallet login. Never cut steps 1, 2, 5, 6, 8.

## 6. Gate 0 acceptance (all on Coral to close; record each with evidence)

- Live chain ID = 54635 and RPC identity recorded.
- Precompile probes (0x06/0x07/0x08) pass via `eth_call` **and** `PrecompileProbe` on-chain with measured gas.
- Real generated verifier deployed; **valid proof → success tx** with `status 1` and event; **tampered proofs rejected**; replay rejected.
- Repeated ≥5 times with consistent results; tool versions and exact commands saved.
- Remaining limits documented.

Verdict: **PASS / FAIL / INCONCLUSIVE**. FAIL needs verified-correct vectors and a validated harness; otherwise INCONCLUSIVE. Failed `verifyProof` alone proves nothing: walk the diagnosis checklist (network, balance/nonce, RPC limits, `evmVersion`, size/gas limits, encoding, public-signal order, vkey mismatch, harness bug). Default compiler target first; `paris` only as a recorded diagnostic.

## 7. Recovery procedures

- **pnpm/circom not on PATH:** locate and export PATH; record versions; never reinstall globally without need.
- **Build scripts blocked (`pnpm approve-builds`):** approve only named packages needed (e.g. blake-hash); record it.
- **RPC errors/rate limits:** retry with backoff ≤3, then try the second endpoint/slot; log the evidence; do not hammer.
- **Insufficient funds / nonce issues:** stop broadcasting; report address and balance only; for stuck nonces, inspect pending vs latest before replacing; never blindly resubmit state-changing txs.
- **Deploy fails with opcode errors:** retry once with `evmVersion: paris`; record both outcomes.
- **Wallet wrong chain:** block the action and show a switch prompt; never sign.
- **Test failures:** reproduce minimal, root-cause, regression test; never weaken or delete a test to get green.
- **Uncommitted foreign changes / merge conflicts:** stop and ask.

## 8. Required evidence layout

`docs/evidence/testnet-<network>-<date>/`: `preflight.json`, `deployment.json`, `tx-verifyAndRecord.json` (hash, receipt status, block, gas, event, explorer URL), `negative-cases.json`, `gas-measured.json`, `explorer-check.md`. Sanitized only: no keys, no raw credentials, no witnesses.

## 9. Final deliverables and report (≤15 lines)

Working app from `pnpm install && pnpm dev`; contracts deployed with addresses; at least one confirmed `verifyAndRecord` tx with an explorer link; negative-case results; updated docs and evidence; sequential commits pushed. Report: what works locally; what works on testnet (network, chain ID, label); tx hash + explorer URL; what remains synthetic/mock; test counts; commit hashes; Gate 0 verdict; blockers. Claim "testnet transaction demo verified" only after §5 step 8, and "on-chain ZK verified" only after steps 5–6.

**Begin now:** run §1, then §2, then continue down §5 until blocked, then report.
