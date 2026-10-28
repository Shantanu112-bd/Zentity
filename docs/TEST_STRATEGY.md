# docs/TEST_STRATEGY.md — Test Strategy & Quality Assurance Plan

**STATUS: SKELETON** · **Created:** 2026-10-28

## 1. Multi-Tier Testing Pyramid
1. **Cryptographic Circuits:**
   - Unit tests on Circom templates with valid witnesses.
   - Constraint soundness: verify negative witnesses fail (under-age, modified QR, wrong RSA signature, mismatched public inputs).
   - Circomspect static analysis for unconstrained signals.
2. **Smart Contracts:**
   - Hardhat / Foundry unit tests covering standard execution, reverts, and edge cases.
   - Invariant fuzzing: nullifier uniqueness across scopes, pause mechanism, gas limits.
   - Slither static security analysis.
3. **Client SDK:**
   - Decompression bomb threshold tests.
   - Offline witness generation without network egress (monitored via proxy/mock).
4. **Backend & Relayer:**
   - OIDC flow conformance tests (state/nonce validation, PKCE checks).
   - Relayer idempotency tests under simulated RPC drops and re-orgs.
5. **Adversarial Security Matrix:**
   - Execute the 20-point adversarial checklist defined in §11 of `ANTIGRAVITY_MASTER_LOOP_PROMPT.md`.

