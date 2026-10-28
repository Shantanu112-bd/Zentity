# docs/PERF_BENCHMARKS.md — Performance Benchmarks & Budgets

**STATUS: SKELETON** · **Created:** 2026-10-28

## 1. Client-Side Proving Benchmarks
Target Device: Mid-range Android (3-4 GB RAM) & Desktop Chrome

| Metric | Target Budget | Measured Local (Desktop) | Measured Mobile (Android) | Status |
|---|---|---|---|---|
| zkey artifact download size | $\le 15$ MB | TBD | TBD | PENDING |
| WASM memory peak | $\le 1.2$ GB | TBD | TBD | PENDING |
| Witness calculation time | $\le 1.5$ s | TBD | TBD | PENDING |
| Groth16 proof generation time | $\le 4.5$ s | TBD | TBD | PENDING |
| Total client latency | $\le 6.0$ s | TBD | TBD | PENDING |

## 2. On-Chain Verification Gas Costs (MST)

| Operation | Target Budget | Measured Gas | Status |
|---|---|---|---|
| `PramaanVerifier` deployment | $\le 1,200,000$ | TBD | PENDING |
| `PramaanRegistry` deployment | $\le 1,500,000$ | TBD | PENDING |
| `verifyProof` execution (BN254 pairing) | $\le 300,000$ | TBD | PENDING |
| Nullifier registration & state update | $\le 80,000$ | TBD | PENDING |

