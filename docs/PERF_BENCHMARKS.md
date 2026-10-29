# docs/PERF_BENCHMARKS.md — Performance Benchmarks & Budgets

**STATUS: ACTIVE** · **Updated:** 2026-10-29

> **Honesty & Scoping Notice:**
> 1. **Circuit Scope:** Proving benchmarks are measured exclusively for a **5,014-constraint synthetic credential circuit** (`AgeCredential.circom`, EdDSA-Poseidon + age predicate) running on a **desktop environment** (macOS arm64 / Node.js v22 / Chrome v131). Physical mobile device proving has **not** been measured and remains `UNVERIFIED`.
> 2. **UI Benchmarks:** Navigation, paint, and memory metrics are **desktop-unthrottled** measurements captured via Chrome DevTools Protocol. Throttled mobile CPU/network profiles have not been benchmarked.
> 3. **Gas Figures:** Both native EVM testnet figures on **MST Coral Testnet (Chain 54635)** and earlier figures relabeled as **LOCAL (Hardhat Node 31337)** are reported below with full raw transaction evidence.

---

## 1. Client-Side Proving Benchmarks (Desktop Unthrottled)
Environment: macOS arm64, Node v22.23.1, SnarkJS Groth16 WASM

| Metric | Target Budget | Measured Desktop (Unthrottled) | Physical Mobile Hardware | Status |
|---|---|---|---|---|
| Circuit Complexity | $\le 10,000$ constraints | **5,014 R1CS constraints** | N/A | MEASURED |
| zkey artifact size | $\le 15$ MB | **2.8 MB** (dev-only Groth16) | UNVERIFIED | MEASURED |
| wasm artifact size | $\le 15$ MB | **3.2 MB** | UNVERIFIED | MEASURED |
| Witness calculation time | $\le 1.5$ s | **120 ms** | UNVERIFIED | MEASURED (DESKTOP) |
| Groth16 proof generation time | $\le 4.5$ s | **516 ms** | UNVERIFIED | MEASURED (DESKTOP) |
| Total client latency | $\le 6.0$ s | **636 ms** | UNVERIFIED | MEASURED (DESKTOP) |
| Zero Network Egress Guarantee | 0 credential bytes leaked | **0 bytes egress** | 0 bytes egress | VERIFIED |

---

## 2. On-Chain Verification Gas Costs: Native Testnet vs Local

Measured on-chain against live deployed contracts on **MST Coral Testnet (Chain 54635)** at:
- `PrecompileProbe`: `0x94b9b520b975e20e82ce5862c523bfe389c12ed3`
- `PramaanVerifier`: `0xed8fe30962b3df64accdf867a355c68addedbf28`
- `PramaanRegistry`: `0x8c182a53fca78fe237734239bdb1256bc2658c5b`

| Operation | Target Budget | Measured on MST Coral Testnet (54635) | Earlier Measured Figures (LOCAL 31337) | Live Tx / Evidence | Status |
|---|---|---|---|---|---|
| `0x06` (`ecAdd`) staticcall | $\le 1,000$ | **552 gas** | 552 gas | `probe.read.probeAdd` | MEASURED (CORAL) |
| `0x07` (`ecMul`) staticcall | $\le 10,000$ | **6,396 gas** | 6,396 gas | `probe.read.probeMul` | MEASURED (CORAL) |
| `0x08` (`ecPairing`, 2 pairs) staticcall | $\le 150,000$ | **113,447 gas** | 113,447 gas | `probe.read.probePairing` | MEASURED (CORAL) |
| `PramaanVerifier.verifyProof` | $\le 300,000$ | **259,184 gas** | 255,949 gas | `estimateContractGas` | MEASURED (CORAL) |
| `PramaanRegistry.verifyAndRecord` | $\le 350,000$ | **288,882 gas** | 288,846 gas | Tx `0xa41c72a2...` | MEASURED (CORAL) |
| `PramaanVerifier` deployment | $\le 1,200,000$ | Contract deployed | 864,210 gas | `0xed8fe309...` | DEPLOYED (CORAL) |
| `PramaanRegistry` deployment | $\le 1,500,000$ | Contract deployed | 1,028,450 gas | `0x8c182a53...` | DEPLOYED (CORAL) |

---

## 3. UI & Portal Performance Benchmarks (Desktop Unthrottled)
Captured via Chrome DevTools Navigation & Paint Performance API (`docs/evidence/ui-perf-benchmarks.json`) on unthrottled desktop:

| UI Metric | Target Budget | Measured Desktop (Unthrottled) | Status |
|---|---|---|---|
| DOMContentLoaded | $\le 1,500$ ms | **1,313 ms** | MEASURED (DESKTOP) |
| Page Load Complete | $\le 1,500$ ms | **1,315 ms** | MEASURED (DESKTOP) |
| First Contentful Paint (FCP) | $\le 1,500$ ms | **1,428 ms** | MEASURED (DESKTOP) |
| JS Heap Memory Usage | $\le 80$ MB | **66.0 MB** | MEASURED (DESKTOP) |
| Animation Framerate | 60 fps | **60 fps** | MEASURED (DESKTOP) |
| `/app/prove` Route Isolation | 0 canvas / 0 portal wraps | **0 canvases running** | VERIFIED |
| Throttled Mobile Profile | LCP $\le 2.5$ s | **PENDING (Unverified on mobile hardware)** | UNVERIFIED |
