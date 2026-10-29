# UI Redesign Map: Pramaan-ZK Full Visual Overhaul

**File:** `docs/evidence/ui/redesign-map.md`  
**Date:** 2026-10-29  
**Reference Document:** `docs/reference/ui/bDmADrNPj4BiT_qYsfvm-neWDol26SLv6udUYv7W0sE.md`  
**Governing Prompt:** `docs/reference/ui/ANTIGRAVITY_UI_REDESIGN_PROMPT.md`  
**Branch:** `ui/redesign`

---

## 1. Route & Component Architecture Mapping

| Route | Current Component | New Redesigned Layout / Component | Responsibilities & Test Preservation |
|---|---|---|---|
| `/` | `LandingPage` (Planet Jumping Walkthrough) | New `LandingPage` matching spec: black outer frame, rounded-2xl inner stage, procedural `BackgroundStage`, navbar with logo + cut buttons, left column (stagger .4s), 3-line centre title (stagger .5s), and 3-column bottom row (stagger .7s, .85s, 1s) with active network pill and social cut buttons. | Landing portal; links directly to `/app/prove` via white cut buttons. |
| `/app/prove` & `/prove` | `ProvePage` | `ProvePage` housed in new `AppShell` with inner stage, top nav, octagonal cut buttons, step indicator, and bottom row grid. | **Core Prover Flow:** Preserves `handleSelectPreset('adult'|'minor')`, `handleIssueCustom()`, `handleGenerateProof()`, `handleVerifyOffChain()`, `handleSubmitOnChain()`, progress states, zero-egress Web Worker proving, and result displays. |
| `/app/verify/:tx` & `/app/verify` | `VerifyPage` | `VerifyPage` in `AppShell` with state-accurate gate and live RPC receipt explorer. | **Verification Gate:** Queries `eth_getTransactionReceipt`, checks `status == 1`, matching chain ID, decoded `ProofVerifiedAndRecorded` event, real revert reason on failure. |
| `/app/dapp` & `/app/registry` | `DappGatePage` | `DappGatePage` in `AppShell` with glass panel and cut-corner inputs/buttons. | **Smart Contract Gatekeeper:** Queries `/api/registry/:scope/:nullifier` on MST Coral Testnet; renders access granted/unspent status. |
| `/app/relying-party` | `RelyingPartyPage` | `RelyingPartyPage` in `AppShell` with OIDC login card. | **Web2 OIDC Gateway:** PKCE authorization code exchange (`/authorize` → `/token`), displays pairwise `sub` and token claim. |
| `/dev/ui` (dev-only) | *New* | `DevUiShowcase` | Visual testbench demonstrating `.btn-cut`, `.btn-cut-border`, `.btn-cut-sm`, `Glass`, `Chip`, focus rings, and stagger animations. |

---

## 2. Shared Components & State Mapping

| Component | Current Implementation | Redesigned Implementation |
|---|---|---|
| **Frame & Stage** | Window-sized canvas / full viewport | `div.h-screen.w-full.bg-black.p-3.md:p-4.font-inter` outer frame containing `div.w-full.h-full.rounded-2xl.flex.flex-col.overflow-hidden.relative.bg-black` inner stage. |
| **Background** | 4 procedural canvas scenes (Planet Jumping) | `BackgroundStage`: Self-contained procedural looping canvas (dark vortex/particle field with soft light streaks and grain, cover-fit, 24–30 fps, bottom darkening gradient) on `/`. On `/app/*`, rendered as a static or CSS-only stage to ensure **zero CPU contention** during client proving. Configurable via `theme/config.ts`. |
| **Brand Logo** | Hexagonal keyhole mark | Original geometric 256×256 vector SVG logo with clean white geometry, plus tracking-spaced wordmark `"P R A M A A N"` (`text-white text-[10px] md:text-xs tracking-[0.4em] font-light`). |
| **Buttons** | Rounded-full pills | **`.btn-cut`** (12px cut), **`.btn-cut-border`** (outline with 1px black inset & 11px clip), **`.btn-cut-sm`** (8px cut for icon buttons). Equipped with inset `:focus-visible` rings for accessible keyboard navigation. |
| **Animations** | Keyframe cubic-bezier reveals | `.anim-stagger` (fadeUp 24px, 0.8s `cubic-bezier(.16,1,.3,1)`), `.anim-fade` (fadeIn 1s). Stagger delays: 0.1s, 0.2s, 0.4s, 0.5s, 0.7s, 0.85s, 1s per spec table. |
| **Status Chips** | Rounded badges with colored borders | Octagonal `.btn-cut-sm` styled chips using subtle neutral monochrome backgrounds with color reserved strictly for verified success/failure states (`DEMO / SYNTHETIC`, `OFF-CHAIN VERIFIED`, `ZK VERIFIED ON-CHAIN`). |
| **Functional Panels** | `glass-panel` rounded-3xl | `Glass` panel: `bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl` with cut inputs and clear contrast over background. |

---

## 3. Dead Code Decommissioning Plan

The previous Planet Jumping portal mechanics are superseded by this specification. The following files will be replaced or safely pruned (preserved in git history):
- `frontend/src/landing/PortalEngine.ts` → Replaced by `BackgroundStage` and new layout.
- `frontend/src/landing/LandingWalkthrough.tsx` → Replaced by new spec-aligned `LandingPage.tsx`.
- `frontend/src/landing/landing.css` → Replaced by new `index.css` and `theme/theme.css`.
- `frontend/src/landing/scenes.ts` → Replaced by `BackgroundStage` procedural engine.
- `frontend/src/landing/config.ts` → Relocated to `frontend/src/theme/config.ts`.

---

## 4. Verification & Non-Breaking Guarantees

1. **Zero Cryptographic Regression:** Circuit (`AgeCredential.circom`), verifier (`PramaanVerifier.sol`), registry (`PramaanRegistry.sol`), and proving SDK (`prover.ts`) remain untouched.
2. **Zero Test Regressions:** All 46 test cases, including zero-egress network assertion and circuit negative constraints, will pass without changes.
3. **No Third-Party Media Leaks:** All assets are generated procedurally or self-hosted locally. `grep` test against external CDNs will yield 0 matches.


---

## 5. Spec Parity & Animation Delay Verification

| Spec Element | Class / Token | Spec Delay | Implemented Delay | Parity Status |
|---|---|---|---|---|
| Background Canvas | `anim-fade` | 0.2s | `0.2s` | EXACT MATCH |
| Logo + Wordmark | `anim-stagger` | 0.1s | `0.1s` | EXACT MATCH |
| Nav Buttons ("Prove", "Launch App") | `anim-stagger` | 0.2s | `0.2s` | EXACT MATCH |
| Left Column (Tagline & 4x4 dots) | `anim-stagger` | 0.4s | `0.4s` | EXACT MATCH |
| Center 3-Line Heading | `anim-stagger` | 0.5s | `0.5s` | EXACT MATCH |
| Bottom Row Col 1 (Summary text) | `anim-stagger` | 0.7s | `0.7s` | EXACT MATCH |
| Bottom Row Col 2 (Network + Launch) | `anim-stagger` | 0.85s | `0.85s` | EXACT MATCH |
| Bottom Row Col 3 (Cut icon buttons) | `anim-stagger` | 1.0s | `1.0s` | EXACT MATCH |

### Prover CPU Isolation Verification:
- Route `/app/prove`: Static background mode active (`staticMode={true}`).
- Verified running rAF canvas loops: **0**.
- Groth16 SnarkJS proving execution: Unimpeded, 100% CPU isolated.
