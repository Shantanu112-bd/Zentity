# docs/GATE0_TEST_REPORT.md — Gate 0 Feasibility Report: BN254 Groth16 on MST

**Target Networks:**
- MST Legacy Testnet (`91562037` / 0x5752035)
- MST Mainnet (`4646` / 0x1226)
- Local Hardhat Node (`31337`)
- MST Coral Testnet (`54635` — Pending B-01)

**Report Date:** 2026-10-28 · **Author:** Antigravity (Gemini 3.8 Flash)
**Status:** `MEASURED & VERIFIED (PRECOMPILES & LOCAL VERIFIER)` · `AWAITING B-04 (TESTNET DEPLOYMENT)`

---

## 1. Executive Summary & Verdict

| Target | Preflight | Precompiles (0x06, 0x07, 0x08) | On-Chain Verifier Execution | Overall Verdict |
|---|---|---|---|---|
| **Local EVM (Hardhat Node)** | PASS | PASS (Measured Gas) | PASS (Valid + Tampered) | **PASS** |
| **MST Legacy Testnet (91562037)** | PASS (Chain ID 91562037) | **PASS (8/8 Probes Passed)** | Pending B-04 Funded Key | **PASS (Precompile Feasibility)** |
| **MST Mainnet (4646)** | PASS (Chain ID 4646) | **PASS (8/8 Probes Passed)** | Read-Only (M10 Protected) | **PASS (Precompile Feasibility)** |
| **MST Coral Testnet (54635)** | Blocked on B-01 | Blocked on B-01 | Blocked on B-01 | **BLOCKED (B-01)** |

**Key Finding:** MST Blockchain natively and correctly implements the BN254 elliptic curve precompiles (`0x06` ecAdd, `0x07` ecMul, `0x08` ecPairing) according to EIP-196 and EIP-197. All 8 mathematical and rejection probes passed on both MST Legacy Testnet and MST Mainnet via `eth_call`.

---

## 2. Phase A: Network Preflight Measurements

### MST Legacy Testnet (`mstLegacyTestnet`)
- **RPC URL:** `https://testnetrpc.mstblockchain.com`
- **Chain ID:** `91562037` (`0x5752035`) — Exact match with configuration.
- **Client Version:** `Geth/v1.7.3-5c7d31a4-20260519/linux-amd64/go1.25.0`
- **Gas Price:** `1000000000 wei` (1 Gwei)
- **Block Gas Limit:** `55,000,000` gas
- **Block Progression:** Advanced 8 blocks in 21.9 seconds (Observed Block Time: ~`2.73s`)
- **Evidence Path:** `docs/evidence/preflight-mstLegacyTestnet.json`

### MST Mainnet (`mstMainnet`)
- **RPC URL:** `https://mariorpc.mstblockchain.com`
- **Chain ID:** `4646` (`0x1226`) — Exact match with configuration.
- **Client Version:** `Geth/v1.7.8-cdb7548b-20260811/linux-amd64/go1.25.0`
- **Gas Price:** `1000000000 wei` (1 Gwei)
- **Block Gas Limit:** `30,000,000` gas
- **Block Progression:** Advanced 7 blocks in 20.1 seconds (Observed Block Time: ~`2.88s`)
- **RPC Latency:** 14ms - 19ms
- **Evidence Path:** `docs/evidence/preflight-mstMainnet.json`

---

## 3. Phase B: Direct Precompile Probes (`eth_call`)

Test vectors were generated independently using `@noble/curves/bn254` v2.4.0 (provenance recorded in `scripts/gate0/vectors.json`).

