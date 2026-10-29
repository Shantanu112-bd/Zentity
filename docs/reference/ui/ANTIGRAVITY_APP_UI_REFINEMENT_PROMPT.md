# ANTIGRAVITY_APP_UI_REFINEMENT_PROMPT.md — give every functional page a proper, aligned layout in the new UI

Start the session with: "Read ANTIGRAVITY_APP_UI_REFINEMENT_PROMPT.md, then run step A immediately. Do not re-plan." Put this file in `docs/reference/ui/`.

## 0. Situation and rules

The new landing page is integrated and approved. The working pages under `/app/*` are cramped: content is piled in one place, sections are undefined, spacing and alignment are inconsistent. Redesign **only the layout and presentation of the functional pages** so they match the landing page's visual language and read as a deliberate product.

- **The landing page is the source of truth.** Do not edit it. Inspect its actual code and computed styles (frame padding, stage radius, Inter type scale, colours, `btn-cut` / `btn-cut-border` / `btn-cut-sm` buttons, fade-up stagger, glass treatment, spacing) and reuse its components and tokens. Do not invent a second look.
- **Functionality must not change.** No changes to contracts, circuits, backend routes, prover logic, wallet/network guards, evidence files or tests' meaning. Keep every `id`, `data-testid`, handler and API call. The existing tests, `pnpm build` and the zero-egress prover test must pass before each commit.
- Never fake states. Success appears only from real results; failures show the real error. Keep the `DEMO / SYNTHETIC`, `SIMULATION` and network (Coral/LEGACY) labels visible.
- Commit sequentially on a branch (`ui/app-layout`), no force-push.

## 1. Layout system (build once, use everywhere)

1. **Scroll model.** The landing stage is fixed-height. App pages must not be clipped: keep the nav fixed at the top of the stage and let the page body scroll inside the stage (`overflow-y:auto`, `overscroll-behavior:contain`), with no horizontal scroll at any width.
2. **Container.** Centre a content column (`max-width ≈ 1152px`, horizontal padding `px-6 md:px-10` like the nav) below the nav. Vertical rhythm on a 4/8/12/16/24/32/48 px scale only; page title block, then content, then a footer row.
3. **Page header block.** Small eyebrow (step or section, `text-white/50 text-xs tracking-[0.2em]`), page title in the heading style at a smaller scale than the landing (`text-3xl md:text-5xl`, tight tracking), one-line description (`text-white/70 text-sm max-w-xl`), and the status chips on the right on desktop / below on mobile.
4. **12-column grid.** Desktop (≥1024px): main column (7–8 cols) + side summary (4–5 cols). Tablet: single column with the summary above the main card. Mobile: single column, full-width cards and full-width primary buttons. Same gutters everywhere (`gap-6`).
5. **Card anatomy.** One shared `Card` component built on the existing glass style: header (title left, chip/action right) · optional divider · body · footer actions right-aligned. Padding `p-5 md:p-6`, radius `rounded-2xl`, border `white/20`. No card inside a card more than one level deep.
6. **Data rows.** Shared `DataList`: label (`text-white/50 text-xs uppercase tracking-wider`) over or beside value (`text-sm`), consistent column widths, middle-truncated hashes and addresses with a copy button and the full value in a tooltip/`title`. Code and JSON go in a bordered, scrollable block (`overflow-x:auto`, monospace, max-height with internal scroll).
7. **Buttons.** Primary action = white `btn-cut`; secondary = `btn-cut-border`; icon actions = `btn-cut-sm`. Exactly one primary button per card. Disabled and loading states styled consistently with a visible reason ("Connect wallet first", "Wrong network: switch to Coral").
8. **Forms and inputs.** Octagon-cut or `rounded-xl` inputs with matching border, visible labels, helper and error text under the field, focus ring that is not clipped (inset ring), min touch target 44px.
9. **Feedback.** One `StatusBanner` pattern for info/warning/error/success (colour only for real success/error), one `ProgressSteps` pattern for multi-step flows, one empty-state pattern, one skeleton/loading pattern. No raw error dumps: friendly message plus an expandable "Details" with the real error.
10. **Motion.** Reuse the fade-up stagger for header → cards (delays .1s increments, max ~.6s), honour `prefers-reduced-motion`, no continuous animation on `/app/prove`.

