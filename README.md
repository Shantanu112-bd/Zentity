# Zentity (Pramaan-ZK)

> Privacy-Preserving Zero-Knowledge Attribute Verification on MST Blockchain.

Pramaan-ZK (Zentity) enables users to prove credentials (such as age ≥ 18 and state of residence) derived from signed government QR payloads entirely client-side using zero-knowledge proofs (Groth16/Circom), without revealing PII, date of birth, or credential numbers.

## Project Architecture
- **Web3 Channel:** Native smart contracts on MST Blockchain verifying proofs and maintaining nullifier records.
- **Web2 Channel:** Enterprise OIDC Gateway providing OAuth2/PKCE flows with pairwise pseudonymous `sub` identifiers.
- **Government Channel:** Signed webhook simulation stub.

## Development & Gate 0 Feasibility
All work is governed strictly by `ANTIGRAVITY_MASTER_LOOP_PROMPT.md` and `AGENTS.md`.
The first milestone (M0) executes **Gate 0** to empirically verify whether MST Blockchain supports the BN254 elliptic curve precompiles (`0x06`, `0x07`, `0x08`) required for on-chain Groth16 verification.

## Repository Setup
```bash
# Install dependencies
pnpm install

# Run Gate 0 preflight & harness validation locally
pnpm run gate0:local
```

