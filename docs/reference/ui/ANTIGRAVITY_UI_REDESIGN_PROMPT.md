# ANTIGRAVITY_UI_REDESIGN_PROMPT.md — redesign the entire Pramaan-ZK UI to match the new reference

Place this file and the reference spec (`bDmADrNPj4BiT_qYsfvm-neWDol26SLv6udUYv7W0sE.md`) in `docs/reference/ui/`. Start the session with:
"Read docs/reference/ui/ANTIGRAVITY_UI_REDESIGN_PROMPT.md and the spec beside it, then run §3 step A immediately. Do not re-plan."

**This supersedes** `UI_ADDENDUM_PRAMAAN.md` and `ANTIGRAVITY_UI_ALIGNMENT_PROMPT.md` (the Planet Jumping portal design). The honesty, security and evidence rules of `ANTIGRAVITY_MASTER_BUILD_PROMPT.md` still apply.

## 0. Goal and the one hard constraint

Redesign the **complete** frontend, landing and every app page, so it looks and animates like the reference: full-screen black frame with a rounded inner stage, looping background, octagonal "cut-corner" buttons, Inter typography with tight tracking, staggered fade-up entrances, the same layout grid and responsive behaviour. All Pramaan-ZK functionality goes inside this UI.

**Functionality must not change.** Do not modify contracts, circuits, backend routes, prover logic, wallet/network guards, evidence files or their semantics. Keep every `id`, `data-testid`, handler and API call the tests rely on. All 46 tests, `pnpm build` and the zero-egress prover test must still pass after each step. This is a presentation-layer rewrite: move and restyle, don't reimplement.

## 1. Asset and brand policy