## 2. Page blueprints (adapt to what each page actually does; keep all existing features)

- **`/app/prove`** (the main flow). Header + `ProgressSteps` (1 Credential · 2 Proof · 3 Submit · 4 Result). Main column shows **only the current step's card** (progressive disclosure), summary column is always visible: Network (name, chain ID), Wallet (short address, connect/disconnect), Contract (short address + explorer link), Credential summary (labelled SYNTHETIC), Proof status (public inputs, truncated nullifier). Primary action sits at the bottom of the main card (Generate proof → Submit to MST). Proving shows a determinate progress indicator with Cancel; confirmed result shows tx hash (copy), block, gas used, explorer link, decoded event and a "Verify this transaction" link. Error states keep the retry path.
- **`/app/verify/:tx`** and lookup. A search card (tx hash input + Verify button) above a result card: status banner, `DataList` (hash, block, from, to, gas, event, chain ID), explorer link, and the gate indicator that opens only on a real success receipt. Failure shows the real revert reason.
- **Registry.** Info card (contract address, owner/paused status, issuer key hash, verifier address), live reads with refresh, and an events table in a scrollable container with truncated values and copy.
- **Relying Party (OIDC-lite).** Two-column layout: left, the step-by-step demo (client config, Start login, redirect result); right, claims/token viewer (pairwise `sub`, scopes) in a code block. Clear "demo-grade" note.
- **dApp Gate.** One focused card: wallet + registry read → locked/unlocked state with the reason, nullifier status, and an action to submit a proof if missing.
- **Government stub.** Prominent "SIMULATION — NOT A GOVERNMENT INTEGRATION" banner, request/response viewer, signature display.
- **Shared:** wallet menu (connect, address, network switch, disconnect), 404 and error pages in the same style, nav collapsing into a menu below `md`.

## 3. Work plan

**A. Audit (≤15 min).** Screenshot every `/app/*` page at 1440 / 768 / 375 px *before* changes (`docs/evidence/ui/app-before/`). Write `docs/evidence/ui/app-layout-audit.md`: per page, list the problems (clustering, alignment, overflow, inconsistent spacing, unclear hierarchy, clipped focus, missing states), the components used, and the blueprint it maps to.
**B. Shared primitives.** Implement §1 (`PageShell`, `PageHeader`, `Card`, `DataList`, `CodeBlock`, `StatusBanner`, `ProgressSteps`, `EmptyState`, `Field`). Show them on the dev-only `/dev/ui` page.
**C. Migrate pages in this order:** `/app/prove` → `/app/verify` → Registry → dApp Gate → Relying Party → Government stub → wallet menu/404. Commit after each (`ui(app): <page> layout`), running tests and build first.
**D. Automated layout checks.** Add a headless-browser script (Chrome CDP or Playwright if installable) that, for each page at the three widths, asserts: no horizontal scroll, no element overflowing the viewport, no overlapping interactive elements, all buttons ≥ 44px tall on mobile, no console errors. Save results to `docs/evidence/ui/layout-checks.json`.
**E. Verify.** After-screenshots in `docs/evidence/ui/app-after/` for every state listed in the blueprints (idle, wrong network, no wallet, proving, ready, confirmed, rejected). Keyboard-only run-through of `/app/prove` with visible focus. Contrast spot checks. Confirm the existing 46 tests, build, zero-egress test and a real `/app/prove` → `/app/verify/:tx` flow still work. Update CHANGELOG, VERIFICATION_AUDIT, ACTIVITY_LOG, SESSION_HANDOFF.

**Cut order if time runs short:** Government stub polish → Relying Party two-column → Registry events table. Never cut `/app/prove`, `/app/verify`, shared primitives, or the layout checks.

## 4. Final report (≤12 lines)

Pages migrated, before/after screenshot paths, layout-check results, test/build results, commits, and any remaining misalignment stated plainly.

**Begin now with step A.**

