# ANTIGRAVITY_UI_ALIGNMENT_PROMPT.md — make the whole Pramaan-ZK app look and behave like the reference

Place this file and the reference PDF (`91A9eXRcgcCLFCVM1syH9Xm0MbG_R1VH57UCo8r9qKI_md.pdf`) in `docs/reference/ui/`. Start the session with:
"Read docs/reference/ui/ANTIGRAVITY_UI_ALIGNMENT_PROMPT.md and the PDF beside it, then run §3 step A immediately. Do not re-plan."

This supersedes `UI_ADDENDUM_PRAMAAN.md` where they differ (that file allowed loose interpretation; this one demands exact parity). All honesty, security and evidence rules in `ANTIGRAVITY_MASTER_BUILD_PROMPT.md` still apply.

## 0. Goal

The landing page and the entire application must look and move **exactly like the reference**: same layout, colours, typography proportions, canvas-masked 3D portal, preloader choreography, cursor, entrance/switch animations, timings, easing and breakpoints. The reference's landing experience is the front door; clicking through takes the user into the working Pramaan-ZK app, which wears the same visual shell. Only the content, brand name, logo and media are Pramaan-ZK's own.

**Do not break functionality.** Contracts, backend, prover, wallet flow, OIDC-lite, evidence files and all 46 tests must keep working. Restyle and re-compose; do not change cryptographic or API behaviour.

## 1. Asset policy (the one deliberate difference from the PDF)

The PDF says to use exact remote URLs. **Do not.** Those videos, the logo, the "Ubernatural" name and the planet copy belong to someone else, are hotlinked from a stranger's CDN (they can vanish or be taken down mid-demo), and SF Pro and Aalto are not licensed for our use.

