# UI_ADDENDUM_PRAMAAN.md — implements §5 step 10 of ANTIGRAVITY_MASTER_BUILD_PROMPT.md

Place this file and `UI_REFERENCE_Planet_Jumping.pdf` in `docs/reference/ui/`. Read the PDF for exact CSS/JS values. Build this **only after** build-prompt steps 1–8 work. Do not break existing routes, tests, or the zero-egress prover test.

## 1. What to copy and what not to copy

Copy the **mechanics and numbers** from the PDF: layout grid, canvas-masked portal with fake-3D tilt, preloader choreography, easing, stagger timings, custom cursor, chrome blur-out on transition, responsive breakpoints.

Do **not** use anything belonging to the reference brand: no CloudFront URLs (`d2ol7oe51mr4n9...`), no remote videos/images, no "Ubernatural" logo, no "Planet Jumping" title or planet copy, no SF Pro / Aalto fonts (proprietary or unlicensed). No hotlinking third-party assets. Every visual below is original and generated or self-hosted.

## 2. Pramaan-ZK mapping

| Reference | Pramaan-ZK |
|---|---|
| Planets Mars → Earth → Venus | Chapters **CREDENTIAL [01] → PROOF [02] → VERIFIED [03]** (terminal; clicking at VERIFIED does nothing on the landing page) |
| Sidebar of 8 planets | Sidebar of 5 labels: Credential · Proof · Verify · Registry · Channels (first three are the chapters; the rest are static, inactive items that link to sections or `/dapp`, `/relying-party`) |
| Giant title (Aalto) | CREDENTIAL / PROOF / VERIFIED in a free condensed display face |
| 4 fact rows | 4 rows per chapter, factual and honest (see §3) |
| Mercury still on the last portal | A procedural still: closed gate with an on-chain ledger motif |
| Logo | Own wordmark/glyph "Pramaan-ZK" in SVG (simple geometric mark made by you; save to `frontend/public/brand/`) |
| Header nav About / Explore / Planets + Menu | About · Prove · Verify · Docs + "Launch" button → `/prove` |

## 3. Chapter content (landing is an explanation, not a result)

The landing walkthrough is **explanatory**. It must not imply that anyone has been verified.

- **CREDENTIAL** — Next: [02] Proof. Facts: *Input:* Synthetic demo credential (labelled DEMO / SYNTHETIC). *Signed by:* Demo issuer, EdDSA-Poseidon. *Stays on:* Your device. *Real Aadhaar QR:* Not supported yet (future work).
- **PROOF** — Next: [03] Verified. Facts: *Statement:* Age ≥ 18, issuer registered. *Prover:* SnarkJS in your browser. *Reveals:* Nullifier + public inputs only. *Setup:* DEV-ONLY ceremony.
- **VERIFIED** — terminal. Facts: *Check:* Groth16 verifier on MST. *Network:* show the live active network name and chain ID from config (Coral or LEGACY). *Evidence:* "Open a result at /verify/:tx" (link to the latest real tx only if one exists in the evidence file; otherwise "No transaction yet"). *Not claimed:* Government approval, real identity verification.

Dynamic values come from `config/networks.ts` and `docs/evidence/` data exposed via the backend. Never hardcode a tx hash or a "verified" count.

## 4. Visual system (original)

- **Fonts:** UI = Inter (or Manrope); thin counter = Inter weight 100/200; display title = a free condensed face (e.g. Bebas Neue, Anton or Oswald). Self-host or use Google Fonts with fallbacks `Arial, sans-serif` / `'Arial Narrow', sans-serif`. Keep `font-synthesis:none`.
- **Palette:** ground `#06080b`, text `#fff`, one accent (pick one: electric teal `#35f0c8` or violet `#8b7bff`), success/error status colors reserved for real states. Keep the reference's translucent white pills (`rgba(255,255,255,.1)`, blur 12px) for the nav.
- **Media as canvas sources (replaces the three videos + image):** write `frontend/src/landing/scenes.ts` exporting offscreen `<canvas>` generators that animate procedurally and can be passed to `drawImage` exactly like videos:
  1. `credentialScene` — slow drifting field of small cards/glyph columns with soft noise;
  2. `proofScene` — particle ring converging into a circuit-trace grid;
  3. `verifiedScene` — block/ledger lattice with a lit path;
  4. `warpScene` — the transition (fixed 1.1 s expansion + a 0.9 s streak/zoom effect, replaces the `TO_*` video).
  Use 2D canvas; cap internal resolution (≤ 960×540 scaled up) for low-end phones; pause when the tab is hidden.
