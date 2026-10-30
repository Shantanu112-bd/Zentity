# docs/evidence/reset/inventory.md — Frontend File Inventory & Classification

**Audit Timestamp:** 2026-10-30T15:00:00Z  
**Branch:** `reset/ui-and-onchain`  
**Git Tag:** `pre-ui-reset` (commit `6ed9299`)  
**Standard:** Phase 0 of `docs/reference/ui/ANTIGRAVITY_UI_RESET_AND_ONCHAIN_PROMPT.md`

---

## 1. File Classification Matrix

| File Path | Classification | Role & Contents | Tests Touching / Dependent |
|---|---|---|---|
| `packages/client/src/prover.ts` | **LOGIC** | Groth16 SnarkJS client proving wrapper, witness computation, zero-egress input isolation, progress callbacks | `tests/client-zero-egress.test.ts` (3 tests) |
| `frontend/src/context/WalletContext.tsx` | **LOGIC** | Viem public/wallet client, chain switcher, EIP-191 SIWE challenge signing, `verifyAndRecord` transaction submission, receipt & event decoding | `tests/pramaan-registry.test.ts`, `tests/wallet-auth.test.ts` |
| `frontend/src/polyfills.ts` | **LOGIC** | Node Buffer & global polyfill setup for browser execution | Build & runtime imports |
| `frontend/public/circuits/age_credential.wasm` | **LOGIC / ARTIFACT** | Compiled Circom 2.1.8 WebAssembly witness calculator (5,014 constraints) | `tests/circuit-age-credential.test.ts`, `tests/client-zero-egress.test.ts` |
| `frontend/public/circuits/age_credential_final.zkey` | **LOGIC / ARTIFACT** | Groth16 proving key (BN254 curve, DEV-ONLY PoT 13 ceremony) | `tests/circuit-age-credential.test.ts`, `tests/client-zero-egress.test.ts` |
| `frontend/public/circuits/verification_key.json` | **LOGIC / ARTIFACT** | Exported JSON verification key for off-chain and test verification | `tests/server.test.ts`, `tests/circuit-age-credential.test.ts` |
| `frontend/public/circuits/hashes.json` | **LOGIC / ARTIFACT** | SHA-256 integrity checksums for circuit artifacts | Prover integrity verification |
| `frontend/src/pages/ProvePage.tsx` | **PRESENTATION (with embedded LOGIC)** | UI for age proof generation. Embedded state machine (idle/issuing/ready/proving/submitting/confirmed/rejected) and API client calls | To extract into `core/useProver.ts`, `core/useSubmitProof.ts` |
| `frontend/src/pages/VerifyPage.tsx` | **PRESENTATION (with embedded LOGIC)** | UI for verifying transaction hashes. Embedded logic for receipt lookup and event decoding | To extract into `core/useTxResult.ts` |
| `frontend/src/pages/DappGatePage.tsx` | **PRESENTATION (with embedded LOGIC)** | UI for registry lookup. Embedded logic for `isNullifierSpent` and `registeredIssuers` | To extract into `core/useRegistry.ts` |
| `frontend/src/pages/RelyingPartyPage.tsx` | **PRESENTATION (with embedded LOGIC)** | Storefront gate UI. Embedded logic for OIDC-Lite authorization & token exchange | To extract into `core/useIssuer.ts` |
| `frontend/src/pages/SimulationPage.tsx` | **PRESENTATION (with embedded LOGIC)** | UI for webhook simulation | To convert in Phase 2 to signed webhook service |
| `frontend/src/pages/LandingPage.tsx` | **PRESENTATION** | Marketing hero section, cards, and animations | Safe to remove / replace with unstyled shell |
| `frontend/src/pages/NotFoundPage.tsx` | **PRESENTATION** | 404 page layout | Safe to replace with unstyled shell |
| `frontend/src/components/layout/*` (10 files) | **PRESENTATION** | `PageShell`, `PageHeader`, `Card`, `DataList`, `CodeBlock`, `StatusBanner`, `ProgressSteps`, `EmptyState`, `Field`, `index.ts` | UI primitives to be replaced in Phase 3 |
| `frontend/src/components/ProofGateCanvas.tsx` | **PRESENTATION** | 2D procedural HTML5 canvas animation | Safe to delete |
| `frontend/src/components/AppShell.tsx`, `Navbar.tsx`, `Footer.tsx`, `StatusChip.tsx`, `WalletConnect.tsx` | **PRESENTATION** | Older UI layout wrappers | Safe to delete |
| `frontend/src/theme/*` (15 files) | **PRESENTATION** | `BackgroundStage.tsx`, `DevUiShowcase.tsx`, `theme.css`, `apogee/*`, `components/*` | Safe to delete |
| `frontend/src/index.css` | **PRESENTATION** | CSS resets, styling, animations | Safe to replace with minimal shell styles |
| `frontend/public/brand/logo.svg` | **PRESENTATION** | SVG brand asset | Safe to delete / replace |
| `frontend/public/fonts/*` (4 files) | **PRESENTATION** | Inter and Anton TTF font files | Safe to replace with reference fonts in Phase 3 |
| `frontend/public/media/nebula.mp4` | **PRESENTATION** | Video background file | Safe to delete |
| `frontend/src/App.tsx`, `frontend/src/main.tsx`, `frontend/index.html` | **ENTRY** | Application root, route table, DOM mount | To replace with plain `<pre>` status and core route table |

---

## 2. Test Suite Baseline (Phase 0)
- **Suite Command:** `pnpm test` (`hardhat test tests/*.test.ts`)
- **Total Passing Tests:** 46 passing in 18s
- **Zero-Egress Assertion:** `tests/client-zero-egress.test.ts` (3/3 passing) confirms no PII leaves client during proof generation.
- **Frontend Build Baseline:** `pnpm run build:frontend` succeeds in 1.48s.
- **Git Checkpoint:** Tag `pre-ui-reset` pushed to `origin`.

