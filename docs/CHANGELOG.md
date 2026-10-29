# CHANGELOG.md — Pramaan-ZK / Zentity

All notable changes to this project will be documented in this file.
The format is based on Keep a Changelog.

## [Unreleased]

### Added - MST Coral Testnet Deployment & Gate 0 Closure
- **On-Chain Deployment on MST Coral Testnet (`54635`):** Deployed `PrecompileProbe` (`0x94b9b520b975e20e82ce5862c523bfe389c12ed3`), `PramaanVerifier` (`0xed8fe30962b3df64accdf867a355c68addedbf28`), and `PramaanRegistry` (`0x8c182a53fca78fe237734239bdb1256bc2658c5b`). Registered Demo Issuer key hash on-chain (tx `0x2011b9a1191b865ff39443a6c200b399976bd1ec5735006c384848d675992e1c`). Bytecode verified via `eth_getCode`.
- **Live On-Chain Gas Benchmarks:** Measured native precompiles and verification on Coral Testnet: 0x06 `ecAdd` (552 gas), 0x07 `ecMul` (6,396 gas), 0x08 `ecPairing` (113,447 gas), `verifyProof` (259,184 gas), and `verifyAndRecord` (288,882 gas in mined tx `0xa41c72a21eee292173d37ca957dee958610117b29156f80418b6020d7f3ff472`). Earlier Hardhat numbers relabeled `LOCAL`.
- **On-Chain Negative Paths Audit on Coral:** Verified 7/7 failure modes revert safely on Coral testnet: tampered proof, unregistered issuer, chainId mismatch, recipient mismatch, replay attack, paused state, and tampered public signal.
- **Scoping Disclosures:** Corrected performance disclosures in `PERF_BENCHMARKS.md`: proving time is for 5,014-constraint synthetic circuit on desktop; UI perf is desktop-unthrottled; physical mobile hardware remains unverified.
- **Gate 0 Status:** Updated verdict to `PASS (Live On-Chain Verified on MST Coral Testnet 54635)`.

### Added - Step 10: Proof-Gate Landing Walkthrough (Cinematic Native Canvas)
- **Cinematic Landing Walkthrough:** Implemented native HTML5 2D canvas procedural scene renderer and fake-3D perspective tilt engine (`PortalEngine.ts`) inspired by the reference PDF with 100% original assets and zero third-party animation libraries.
- **Brand Identity Asset:** Designed geometric hexagonal shroud and keyhole portal SVG logo at `frontend/public/brand/logo.svg`.
- **4 Procedural Canvas Scenes:** Built `scenes.ts` generating offscreen scenes: `credentialScene` (drifting credential cards and Poseidon glyphs), `proofScene` (particle ring converging into circuit trace grid), `verifiedScene` (isometric block ledger lattice), and `warpScene` (1.1s cubic hyperdrive streaks).
- **Responsive & Accessible Visual Polish:** Complete zero-scrollbar layout across mobile (375px), tablet (768px), and desktop (1440px) with custom cursor and `prefers-reduced-motion` compliance.
- **Evidence & Performance Suite:** Captured 9 screenshots across all 3 viewports and 3 chapters in `docs/evidence/ui/`. Verified route isolation (0 canvas overhead on `/prove`). Measured 663ms DOMContentLoaded, 732ms FCP, 11MB JS Heap, and 60fps framerate.

