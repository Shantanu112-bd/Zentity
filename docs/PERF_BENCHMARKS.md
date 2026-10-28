# docs/PERF_BENCHMARKS.md — Performance Benchmarks & Budgets

**STATUS: ACTIVE** · **Updated:** 2026-10-29

## 1. Client-Side Proving Benchmarks
Target Device: Desktop Chrome & Mid-range Mobile (WASM + SnarkJS Web Worker)

| Metric | Target Budget | Measured Local (Desktop) | Measured Mobile (Simulated 375px) | Status |
|---|---|---|---|---|
| zkey artifact size | $\le 15$ MB | 2.8 MB (dev-only Groth16) | 2.8 MB | MEASURED |
| wasm artifact size | $\le 15$ MB | 3.2 MB | 3.2 MB | MEASURED |
| Witness calculation time | $\le 1.5$ s | 120 ms | 210 ms | MEASURED |
| Groth16 proof generation time | $\le 4.5$ s | 516 ms | 820 ms | MEASURED |
| Total client latency | $\le 6.0$ s | **636 ms** | **1,030 ms** | MEASURED |
| Zero Network Egress Guarantee | 0 credential bytes leaked | **0 bytes egress** | **0 bytes egress** | VERIFIED |

## 2. On-Chain Verification Gas Costs

| Operation | Target Budget | Measured Gas | Network Environment | Status |
|---|---|---|---|---|
| `PramaanVerifier` deployment | $\le 1,200,000$ | 864,210 | Local Hardhat (31337) | MEASURED (LOCAL) |
| `PramaanRegistry` deployment | $\le 1,500,000$ | 1,028,450 | Local Hardhat (31337) | MEASURED (LOCAL) |
| `PramaanVerifier.verifyProof` | $\le 300,000$ | **255,949** | Local Hardhat (31337) | MEASURED (LOCAL) |
| `PramaanRegistry.verifyAndRecord` | $\le 350,000$ | **288,846** | Local Hardhat (31337) | MEASURED (LOCAL) |
| `0x06` (`ecAdd`) staticcall | $\le 1,000$ | **552** | Local Hardhat (31337) | MEASURED (LOCAL) |
| `0x07` (`ecMul`) staticcall | $\le 10,000$ | **6,396** | Local Hardhat (31337) | MEASURED (LOCAL) |
| `0x08` (`ecPairing`, 2 pairs) staticcall | $\le 150,000$ | **113,447** | Local Hardhat (31337) | MEASURED (LOCAL) |
| Native MST Precompile Re-Measurement | $\le 150,000$ | TBD | MST Coral Testnet (Chain 54635) | PLANNED (Pending B-04) |

## 3. UI & Portal Performance Benchmarks
Captured via Chrome DevTools Navigation & Paint Performance API (`docs/evidence/ui-perf-benchmarks.json`):

| UI Metric | Target Budget | Measured Value | Status |
|---|---|---|---|
| DOMContentLoaded | $\le 1,000$ ms | **663 ms** | MEASURED |
| Page Load Complete | $\le 1,500$ ms | **664 ms** | MEASURED |
| First Contentful Paint (FCP) | $\le 1,000$ ms | **732 ms** | MEASURED |
| JS Heap Memory Usage | $\le 30$ MB | **11.1 MB** | MEASURED |
| Animation Framerate | 60 fps | **60 fps** | MEASURED |
| `/prove` Route Isolation | 0 canvas / 0 portal wraps | **0 canvases running** | VERIFIED |
