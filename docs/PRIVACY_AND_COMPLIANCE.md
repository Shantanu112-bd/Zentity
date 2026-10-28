# docs/PRIVACY_AND_COMPLIANCE.md — Privacy Inventory & Compliance Architecture

**STATUS: SKELETON** · **Created:** 2026-10-28

## 1. Data Inventory & Flow Matrix

| Data Item | Origin | Client Handling | Relayer Visibility | Gateway Visibility | On-Chain Visibility |
|---|---|---|---|---|---|
| Raw QR Bytes | Scanned by User | Memory only; parsed in Web Worker | Never transmitted | Never transmitted | Never transmitted |
| Aadhaar / Reference Number | Decoded QR | Never extracted to public signals | None | None | None |
| Full Date of Birth | Decoded QR | Private witness signal in Circom | None | None | None |
| Calculated Age | Witness derivation | Enforced as inequality ($age \ge 18$) | Proof only | Claim `age_over_18: true` | Proof only |
| User Name & Address | Decoded QR | Never passed to circuit | None | None | None |
| Photo Bytes | Decoded QR | Hashed for credentialBoundSecret | None | None | None |
| Derived Nullifier | Circuit output | Emitted in public signals | Visible | Visible | Recorded in Registry |
| Recipient Address | User intent | Emitted in public signals | Visible | Visible | Recorded in calldata |
| Scope ID | Application domain | Emitted in public signals | Visible | Visible | Recorded in calldata |

## 2. Privacy Guarantees
1. **Zero Knowledge:** Neither the relayer, the validator nodes on MST, nor the relying parties ever see the underlying identity credentials, DOB, or Aadhaar number.
2. **Unlinkability:** Nullifiers generated for Scope A cannot be mathematically linked to nullifiers generated for Scope B.
3. **Data Minimization:** Only discrete binary attributes (`age >= 18`) are revealed.
4. **ZK $\neq$ Anonymity:** Network metadata (IP addresses, transaction timestamps, wallet addresses) remains observable unless auxiliary network protections are utilized.

## 3. Regulatory Posture (India DPDP Act & UIDAI Regulations)
- The system operates on offline cryptographic verification without calling UIDAI central servers.
- No central repository of PII is maintained by Pramaan-ZK backend or smart contracts.
- Final production compliance requires formal review by qualified legal counsel (Tracked in B-06).