- **Preloader:** same choreography (black, centered mark, thin counter bottom-center, counter blurs up on finish, mark glides to the header slot over 2 s). The counter reflects **real loading progress** (fonts, scene init, and a streamed prefetch of circuit artifacts, ≥1.2 s minimum so it reads as a sequence). Never fake a hash/verification line in the preloader.

## 5. Engine port (React + TypeScript, no extra libraries)

Create `frontend/src/landing/` as a lazy-loaded route chunk (`/`). Port the PDF's logic into a `PortalEngine` class plus a thin React component:

- `resizeCanvas` with `dpr = min(devicePixelRatio, 2)`.
- Tilt targets: `targetY = (x/w − .5)·37.4`, `targetX = (y/h − .5)·−33`; smoothing `rot += (target − rot)·min(1, dt·.009)`; `dt` clamped to 40 ms.
- Rounded-rect sampled path (~44 points), perspective focal 850, radius 90·(1−e), screen-locked cover draw, `easeInOutCubic`.
- Travel: guard `busy` and terminal state; blur out `.chrome`; expansion over 1100 ms with warp scene; freeze last frame to a scene canvas; commit state; reopen mask over 1050 ms; staggered fact/title reveals using the PDF's timings (title 1.05 s, facts at .52/.68/.84/1 s, sidebar rows .02–.23 s).
- Cursor: dot 12 px, ring 36 px, lerp .2, label "Enter" over the portal. Enable **only** under `@media (hover:hover) and (pointer:fine)`; keep the native cursor everywhere else and for keyboard users; keep visible `:focus-visible` outlines (the PDF's blanket `cursor:none` must not remove accessibility).
- Portal button: real `<button>` with `aria-label="Go to <next chapter>"`; Enter/Space triggers travel; touch tap works without tilt.
- `prefers-reduced-motion`: skip preloader choreography, tilt and warp; show a static composed frame and let chapter changes crossfade in ≤ 200 ms.
- Stop the rAF loops when the route unmounts, the tab is hidden, or `/prove` is open. The `/prove` route must never load the landing chunk or run canvas animation.

## 6. Reuse on the result page (state-accurate gate)

`/verify/:tx` reuses `PortalEngine` with `expansion` driven by the **actual** chain read: closed/pulsing while the receipt is pending; opens only when `eth_getTransactionReceipt` returns `status == 1`, the chain ID matches and the expected event decodes; stays closed with the real revert reason on failure. Label **DEMO / SYNTHETIC** persistently. No success animation without a real receipt.

## 7. Acceptance (record in VERIFICATION_AUDIT.md)

- Visual parity with the PDF's §13 checklist adapted to chapters (preloader → mask opens → title + 4 rows stagger → portal click expands, commits, reopens → terminal chapter ignores clicks).
- Zero console errors; no external libraries; no third-party asset URLs (`grep` for `cloudfront` and `Ubernatural` returns nothing).
- No scrollbars at 375 / 768 / 1440 px; layout holds on the PDF's breakpoints (900 / 640).
- Reduced-motion and keyboard paths work; contrast AA on text over scenes (darken with the bottom gradient shade as in the PDF).
- Measured, throttled mid-range Android profile in `PERF_BENCHMARKS.md`: landing LCP/TBT recorded; `/prove` unaffected (proving time compared with and without landing visited).
- Existing `pnpm test` still passes; screenshots of each chapter at 3 widths saved to `docs/evidence/ui/`.
- Commit: `ui: proof-gate landing (reference-inspired, original assets)`; update CHANGELOG and SESSION_HANDOFF.
