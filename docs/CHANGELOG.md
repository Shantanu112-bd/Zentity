# CHANGELOG.md — Pramaan-ZK / Zentity

All notable changes to this project will be documented in this file.
The format is based on Keep a Changelog.

## [Unreleased]

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
- **Test Suite:**
  - Automated Hardhat test suite in `tests/gate0-*.test.ts` (12/12 passing tests) covering valid proofs, tampered signals, flipped coordinates, swapped terms, and deterministic repeated execution.