| Probe ID | Precompile | Input Condition | Expected Output / Behavior | MST Legacy Testnet Result | MST Mainnet Result | Verdict |
|---|---|---|---|---|---|---|
| P-01 | `0x06` (`ecAdd`) | $G_1 + 2\cdot G_1 = 3\cdot G_1$ | Exact point matching `0x0769bf...` | Matched exactly | Matched exactly | **PASS** |
| P-02 | `0x06` (`ecAdd`) | Point $(1,1) \notin \mathbb{E}$ | Revert / error `point is not on curve` | Reverted with code `-32000` | Reverted with code `-32000` | **PASS** |
| P-03 | `0x07` (`ecMul`) | $7 \cdot G_1$ | Exact point matching `0x17072b...` | Matched exactly | Matched exactly | **PASS** |
| P-04 | `0x07` (`ecMul`) | Point $(1,1) \notin \mathbb{E}$ | Revert / error `point is not on curve` | Reverted with code `-32000` | Reverted with code `-32000` | **PASS** |
| P-05 | `0x08` (`ecPairing`) | $e(G_1, G_2)\cdot e(-G_1, G_2) = 1$ | $1$ (`0x00...01`) | Returned `0x00...01` | Returned `0x00...01` | **PASS** |
| P-06 | `0x08` (`ecPairing`) | $e(G_1, G_2)\cdot e(G_1, G_2) \neq 1$ | $0$ (`0x00...00`) | Returned `0x00...00` | Returned `0x00...00` | **PASS** |
| P-07 | `0x08` (`ecPairing`) | Malformed input length (100 bytes) | Revert / error `bad elliptic curve pairing size` | Reverted with code `-32000` | Reverted with code `-32000` | **PASS** |
| P-08 | `0x08` (`ecPairing`) | Invalid point in pairing tuple | Revert / error `point is not on curve` | Reverted with code `-32000` | Reverted with code `-32000` | **PASS** |

**Evidence Paths:**
- `docs/evidence/precompile-probes-mstLegacyTestnet.json`
- `docs/evidence/precompile-probes-mstMainnet.json`

---

## 4. Phase B.2: On-Chain Gas Measurements (`PrecompileProbe.sol`)

Deployed `contracts/PrecompileProbe.sol` on local Hardhat node and measured `gasleft()` delta around `staticcall`:
- **`ecAdd` (`0x06`):** `552 gas` (EIP-1108 base 150 gas + wrapper overhead)
- **`ecMul` (`0x07`):** `6,396 gas` (EIP-1108 base 6,000 gas + wrapper overhead)
- **`ecPairing` (`0x08`, 2 pairs):** `113,447 gas` (EIP-1108 formula: $45,000 + 2 \times 34,000 = 113,000$ gas + wrapper overhead)

**Conclusion:** Precompile pricing strictly aligns with standard Ethereum EIP-1108 gas repricing.

---

## 5. Phase C: Toy Circuit & Local Verification

- **Circom Compiler:** `2.1.8` (built from source via Cargo on macOS Darwin x86_64)
- **Circuit:** `circuits/gate0/multiplier.circom` (non-linear constraints: 1, wires: 4)
- **Ceremony:** DEV-ONLY Powers of Tau 8 (BN128) + Groth16 phase-2
- **Witness:** $a=3, b=11 \implies c=33$
- **SnarkJS Verification:** `snarkjs.groth16.verify` returned `true`
- **Solidity Verifier:** `contracts/MultiplierVerifier.sol` generated and compiled cleanly under `solc 0.8.20` with EVM target `paris`.

---

## 6. Phase D: Verifier Contract Execution & Tamper Tests

Tested against `Groth16Verifier.sol`:
- Valid proof: **PASS** (`verifyProof` returned `true`)
- Tampered public signal ($c=34$): **PASS** (rejected, returned `false`)
- Tampered coordinate (flipped $pA[0]$): **PASS** (rejected / reverted safely)
- Swapped proof terms ($pA \leftrightarrow pC$): **PASS** (rejected, returned `false`)
- Deterministic repeated calls: **PASS** (5/5 consecutive calls returned `true`)
- Full test suite: **12 passing tests** in `pnpm test`
- **Evidence Path:** `docs/evidence/gate0-verifier-local.json`

---

## 7. Next Step for Milestone M0 Gate 0 Completion
To complete the final on-chain transaction deployment on MST Legacy Testnet:
- **Action Required from Human Operator:** Provide a test-only private key funded with testnet `tMSTC` in untracked `.env` as `DEPLOYER_PRIVATE_KEY=0x...` (Blocker B-04).
- As soon as `.env` is populated, running `pnpm run gate0:legacy` will broadcast and log the deployment transaction hash and confirmation receipt.
