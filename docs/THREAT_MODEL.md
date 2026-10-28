# docs/THREAT_MODEL.md — Security & Threat Modeling

**STATUS: SKELETON** · **Created:** 2026-10-28

## 1. Adversary Model & Assumptions
- **Adversary Capabilities:**
  - Control over client environment (compromised browser, malicious JS runtime, altered SDK).
  - Network observer (eavesdropping on network traffic, passive metadata correlation).
  - Malicious relayers / front-running actors on public mempool.
  - Malicious relying parties (attempting cross-site correlation or replay attacks).
- **Security Boundaries:**
  - In-circuit mathematical verification cannot be bypassed if R1CS constraints are complete and sound.
  - Smart contracts on MST Blockchain enforce public input checks and nullifier uniqueness.
  - The issuer private key is secure and uncompromised.

## 2. Identified Threats & Mitigations

| Threat ID | Threat Vector | Impact | Mitigation Strategy |
|---|---|---|---|
| T-01 | Replay attack across sessions / scopes | Double-claiming or credential reuse | Public input binding (`scopeId`, `actionNonce`, `deadline`) and on-chain nullifier tracking |
| T-02 | Front-running on public mempool | Malicious actor steals proof and claims benefit | Public input binding to `recipientAddress`; contract asserts `recipient == expected` |
| T-03 | Cross-chain replay | Proof mined on another EVM network re-submitted to MST | Public input binding to `chainId` |
| T-04 | Stolen or photocopied QR payload | Unauthorized individual proves valid age | Residual risk acknowledged; system proves credential validity, not biometric liveness |
| T-05 | Client-side memory snooping | PII extracted from browser heap | Witness generated and cleared in dedicated worker; zero network transmission |
| T-06 | Decompression bomb (QR payload) | Denial of Service via memory exhaustion | Strict decompression size and byte-limit thresholds before parsing |
| T-07 | Relayer denial-of-service / gas drain | Attacker floods relayer with invalid proofs | Relayer validates proof off-chain via snarkjs before paying on-chain gas |
| T-08 | Compromised or rotated issuer key | Forged credentials or revocation bypass | Registry contract maintains active and revoked issuer key hashes with timelocks |