### Added - Milestone M0 (Bootstrap & Gate 0 Feasibility)
- **Repository Bootstrap:** Initialized repository architecture, operational rules (`AGENTS.md`), master loop prompt (`ANTIGRAVITY_MASTER_LOOP_PROMPT.md`), and comprehensive documentation suite in `docs/`.
- **Network Configuration:** Added `config/networks.ts` with strict broadcast safety guards preventing unintentional execution on unverified networks or mainnet.
- **Documentation Archive:** Downloaded and preserved official MST Blockchain documentation pages (EVM specs, opcodes, gas model, network parameters, and SDKs) in `docs/reference/mst-docs/`.
- **Preflight & Precompile Probes:**
  - Automated read-only RPC preflight (`scripts/gate0/01-preflight.ts`) measuring block times, gas limits, and client versions on Legacy Testnet and Mainnet.
  - BN254 mathematical test vector generator (`scripts/gate0/generate-vectors.ts`) using `@noble/curves/bn254` v2.4.0 (EIP-196/197).
  - Direct `eth_call` precompile probes (`scripts/gate0/02-precompiles.ts`) verifying that `0x06` (`ecAdd`), `0x07` (`ecMul`), and `0x08` (`ecPairing`) are fully active and operational on both MST Legacy Testnet and Mainnet (8/8 probes passed).
- **Smart Contracts & Gas Measurement:**
  - `contracts/PrecompileProbe.sol`: Measuring on-chain gas costs for precompile calls via `staticcall` (552 gas for `ecAdd`, 6,396 gas for `ecMul`, 113,447 gas for `ecPairing`).
  - `contracts/MultiplierVerifier.sol`: Generated Groth16 pairing verifier contract.
- **Circom & ZK Pipeline:**
  - Built `circom v2.1.8` from Rust source for Darwin x86_64.
  - Authored toy circuit `circuits/gate0/multiplier.circom`, executed dev-only Powers of Tau 8 ceremony, generated witness and proof, verified locally with snarkjs.
- **Feasibility & Gate 0 Refinements:**
  - Audited official docs for Coral testnet and shutdown notices (zero occurrences recorded; F-05, F-06 in `RESEARCH_AUDIT.md`).
  - Relabeled precompile gas figures as `LOCAL (Hardhat node 31337)` and scheduled native on-chain measurement task via `PrecompileProbe.sol`.
  - Recorded gas limit discrepancy between official docs (15M target / 30M max) and live testnet RPC (55M limit).
  - Clarified Gate 0 verdict: `PASS (legacy-testnet diagnostic)`, with overall Gate 0 remaining `OPEN` pending Coral testnet verification.
  - Implemented two-stage verifier deployment runner testing default `evmVersion` first, falling back to `paris` only if default fails.
- **Test Suite:**
  - Automated Hardhat test suite in `tests/gate0-*.test.ts` (12/12 passing tests) covering valid proofs, tampered signals, flipped coordinates, swapped terms, and deterministic repeated execution.


## [0.3.0] - 2026-10-29
### Added
- Complete UI redesign matching `bDmADrNPj4BiT_qYsfvm-neWDol26SLv6udUYv7W0sE.md` specification:
  - Full-screen black outer frame (`p-3 md:p-4`) with rounded-2xl inner stage.
  - Procedural dark particle vortex background stage with soft light streaks, 24–30 FPS cap, and bottom darkening gradient for high contrast.
  - Octagonal cut-corner buttons (`.btn-cut`, `.btn-cut-border`, `.btn-cut-sm`) with custom inset `:focus-visible` outline clipping survival.
  - Staggered fadeUp (`0.8s cubic-bezier(0.16, 1, 0.3, 1)`) and fadeIn animations with exact delay tables (0.1s to 1.0s).
  - Inter typography (weights 300–900) loaded via Google Fonts with preconnect.
  - Custom 256×256 geometric vector brand logo with "P R A M A A N" tracking wordmark.
  - Dev-only visual QA showcase route at `/dev/ui`.
  - Dedicated 404 page in redesign aesthetic.
  - High-fidelity screenshots across 1440px, 768px, and 375px in `docs/evidence/ui/redesign/`.
### Performance & Security
- Isolated CPU for Groth16 SnarkJS Web Worker: BackgroundStage operates in `staticMode` on `/app/*` routes, running 0 continuous rAF animation loops during proving.
- Zero external CDN hotlinks: All media and icons are locally hosted or drawn procedurally.
- All 46 tests passing with zero regressions.