- Visual parity comes from **the same layout, colours, motion, timings and number values**, not from the same files.
- Media = our own procedural canvas scenes (already in `frontend/src/landing/scenes.ts`; improve them so they read as cinematic, slow, high-contrast footage: dark ground, depth, light streaks, subtle grain). They plug into the engine exactly where the `<video>` sources sit in the PDF (`drawCover` sources, preloader, transition, backgrounds).
- Fonts: body/UI = Inter (weights 400/700; thin counter 100–200); giant title = a free condensed display face (Bebas Neue, Oswald or Anton, whichever best matches the reference's tall condensed look at the same `clamp(128px,21.8vw,314px)`). Self-host in `frontend/public/fonts/` with fallbacks as in the PDF.
- Logo and wordmark: our own `frontend/public/brand/logo.svg`.
- **If you (the human) hold the rights to specific video/image files**, drop them in `frontend/public/media/` and set `landing.mediaSource = "files"` in `frontend/src/landing/config.ts`; the engine must support both `canvas` and `video/img` sources behind one interface. Never hotlink third-party URLs. Default stays procedural.

## 2. Content and structure mapping

Keep the PDF's DOM ids/classes and CSS values verbatim wherever possible (`.experience`, `.backgrounds`, `.preloader`, `.floating-logo`, `.preloader-count`, `.header .nav .menu`, `.planet-list`, `.portal-wrap .portal-heading .portal`, `.planet-content h1 dl .fact`, `.custom-cursor`, `.is-transitioning`, `.is-committing`, `.is-switching`, `.content-revealing`, `.mask-revealing`, `.intro-ready`, `.preload-complete`). Port them into React without changing behaviour.

| Reference | Pramaan-ZK |
|---|---|
| mars → earth → venus | CREDENTIAL [01] → PROOF [02] → VERIFIED [03] (VERIFIED is terminal on the landing: portal click does nothing) |
| 8-row planet list | Credential · Proof · Verified · Registry · Relying Party · dApp Gate · Gov Stub (Simulation) · Docs. First three are chapters (active state/animation as in PDF); the rest are links to app routes/docs styled identically |
| Nav About · Explore · Planets | About · Explore · Launch App; `Menu` pill opens a same-style overlay with all routes |
| 4 `dl` fact rows | 4 factual rows per chapter (see content below) |
| Mercury still on terminal portal | Procedural "closed gate" still |
| "Next: [03] Earth" | "Next: [02] Proof", "Next: [03] Verified", terminal shows "Next: [04] Launch" (non-clickable label) |

Chapter content (landing explains the process; it never implies someone has been verified):
- **CREDENTIAL** — *Input:* Synthetic demo credential (DEMO / SYNTHETIC). *Signed by:* Demo issuer, EdDSA-Poseidon. *Stays on:* Your device. *Real Aadhaar QR:* Not supported yet.
- **PROOF** — *Statement:* Age ≥ 18, issuer registered. *Prover:* SnarkJS in your browser. *Reveals:* Nullifier and public inputs only. *Setup:* DEV-ONLY ceremony.
- **VERIFIED** — *Check:* Groth16 verifier on MST. *Network:* live name and chain ID from config. *Evidence:* link to the latest real tx if one exists in evidence, else "No transaction yet". *Not claimed:* Government approval or real identity verification.

**Entering the app:** add a white `.menu`-style pill CTA "Launch app" (header and under the fact rows on the VERIFIED chapter) plus the `Launch App` nav item. Clicking it plays the PDF's portal expansion to full screen (reuse `travel` mechanics: chrome blur-out, window swallows screen, freeze frame), then routes to `/app/prove`, where the shell fades the frozen frame into the app background. Must work with keyboard (Enter/Space) and touch.

## 3. Work plan (commit after each; `pnpm test` + `pnpm build` before each commit)

**A. Parity audit (do first, ≤20 min).** Create `docs/evidence/ui/parity-audit.md`: a table walking the PDF sections 3 → 12 (DOM, data model/render(), layout CSS values, preloader behaviour, portal maths, travel sequence, cursor, animations/keyframes/delays, responsive blocks, boot order) with columns `Spec value · Our value · Match/Gap · Fix`. Read the existing `PortalEngine.ts`, `LandingWalkthrough.tsx`, `landing.css`, `scenes.ts` line by line against it. Include the numeric constants: tilt 37.4/−33, smoothing `dt*.009` clamp 40 ms, focal 850, radius 90, 44-point rounded rect, cursor lerp .2, expansion 1100 ms, mask reveal 1050 ms, playbackRate 1.3 (map to warp scene speed), preloader ≈3 s, logo dock 2 s, fact delays .52/.68/.84/1 s, row delays .02–.23 s, breakpoints 900/640.

**B. Close every gap on the landing page** until the audit shows only intentional differences (assets, fonts, text, §1). Re-check visually: colour `#090807`/`#0a0908`, header pill nav (blur 12px, border `rgba(255,255,255,.45)`), left list with 16px dot on active, giant title at bottom-left with `translateX(-32px)`, fact rows with `rgba(255,255,255,.48)` borders, bottom shade gradient, portal centred at `translate(-50%,-54%)`.

**C. Preloader.** Same choreography: black → centre logo + thin counter → counter blur-up exit → logo glides to header slot over 2 s → header drops, list slides in. Counter reflects real progress of font load, scene init and artifact prefetch (min ≈3 s total to match the reference feel). No fake verification text.

**D. App shell for every route (`/app/*`).** Create `AppShell` reusing the same CSS tokens and components:
- Background: frozen/ambient procedural scene + `.shade` gradient (static frame or ≤ 15 fps CSS-only drift; **no continuous canvas animation on `/app/prove`** so proving is never slowed).
- `.header.chrome`: logo left; pill nav (Prove · Verify · Registry · Relying Party · dApp); right: wallet pill in `.menu` style (Connect / short address) and a network chip (Coral / LEGACY, chain ID).
- `.planet-list` on the left shows the current flow's steps with the active-dot style (e.g. on `/app/prove`: Credential · Proof · Submit · Result), driven by real state.
- Giant condensed title bottom-left (PROVE / VERIFY / REGISTRY / RELYING PARTY / DAPP GATE) with the same `title-rise` entrance.
- Right-bottom `dl .fact` rows show **live data** (network, chain ID, contract address, last tx, status). No hardcoded values.
- Functional UI (buttons, forms, progress, results) lives in a centre glass panel using the nav's visual language: `rgba(255,255,255,.1)` fill, `backdrop-filter:blur(12px)`, 1px `rgba(255,255,255,.45)` border, large radius, white pill primary buttons (`.menu` style), thin typography for numbers. Keep it uncluttered, readable on 375 px.
- Route changes use the `.is-transitioning` chrome blur-out and staggered `content-revealing` entrances.
- `/app/verify/:tx`: the portal is a **state-accurate gate**: closed/pulsing while pending; opens only when the receipt has `status == 1`, chain ID matches and the expected event decodes; stays closed with the real revert reason on failure. No success animation without a real receipt.

**E. Preserve functionality.** Keep every existing `id`, `data-testid` and handler used by tests; move logic, don't rewrite it. Status chips (`DEMO / SYNTHETIC`, `LOCAL VERIFIED`, `OFF-CHAIN VERIFIED`, `TESTNET TX CONFIRMED`, `ZK VERIFIED ON-CHAIN`) restyled to match (monochrome pills; use colour only for real success/error states) and shown on every result.

**F. Accessibility, with the reference's intent intact.** Custom cursor and `cursor:none` only under `@media (hover:hover) and (pointer:fine)`; keep `:focus-visible` rings; portal and CTA are real buttons with labels; `prefers-reduced-motion` = static composed frame, no tilt/warp, ≤200 ms crossfades; contrast AA for text over scenes; no scrollbars on the landing at any size, while app pages may scroll inside the glass panel if content demands it.

**G. Verify and document.**
- Screenshots at 1440 / 768 / 375 px for: preloader mid-state, each landing chapter, mid-transition, `/app/prove` (idle, proving, submitted), `/app/verify/:tx`, registry, relying-party, dApp gate. Save to `docs/evidence/ui/`. Put a reference-vs-ours note per chapter in the parity audit (you cannot download the reference's assets, so compare against the PDF's numeric spec and §13 checklist).
- Tick the PDF's §13 acceptance checklist (adapted to chapters) with evidence.
- `grep -riE "cloudfront|ubernatural|planet jumping|mars|venus" frontend/src frontend/index.html` returns nothing relevant.
- Zero console errors; no external JS/CSS libraries; `pnpm test` passes; the zero-egress prover test still passes; measure and record FCP/LCP and frame rate (label desktop vs throttled), and check `/app/prove` has no running canvas loop.
- Update CHANGELOG, VERIFICATION_AUDIT, PERF_BENCHMARKS, ACTIVITY_LOG, SESSION_HANDOFF. Commit messages like `ui(parity): <what>`; push to the working branch; no force-push.

## 4. Final report (≤15 lines)

Parity audit summary (matches / intentional differences / remaining gaps), routes restyled, tests passed, screenshots path, perf numbers (labelled), commits, and anything that still does not match the reference, stated plainly.
