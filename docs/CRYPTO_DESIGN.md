# docs/CRYPTO_DESIGN.md — Cryptographic Design & Proof Specifications

**STATUS: SKELETON** · **Created:** 2026-10-28

## 1. Zero-Knowledge Proof Scheme
- **Proving System:** Groth16 zk-SNARK
- **Elliptic Curve:** BN254 (alt_bn128)
- **Constraint System:** Rank-1 Constraint System (R1CS) compiled via Circom 2.1.x
- **Setup:** Public Powers of Tau (Hermez ceremony) + Phase-2 circuit ceremony (Dev-only for testing, production ceremony before release).

## 2. Predicate Statements
The circuit proves that:
1. The credential payload is digitally signed by a valid, non-revoked issuer RSA public key (`issuerKeyHash`).
2. The credential holder's birth date indicates an age $\ge 18$ years relative to current timestamp/epoch.
3. (Optional) The credential holder's state code matches the target state code.
4. The nullifier is correctly computed as `Poseidon(credentialBoundSecret, scopeId)`.
5. The public inputs bind:
   - `scopeId`
   - `chainId`
   - `registryAddress`
   - `recipientAddress`
   - `actionNonce`
   - `deadline`

## 3. Signals Definition

### Public Inputs & Outputs
| Signal Name | Type | Description |
|---|---|---|
| `nullifier` | Output | Derived nullifier for Sybil prevention |
| `scopeId` | Input | Context / application domain ID |
| `chainId` | Input | Target blockchain chain ID (MST) |
| `registryAddress` | Input | Target on-chain registry contract address |
| `recipientAddress` | Input | Authorized recipient address |
| `actionNonce` | Input | Action or session replay protection nonce |
| `deadline` | Input | Expiration timestamp |
| `issuerKeyHash` | Input | Hash of issuer RSA public key modulus |

### Private Signals (Confidential Witness)
| Signal Name | Description |
|---|---|
| `qrPayload` | Decompressed raw signed QR bytes |
| `signature` | RSA-2048 issuer digital signature |
| `issuerPublicKey` | Full RSA-2048 public key modulus |
| `dob` | Date of birth extracted from payload |
| `stateCode` | State code extracted from payload |
| `credentialBoundSecret` | Stable secret derived from signed payload (e.g. photo bytes hash) |

## 4. Nullifier Construction Analysis (Decision D-04)
- **Formula:** `Poseidon(credentialBoundSecret, scopeId)`
- **Properties:**
  - *Scope Isolation:* An observer cannot correlate nullifiers across distinct `scopeId`s.
  - *Determinism within Scope:* Multiple proofs generated from the same credential for the same `scopeId` yield identical nullifiers.
  - *No User-Provided Secret:* Derivation relies solely on signed payload contents to prevent users from resetting their nullifier at will.

