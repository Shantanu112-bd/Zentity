# docs/CRYPTO_DESIGN.md — Cryptographic Design & Proof Specifications

> [!WARNING]
> **UNREVIEWED PRIMITIVE NOTICE (MVP DEMO):** The cryptographic constructions defined herein (specifically the nullifier derivation formula and EdDSA-Poseidon credential container) are designed for an MVP functional prototype. They have **NOT** undergone formal cryptanalytic audit.
> All screens, contracts, APIs, and client interfaces state:
> *"Synthetic credential. Real Aadhaar QR support is future work (milestone M2)."*

---

## 1. Zero-Knowledge Proof Scheme
- **Proving System:** Groth16 zk-SNARK
- **Elliptic Curve:** BN254 (`alt_bn128`), verified compatible with MST EVM precompiles (`0x06`, `0x07`, `0x08`)
- **Embedded Curve:** BabyJubjub (twisted Edwards curve over BN254 scalar field $\mathbb{F}_r$)
- **Signature Primitive:** EdDSA-Poseidon over BabyJubjub via `circomlib`
- **Hash Primitive:** Poseidon hash over $\mathbb{F}_r$
- **Setup:** Dev-only Powers of Tau + circuit phase-2 ceremony (DEV-ONLY)

---

## 2. Predicate Statements & Scope
The MVP circuit proves that:
1. The credential payload is digitally signed by a registered issuer key (`issuerPubKeyHash`).
2. The credential holder's birth date indicates an age $\ge 18$ years relative to public `currentDateDays` and `thresholdAgeDays`.
3. The nullifier is derived as `Poseidon(credentialSecret, scopeId)`.
4. The proof is cryptographically bound to public signals:
   - `issuerPubKeyHash`
   - `scopeId`
   - `nullifier`
   - `recipient` (intended Ethereum recipient address)
   - `chainId` (MST testnet `91562037` or local `31337`)
   - `currentDateDays`
   - `thresholdAgeDays`

---

## 3. Signals Definition

### Public Inputs
| Signal Name | Description |
|---|---|
| `issuerPubKeyHash` | $\text{Poseidon}(A_x, A_y)$ of issuer BabyJubjub key |
| `currentDateDays` | Public reference date (epoch days since 1970-01-01) |
| `thresholdAgeDays` | Age threshold in days ($18 \times 365.25 \approx 6575$) |
| `scopeId` | Application / context identifier for pairwise pseudonymity |
| `nullifier` | Output $\text{Poseidon}(credentialSecret, scopeId)$ |
| `recipient` | Target receiver/relayer address |
| `chainId` | Target blockchain chain ID (prevent cross-chain replay) |

### Private Signals (Confidential Witness)
| Signal Name | Description |
|---|---|
| `dobDays` | Credential holder's birth date in epoch days |
| `stateCode` | Numeric state code (e.g., 27 for Maharashtra) |
| `credentialSecret` | 253-bit random scalar issued by DEMO ISSUER |
| `issuerPubKeyAx` | Issuer BabyJubjub public key X coordinate |
| `issuerPubKeyAy` | Issuer BabyJubjub public key Y coordinate |
| `sigR8x` | EdDSA signature $R$ point X coordinate |
| `sigR8y` | EdDSA signature $R$ point Y coordinate |
| `sigS` | EdDSA signature $S$ scalar |

---

## 4. Nullifier Construction (Decision D-04)
- **Formula:** `nullifier = Poseidon(credentialSecret, scopeId)`
- **Properties:**
  - *Scope Isolation:* An observer cannot correlate nullifiers across distinct `scopeId`s.
  - *Determinism within Scope:* Multiple proofs generated from the same credential for the same `scopeId` yield identical nullifiers.
  - *No User-Provided Secret:* Derivation relies solely on signed payload contents (`credentialSecret`) to prevent users from resetting their nullifier at will.
- **Residual Risk:** Unreviewed primitive. Formal security proofs of unforgeability and unlinkability across multi-issuer contexts deferred to M2.