- The reference's name, text, logo, and CloudFront video belong to another brand. **Do not** use "VortxLab", "V O R T X", its copy, its logo shape, or hotlink its video (`d8j0ntlcm91z4.cloudfront.net/...`). Hotlinked third-party media can disappear or be taken down mid-demo.
- Match everything else exactly: structure, spacing, classes' computed values, clip-paths, easing, delays, breakpoints, colours, type scale.
- **Background:** default is an original, procedural, looping scene drawn on a canvas (dark, slow, cinematic; e.g. drifting vortex/particle field with soft light streaks and grain, 24–30 fps cap, cover-fit, with a bottom darkening gradient for text contrast). Implement behind a `BackgroundStage` component exposing the same interface as a `<video>` (so a local video can be dropped in). If the human holds rights to a video, they place it at `frontend/public/media/background.mp4` and set `background.source = "video"` in `frontend/src/theme/config.ts`. Never hotlink.
- **Brand:** wordmark spaced as "P R A M A A N" under an original SVG logo (new geometric mark, white fill, 256×256 viewBox, drawn by you; do not copy the reference's four-quarter-circle vortex). Save to `frontend/public/brand/logo.svg`.
- **Icons:** `lucide-react` only for `ArrowRight` and similar; social/brand icons only for services we actually link to (GitHub, explorer), as inline SVG.

## 2. Design system to implement (from the spec)

Tokens: page `#000`, text white with `/80 /70 /50` opacities, font **Inter** 300–900 (Google Fonts link with preconnect, fallback `'Inter', sans-serif`), outer frame padding `p-3 md:p-4`, inner stage `rounded-2xl overflow-hidden relative bg-black`, headings `font-normal leading-[1.1] tracking-[-0.04em]` with `textShadow: 0 2px 12px rgba(0,0,0,.25)`.

Utilities (implement as global CSS exactly, Tailwind optional):
- `.btn-cut` 12px octagon `clip-path` (white fill, black text), `.btn-cut-border` outline variant (white fill + `::before` inset 1px black with 11px clip, children `z-index:1`), `.btn-cut-sm` 8px octagon.
- `fadeUp` (24px, `.8s cubic-bezier(.16,1,.3,1)`) as `.anim-stagger`; `fadeIn` (`1s`) as `.anim-fade`; each element gets an inline `animationDelay` per the spec's table pattern.
- Tailwind is **allowed** if it installs cleanly (pin v3.4.x, `fontFamily.inter` as in the spec); otherwise reproduce the same computed values with plain CSS. Do not let a CSS reset break wallet/status components: audit each page after enabling it.

**Accessibility fix the spec lacks:** `clip-path` clips the native focus outline. For every cut button, implement a visible `:focus-visible` indicator that survives clipping (inner `box-shadow: inset 0 0 0 2px #000, inset 0 0 0 4px #fff` on white buttons; inner white ring on outline buttons). Honour `prefers-reduced-motion` (no stagger/fade/canvas motion, content visible immediately). Keep text/background contrast AA; raise the bottom gradient or panel opacity where small text sits over the stage.

## 3. Work plan (branch `ui/redesign`; commit after each step; run `pnpm test` and `pnpm build` before each commit)

**A. Analyze the existing UI (≤20 min).** Write `docs/evidence/ui/redesign-map.md`: list every route, page component, shared component (WalletConnect, StatusChip, network chip, proof progress, result cards, forms), its current responsibilities, state/props/handlers/test ids, and how it will map into the new shell. Note dead code from the Planet Jumping landing (`PortalEngine`, `LandingWalkthrough`, `landing.css`, scenes) and decide: delete if unused (git history keeps it).

**B. Build the design system.** `frontend/src/theme/` (tokens, global CSS, `BackgroundStage`, `CutButton` / `CutButtonOutline` / `CutIconButton`, `Glass` panel, `Chip`, `Field`/`Input` in octagon style, `Stagger` helper, `AppShell`). Add a `/dev/ui` route (dev-only) showing every primitive for visual QA; remove or hide it in production builds.

**C. Landing page (`/`)** matches the spec's layout exactly with Pramaan content:
- Navbar: logo block (stagger .1s) left; right buttons (stagger .2s): **"Prove"** (`btn-cut-border`, hidden < md) and **"Launch App"** (white `btn-cut`, hidden < md).
- Left column (hidden < lg, stagger .4s): "Prove what matters,<br>reveal nothing<br>else" with the two small circles and "Privacy<br>by Proof" + "01".
- Centre h1 (stagger .5s), three lines: `Prove Your Age` / `Reveal Nothing Else` / `Pramaan-ZK`.
- Bottom row (grid 1 → 3 cols at md): col 1 (.7s) "Zero-knowledge proofs of an age ≥ 18 attribute, verified on MST Blockchain. Demo uses synthetic credentials."; col 2 (.85s) label with the **live** active network name + chain ID from config (e.g. "MST Coral Testnet · 54635", or "LEGACY" if fallback), and a white **"Launch App"** button with `ArrowRight` → `/app/prove`; col 3 (1s) three small icon buttons linking to the GitHub repo, the deployed registry on the explorer (only if an address exists in deployment evidence), and the docs/README.
- A small `DEMO / SYNTHETIC` chip is always visible. No text may imply real identity verification, government approval or a verified person.

**D. App shell and pages (`/app/*`).** Same frame, stage and entrance animations as the landing:
- Nav (logo left; right: octagon buttons for Prove, Verify, Registry, Relying Party, dApp Gate, collapsing into a menu < md) plus the **wallet button** (white `btn-cut` showing Connect or short address) and a network chip (Coral/LEGACY + chain ID).
- Heading per page in the spec's scale (`PROVE`, `VERIFY`, …) and the spec's bottom-row grid: col 1 plain-language helper text, col 2 the page's **primary action** (Generate proof / Submit to MST / Look up tx) in a white cut button, col 3 secondary icon links (explorer, copy address).
- The working content (credential selection, progress, proof summary, tx result, registry data, OIDC demo, government **SIMULATION** stub) sits in `Glass` panels (`bg-white/10`, `backdrop-blur`, `border border-white/20`, `rounded-2xl`) with cut-corner buttons, inputs and chips. Preserve each flow's states: idle, proving (progress + cancel), verifying, submitting, confirmed, rejected, unsupported, wrong network, no wallet.
- Status chips (`DEMO / SYNTHETIC`, `LOCAL VERIFIED`, `OFF-CHAIN VERIFIED`, `TESTNET TX CONFIRMED`, `ZK VERIFIED ON-CHAIN`) restyled in the octagon language, driven by real state only. The result page (`/app/verify/:tx`) shows success only from a real receipt (`status == 1`, matching chain ID, decoded event) and always shows the real revert reason on failure.
- Performance: continuous canvas animation only on `/`. On `/app/*` (especially `/app/prove`) use a static or CSS-only stage so proving is never slowed; stop all rAF loops when hidden or unmounted.

**E. Route and flow checks.** Landing "Launch App" and nav lead to `/app/prove`. Deep links (`/app/verify/:tx`) work on refresh. Wrong-network and no-wallet states are handled in the new UI. 404 page in the same style.

**F. Verify and document.**
- Screenshots at 1440 / 768 / 375 px: landing, `/app/prove` (idle, proving, ready-to-submit, confirmed, rejected), `/app/verify/:tx`, registry, relying party, dApp gate, wrong-network. Save to `docs/evidence/ui/redesign/`.
- Compare each landing section to the spec's layout, spacing and delay table, and record the result in `redesign-map.md`.
- `grep -riE "vortx|cloudfront|ubernatural|planet jumping" frontend/src frontend/index.html` returns nothing relevant. Zero console errors. No third-party media. Keyboard-only walkthrough of `/app/prove` works with visible focus.
- `pnpm test` (all existing tests), `pnpm build`, and the zero-egress prover test pass. Record FCP/LCP (label desktop vs throttled) and confirm no canvas loop on `/app/prove`.
- Update CHANGELOG, VERIFICATION_AUDIT, PERF_BENCHMARKS, ACTIVITY_LOG, SESSION_HANDOFF. Commit messages `ui(redesign): <what>`; push to the working branch; no force-push; merge to `main` only after tests and the screenshot review pass.

**Cut order if time runs short:** secondary pages' polish → `/dev/ui` showcase → menu collapse polish. Never cut: landing, `/app/prove`, `/app/verify/:tx`, and unchanged working functionality.

## 4. Final report (≤15 lines)

Routes restyled, components created, tests/build results, screenshots path, perf numbers (labelled), commits, and any element that still deviates from the reference, stated plainly.

**Begin now with step A.**
