# docs/evidence/ui/app-layout-audit.md — Baseline UI Layout Audit

**Date:** 2026-10-30  
**Governing Prompt:** `docs/reference/ui/ANTIGRAVITY_APP_UI_REFINEMENT_PROMPT.md`  
**Branch:** `ui/app-layout`  
**Baseline Screenshots:** `docs/evidence/ui/app-before/` (1440px, 768px, 375px)

---

## 1. Executive Summary of Layout Gaps

Across all functional pages under `/app/*`, the baseline implementation suffers from:
1. **Lack of Progressive Disclosure:** On `/app/prove`, steps 1, 2, and 3 are displayed in a continuous vertical column simultaneously, overwhelming the user and creating excessive vertical scroll.
2. **Missing 12-Column Responsive Split:** Pages are rendered as centered single-column blocks rather than utilizing a 7–8 col main action + 4–5 col sticky summary grid on desktop (≥1024px).
3. **Inconsistent Vertical Rhythm:** Gutters and margins vary arbitrarily (p-4 vs p-6 vs p-8) rather than sticking to the strict 4/8/12/16/24/32/48 px vertical rhythm.
4. **Clipped Focus Outlines:** Clip-path buttons can clip default browser focus rings; inset box shadows must be systematically applied.
5. **Card Inconsistencies:** Multiple ad-hoc card wrappers with differing border opacities and radius values rather than a unified `Card` primitive.
6. **Raw Error Displays:** Errors are rendered as raw strings in generic red boxes rather than using a structured `StatusBanner` with friendly titles and expandable details.

---

## 2. Per-Page Audit Matrix

| Route | Current Implementation & Deficiencies | Target Blueprint & Improvements |
|---|---|---|
| **`/app/prove`** | • Single-column vertical stack.<br>• Choose Credential, Bind Context, and Submit cards are piled together.<br>• Public inputs and nullifiers take up inline space instead of living in a clean side summary.<br>• Buttons lack uniform hierarchy. | • 12-col grid (8 cols main, 4 cols summary).<br>• `ProgressSteps` (1 Credential · 2 Proof · 3 Submit · 4 Result).<br>• Progressive disclosure: main column shows **only the active step's card**.<br>• Right summary column: Network, Wallet, Registry contract, Credential summary, Proof status.<br>• Single primary `btn-cut` action per step.<br>• Determinate progress bar with cancel during proving.<br>• Rich receipt card on confirmation. |
| **`/app/verify/:tx`** & Lookup | • Central canvas with excessive blank space.<br>• Tx hash input field is missing from the main route unless entered via URL.<br>• Receipt breakdown lacks clear key-value alignment. | • 2-card stacked layout (Search Card above Result Card).<br>• Input with `btn-cut` "Verify Receipt".<br>• Structured `DataList` (hash, block, gas, from, to, chain ID, explorer link).<br>• State-accurate gate indicator opening only on `status == 1`.<br>• Real revert reason on failure. |
| **`/app/dapp`** (Registry Gate) | • Basic stacked card with scope and nullifier inputs.<br>• No contract state summary (paused, owner, verifier).<br>• Unclear visual distinction between spent and unspent states. | • 12-col grid (7 cols query, 5 cols contract status).<br>• Left card: Nullifier search and Sybil protection check.<br>• Right card: Registry info (contract address, verifier address, pause state, explorer links).<br>• `StatusBanner` feedback for ACCESS GRANTED vs NULLIFIER UNSPENT. |
| **`/app/relying-party`** (OIDC-lite) | • Single card attempting to show login, explanation, and JWT output.<br>• Cluttered token payload display. | • 2-col side-by-side layout (7 cols demo flow, 5 cols token viewer).<br>• Left card: step-by-step OIDC login flow with clear "Demo-grade gateway" notice.<br>• Right card: scrollable `CodeBlock` displaying pairwise `sub`, claims, and decoded token. |
| **`/app/simulation`** (Gov Stub) | • Lacks dedicated visual shell.<br>• Requires clear simulation framing. | • Full-width card with prominent "SIMULATION — NOT A GOVERNMENT INTEGRATION" banner.<br>• Request/response payload viewer and signature display. |
| **Shared Shell & 404** | • Nav collapses but lacks rich mobile wallet menu.<br>• Fixed height clipped on small screens if content exceeds bounds. | • Stage body scrolls cleanly inside fixed frame (`overflow-y:auto`, `overscroll-behavior:contain`, 0 horizontal scroll).<br>• Unified mobile drawer.<br>• Matching 404 and Error pages. |

---

## 3. Component Inventory to Implement in Step B

1. `PageShell`: Fixed top nav inside stage, scrollable inner container with max-w ~1152px, horizontal padding `px-6 md:px-10`.
2. `PageHeader`: Small eyebrow (`text-white/50 text-xs tracking-[0.2em]`), page title (`text-3xl md:text-5xl`), description (`text-white/70 text-sm max-w-xl`), and status chips right-aligned.
3. `Card`: Standardized glass card (`bg-white/[0.07] backdrop-blur-xl border border-white/20 rounded-2xl p-5 md:p-6`), header, body, footer.
4. `DataList`: Label-value rows with middle-truncated addresses/hashes, copy-to-clipboard button, and full tooltip.
5. `CodeBlock`: Bordered, scrollable monospace JSON/code display with copy button and max height.
6. `StatusBanner`: Semantic feedback banner (info, warning, error, success) with optional expandable details.
7. `ProgressSteps`: 4-step progressive disclosure indicator.
8. `EmptyState`: Clean placeholder for uninitialized states.
9. `Field` / `Input`: Octagonal or rounded-xl inputs with visible label, helper text, error message, and inset focus ring.
