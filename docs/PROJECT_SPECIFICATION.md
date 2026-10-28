# docs/PROJECT_SPECIFICATION.md — Pramaan-ZK Functional & Technical Specification

**STATUS: SKELETON** · **Created:** 2026-10-28

## 1. System Vision
Pramaan-ZK enables end-users to prove discrete identity attributes (such as age ≥ 18 and state of residence) derived from tamper-evident, cryptographically signed government credentials (e.g. offline QR payloads) directly on their client devices using zero-knowledge proofs.

The verified proofs can be consumed across:
- **Web3 Ecosystems:** MST Blockchain contracts verifying attributes without exposing the user's name, full birthdate, photo, or Aadhaar number.
- **Web2 Enterprise Applications:** OpenID Connect (OIDC) identity provider issuing pairwise pseudonymous subject tokens (`sub`) and attribute claims.
- **Government / DPI Systems:** Standardized signed webhook notifications (simulation stub in MVP).

## 2. Core Functional Requirements
1. **Offline Credential Ingestion:** Parse standard signed QR bytes, verify decompression limits, validate signature against trusted public key.
2. **Selective Attribute Proving:** Prove mathematical inequalities (e.g., current_epoch - dob_epoch ≥ 18 years) in ZK without revealing DOB.
3. **Sybil Resistance via Scoped Nullifiers:** Derive deterministic nullifiers tied to credential secret and scope ID (`Poseidon(credentialSecret, scopeId)`) preventing double-claiming while preventing cross-app linkage.
4. **Relayer-Safe Transaction Binding:** Circuit public inputs must bind `scopeId`, `chainId`, `registryAddress`, `recipientAddress`, `actionNonce`, and `deadline` to prevent front-running and replay.
5. **On-Chain Registry & Key Governance:** Registry contract tracking nullifiers, valid issuer public keys, revocation status, and emergency pause controls.

## 3. Non-Functional Requirements
1. Proving execution time target: ≤ 5 seconds on modern mobile devices (to be benchmarked in M2).
2. Prover peak memory: ≤ 1.5 GB RAM.
3. Zero network egress during witness computation and proving phases.
4. EVM gas cost for Groth16 verification: ≤ 300,000 gas on MST.

