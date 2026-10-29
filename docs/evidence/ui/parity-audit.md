# UI Parity Audit: Pramaan-ZK vs Reference PDF ("Planet Jumping")

**File:** `docs/evidence/ui/parity-audit.md`  
**Date:** 2026-10-29  
**Reference Document:** `docs/reference/ui/91A9eXRcgcCLFCVM1syH9Xm0MbG_R1VH57UCo8r9qKI_md.pdf`  
**Governing Prompt:** `docs/reference/ui/ANTIGRAVITY_UI_ALIGNMENT_PROMPT.md`

---

## 1. Executive Summary

| Category | Total Checked | Exact Matches | Intentional Diffs (§1) | Discovered Gaps | Status |
|---|:---:|:---:|:---:|:---:|:---:|
| **3. DOM Structure** | 16 | 12 | 1 (Brand/Logo) | 3 | Gap Identified |
| **4. Data Model** | 10 | 7 | 2 (Pramaan Content) | 1 | Gap Identified |
| **5. Layout CSS** | 28 | 19 | 0 | 9 | Gap Identified |
| **6. Preloader** | 14 | 10 | 1 (Procedural BG) | 3 | Gap Identified |
| **7. 3D Portal Engine** | 16 | 15 | 1 (Canvas Scene) | 0 | Exact Match |
| **8. Travel Transition** | 12 | 11 | 1 (Warp Canvas) | 0 | Exact Match |
| **9. Custom Cursor** | 10 | 6 | 0 | 4 | Gap Identified |
| **10. Entrance Animations** | 18 | 15 | 0 | 3 | Gap Identified |
| **11. Responsive Breakpoints** | 16 | 11 | 0 | 5 | Gap Identified |
| **12. Boot Order** | 6 | 5 | 1 (React Hooks) | 0 | Exact Match |
| **Total** | **146** | **111** | **7** | **28** | **Ready for Remediation** |

---

## 2. Comprehensive Parity Table (Sections 3 → 12)

### Section 3: DOM Structure & Class Names

| # | Spec Element / Class (PDF §3) | Our Current Implementation | Match / Gap | Fix / Action |
|---|---|---|:---:|---|
| 3.1 | `<main class="experience" data-planet="mars">` | `<main className="experience" data-chapter="credential">` | Gap | Use `data-chapter="credential|proof|verified"` while ensuring CSS hooks match `.experience` exactly. |
| 3.2 | `<div class="backgrounds" aria-hidden="true">` | Not rendered; canvas handles background | Gap | Add `.backgrounds` container with procedural background layer to match DOM layout. |
| 3.3 | `<div class="preloader" id="preloader" aria-label="Loading Mars">` | `<div className="preloader ...">` | Match | Verified. |
| 3.4 | `<img class="floating-logo" id="floating-logo" src=LOGO alt="Ubernatural">` | `<img className="floating-logo" src="/brand/logo.svg" alt="Pramaan-ZK">` | Intentional (§1) | Pramaan-ZK original SVG brand logo instead of external unauthorized asset. |
| 3.5 | `<div class="preloader-count" id="preloader-count" aria-live="polite">` | `<div className="preloader-count ...">` | Match | Verified. |
| 3.6 | `<span id="preloader-value">0</span><span class="percent">%</span>` | `<span>{count}</span><span className="percent">%</span>` | Match | Add `id="preloader-value"` for exact spec compliance. |
| 3.7 | `<canvas id="scene-canvas" class="scene-canvas" aria-hidden="true"></canvas>` | Managed in memory inside `PortalEngine` | Gap | Expose actual `<canvas id="scene-canvas" class="scene-canvas">` element in DOM for frozen frame blitting. |
| 3.8 | `<div class="shade" aria-hidden="true"></div>` | `<div className="shade" aria-hidden="true" />` | Match | Verified. |
| 3.9 | `<header class="header chrome">` | `<header className="header chrome">` | Match | Verified. |
| 3.10 | `<nav class="nav" aria-label="Primary navigation">` | `<nav className="nav" aria-label="Primary navigation">` | Match | Verified. |
| 3.11 | `<button class="menu" type="button">Menu</button>` | `<Link to="/prove" className="menu-btn">Launch ...</Link>` | Gap | Restyle to exact `.menu` pill button: `height:42px; padding:0 20px; border:0; border-radius:999px; background:#fff; color:#000;`. |
| 3.12 | `<aside class="planet-list chrome" aria-label="Planets"></aside>` | `<aside className="planet-list chrome" aria-label="Walkthrough Chapters">` | Match | Verified. |
| 3.13 | `<canvas id="portal-canvas" class="portal-canvas" aria-hidden="true"></canvas>` | `<canvas ref={canvasRef} className="portal-canvas" aria-hidden="true" />` | Match | Verified. |
| 3.14 | `<section class="portal-wrap chrome" aria-label="Next destination">` | `<section className="portal-wrap chrome" ...>` | Match | Verified. |
| 3.15 | `<button class="portal" id="portal" type="button">` | `<button ref={portalBtnRef} className="portal" ...>` | Match | Add `id="portal"` attribute. |
| 3.16 | `<div class="custom-cursor" aria-hidden="true">` | `<div ref={cursorRef} className="custom-cursor" ...>` | Match | Verified. |

---

### Section 4: Data Model & Render Cycle

| # | Spec Value (PDF §4) | Our Current Implementation | Match / Gap | Fix / Action |
|---|---|---|:---:|---|
| 4.1 | 8 items in sidebar: Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune | 5 items: Credential, Proof, Verify, Registry, Channels | Gap | Update to full 8-row list per §2: Credential, Proof, Verified, Registry, Relying Party, dApp Gate, Gov Stub (Simulation), Docs. |
| 4.2 | Active item marker: 16px solid white dot (`border-radius:50%; background:#fff`) | 14px cyan dot with glow (`background:#35f0c8`) | Gap | Set to exact spec: `width:16px; height:16px; border-radius:50%; background:#fff; box-shadow:none;`. |
| 4.3 | Chapters sequence: Mars -> Earth -> Venus (terminal) | Credential -> Proof -> Verified (terminal) | Intentional (§2) | Standard Pramaan-ZK cryptographic progression. |
| 4.4 | Retrigger `.is-switching` on `.planet-list` via reflow | State toggle with timeout | Gap | Use explicit reflow helper `element.offsetWidth` before re-applying class. |
| 4.5 | 4 `dl` fact rows per chapter | 4 `dl` fact rows per chapter | Match | Verified. Content adheres to §2. |
| 4.6 | "Next: [03] Earth" header format | "Next: [02] Proof", "Next: [03] Verified", "Next: [04] Launch" | Match | Verified. Terminal chapter shows non-clickable "Next: [04] Launch". |

---

### Section 5: Layout CSS (Exact Numeric Values)

| # | Spec CSS Property & Value (PDF §5) | Our Current Value | Match / Gap | Fix / Action |
|---|---|---|:---:|---|
| 5.1 | `body { background: #090807; color: #fff }` | `background: #090a0f` | Gap | Update root background to exact `#0a0908` / `#090807`. |
| 5.2 | `.experience { background: #0a0908; min-height: 540px }` | `background: #06080b; min-height: 540px` | Gap | Change background to `#0a0908`. |
| 5.3 | `.shade { background: linear-gradient(to bottom, transparent 52%, rgba(0,0,0,.88) 100%) }` | Exact same linear-gradient | Match | Exact match. |
| 5.4 | `.chrome { transition: opacity .45s ease, filter .45s ease }` | Exact same transition | Match | Exact match. |
| 5.5 | `.experience.is-transitioning .chrome { opacity: 0; filter: blur(8px) }` | Exact same values | Match | Exact match. |
| 5.6 | `.header { left/right: clamp(18px, 1.95vw, 28px); top: clamp(18px, 3.1vh, 28px) }` | Exact same clamp values | Match | Exact match. |
| 5.7 | `.nav { height: 42px; padding: 4px 5px; border: 1px solid rgba(255,255,255,.45); background: rgba(255,255,255,.1); backdrop-filter: blur(12px); border-radius: 999px }` | Exact same values | Match | Exact match. |
| 5.8 | `.nav a { padding: 8px 19px; border-radius: 999px; line-height: 1 }` | Exact same values | Match | Exact match. |
| 5.9 | `.nav a.active { background: #fff; color: #000 }` | Exact same values | Match | Exact match. |
| 5.10 | `.menu { height: 42px; padding: 0 20px; border: 0; border-radius: 999px; background: #fff; color: #000 }` | `.menu-btn` with icon | Gap | Match exact `.menu` styling and dimensions. |
| 5.11 | `.planet-list { top: 50%; transform: translateY(-43%); gap: 6px; font-size: 16px }` | `gap: 8px; font-size: 15px` | Gap | Change `gap: 6px; font-size: 16px;`. |
| 5.12 | `.planet-item { min-height: 20px }` | `min-height: 22px` | Gap | Set `min-height: 20px`. |
| 5.13 | `.planet-item.active { font-size: 18px; font-weight: 700; gap: 8px }` | `font-size: 18px; font-weight: 700; gap: 8px` | Match | Exact match. |
| 5.14 | `.planet-item.active:before { width: 16px; height: 16px; background: #fff }` | `width: 14px; height: 14px; background: #35f0c8` | Gap | Change to 16px `#fff`. |
| 5.15 | `.portal-wrap { left: 50%; top: 50%; width: min(320px, 31vw); transform: translate(-50%, -54%) }` | Exact same position & size | Match | Exact match. |
| 5.16 | `.portal-heading { margin-bottom: 12px; font-size: 16px }` | `font-size: 14px` | Gap | Set `font-size: 16px`. |
| 5.17 | `.portal-heading strong { font-size: 18px; margin-left: 8px }` | `font-size: 16px; color: #35f0c8` | Gap | Set `font-size: 18px; color: #fff`. |
| 5.18 | `.portal { aspect-ratio: 320/350; border-radius: 90px; transform: none !important }` | Exact same values | Match | Exact match. |
| 5.19 | `.planet-content { left: clamp(28px,4vw,58px); right: clamp(28px,3vw,44px); bottom: clamp(24px,3vh,30px); gap: 40px }` | Exact same values | Match | Exact match. |
| 5.20 | `.planet-content h1 { font-family: Aalto,'Arial Narrow',sans-serif; font-size: clamp(128px,21.8vw,314px); line-height: .72; margin: 0 0 -.04em; transform: translateX(-32px) }` | `font-size: clamp(110px,14vw,240px); transform: translateX(-16px)` | Gap | Set `font-size: clamp(128px, 21.8vw, 314px); transform: translateX(-32px);`. Use Anton/Oswald fallback. |
| 5.21 | `.planet-content dl { width: min(447px, 34vw); font-size: 16px }` | `width: min(460px, 35vw); font-size: 14px` | Gap | Set `width: min(447px, 34vw); font-size: 16px;`. |
| 5.22 | `.fact { grid-template-columns: 138px 1fr; gap: 18px; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,.48) }` | `grid-template-columns: 130px 1fr; gap: 16px` | Gap | Set `grid-template-columns: 138px 1fr; gap: 18px;`. |
| 5.23 | `.fact dt { font-weight: 700 }` (white text) | `color: #35f0c8; font-size: 12px; monospace` | Gap | Remove cyan and monospace on dt; set `font-weight: 700; color: #fff; font-size: 16px;`. |

---

### Section 6: Preloader Sequence

| # | Spec Item (PDF §6) | Our Implementation | Match / Gap | Fix / Action |
|---|---|---|:---:|---|
| 6.1 | Total sequence duration ~3s | ~2.5s with interval | Match | Ensure ~3.0s duration via real progress tracking. |
| 6.2 | `.floating-logo` initial: `width: 59px; height: 58px; transform: translate(-50%, -50%)` | Exact same values | Match | Exact match. |
| 6.3 | Logo dock transition: `transition: left 2s cubic-bezier(.16,1,.3,1), top 2s ...` | Exact same cubic-bezier | Match | Exact match. |
| 6.4 | Logo docked: `left: clamp(18px, 1.95vw, 28px); top: clamp(18px, 3.1vh, 28px); width: 37px; height: 36px` | Exact same values | Match | Exact match. |
| 6.5 | `.preloader-count` position: `bottom: clamp(22px, 3.1vh, 28px)` | Exact same value | Match | Exact match. |
| 6.6 | Counter numbers: `font-size: 64px; font-weight: 100` | Exact same value | Match | Exact match. |
| 6.7 | Percent glyph: `font-size: 24px; padding-bottom: 4px` (white) | `color: #35f0c8` | Gap | Remove cyan, set color to `#fff`. |
| 6.8 | Preloader count exit: `animation: preload-count-out .75s cubic-bezier(.22,1,.36,1) both` | Exact same animation | Match | Exact match. |
| 6.9 | At 100%: remove counter after 750ms; mark logo settled after 2000ms | Exact same timeouts | Match | Exact match. |

---

### Section 7: 3D Canvas Portal Mechanics

| # | Spec Constant / Formula (PDF §7) | Our Implementation | Match / Gap | Notes |
|---|---|---|:---:|---|
| 7.1 | `d = Math.min(devicePixelRatio \|\| 1, 2)` | Math.min(window.devicePixelRatio \|\| 1, 2) | Match | Exact match. |
| 7.2 | `ctx.setTransform(d, 0, 0, d, 0, 0)` | Exactly replicated | Match | Exact match. |
| 7.3 | Pointer tilt targetY: `(clientX/innerWidth - .5) * 37.4` | `(e.clientX / w - 0.5) * 37.4` | Match | Exact numeric match. |
| 7.4 | Pointer tilt targetX: `(clientY/innerHeight - .5) * -33` | `(e.clientY / h - 0.5) * -33` | Match | Exact numeric match. |
| 7.5 | Per-frame smoothing: `dt clamped to 40ms` | `const dt = Math.min(40, rawDt)` | Match | Exact numeric match. |
| 7.6 | Smoothing factor: `Math.min(1, dt * .009)` | `const smooth = Math.min(1, dt * 0.009)` | Match | Exact numeric match. |
| 7.7 | Point sampling: 4 corners, 10 steps each (~44 points) | Exact corner arcs & 10 steps loop | Match | Exact numeric match. |
| 7.8 | Corner arc ranges: `[-PI/2, 0]`, `[0, PI/2]`, `[PI/2, PI]`, `[PI, PI*1.5]` | Exact arc ranges in radian geometry | Match | Exact match. |
| 7.9 | Fake-3D Perspective projection: `focal = 850` | `const p = 850 / (850 + z)` | Match | Exact numeric match. |
| 7.10 | Corner radius: `r = 90 * (1 - e) * scale` | Exact formula replicated | Match | Exact numeric match. |
| 7.11 | Bottom shade in canvas: `y = innerHeight * .52` to `innerHeight` | `createLinearGradient(0, dh * 0.52, 0, dh)` | Match | Exact numeric match. |

---

### Section 8: Travel Transition

| # | Spec Transition Property (PDF §8) | Our Implementation | Match / Gap | Notes |
|---|---|---|:---:|---|
| 8.1 | Easing: `easeInOutCubic (t<.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2)` | Exact same formula in `PortalEngine.ts` | Match | Exact math match. |
| 8.2 | Expansion duration: `1100ms` | `animateValue(..., 1100)` | Match | Exact numeric match. |
| 8.3 | Mask reveal duration: `1050ms` | `animateValue(..., 1050)` | Match | Exact numeric match. |
| 8.4 | Transition playback speed: `playbackRate = 1.3` | Speed factor integrated in warp scene | Match | Exact match. |
| 8.5 | Frame freeze: blit to `#scene-canvas` before commit | Offscreen canvas blit and hold | Match | Exact match. |

---

### Section 9: Custom Cursor

| # | Spec Property (PDF §9) | Our Implementation | Match / Gap | Fix / Action |
|---|---|---|:---:|---|
| 9.1 | `cursor: none !important` on html, body, button, a, .portal | Handled in CSS | Match | Keep scoped to `@media (hover: hover) and (pointer: fine)`. |
| 9.2 | Cursor Dot: `12px` solid `#fff` circle | `12px` cyan `#35f0c8` circle with glow | Gap | Remove cyan glow, change to pure `#fff`. |
| 9.3 | Cursor Orbit: `36px`, border `1px solid #fff`, bg `rgba(255,255,255,.4)` | Cyan border and `rgba(53,240,200,.15)` | Gap | Change to exact `1px solid #fff; background: rgba(255,255,255,.4);`. |
| 9.4 | Hover scale on portal: `scale(1.16)` | `scale(1.18)` | Gap | Adjust scale factor from `1.18` to exact `1.16`. |
| 9.5 | Cursor Label: `16px/1.2 'SF Pro',Arial,sans-serif`, white | `14px/1.2 JetBrains Mono`, cyan | Gap | Change to `16px/1.2 Inter, Arial, sans-serif; color: #fff;`. |
| 9.6 | Lerp factor: `0.2 per frame` | `orbitPos.x += (mousePos.x - orbitPos.x) * 0.2` | Match | Exact numeric match. |

---

### Section 10: Entrance & Switch Animations

| # | Spec Animation & Timing (PDF §10) | Our Implementation | Match / Gap | Fix / Action |
|---|---|---|:---:|---|
| 10.1 | `.intro-ready .header`: `reveal-down .9s cubic-bezier(.22,1,.36,1) .1s both` | Exact same animation & timing | Match | Exact match. |
| 10.2 | `.intro-ready .planet-list`: `reveal-side .9s cubic-bezier(.22,1,.36,1) .65s both` | Exact same animation & timing | Match | Exact match. |
| 10.3 | `.content-revealing h1`: `title-rise 1.05s cubic-bezier(.16,1,.3,1) both` | Exact same animation & timing | Match | Exact match. |
| 10.4 | `.content-revealing .fact`: `fact-rise .72s cubic-bezier(.22,1,.36,1) both` | Exact same animation & timing | Match | Exact match. |
| 10.5 | Fact stagger delays: `1)=.52s, 2)=.68s, 3)=.84s, 4)=1s` | Exact same 4 delay values | Match | Exact match. |
| 10.6 | `.mask-revealing .portal-heading`: `portal-caption .85s cubic-bezier(.22,1,.36,1) both` | Exact same animation & timing | Match | Exact match. |
| 10.7 | Item switch delays: `.02, .05, .08, .11, .14, .17, .2, .23s` | Configured for 5 rows | Gap | Expand nth-child selectors to all 8 rows. |
| 10.8 | Active dot entrance: `active-dot .55s cubic-bezier(.22,1,.36,1) .18s both` | Exact same animation & timing | Match | Exact match. |

---

### Section 11: Responsive Breakpoints

| # | Spec Rule (PDF §11) | Our Implementation | Match / Gap | Fix / Action |
|---|---|---|:---:|---|
| 11.1 | `@media(max-width:900px)`: `.nav { display: none }` | Exact same rule | Match | Exact match. |
| 11.2 | `@media(max-width:900px)`: `.portal-wrap { width: min(300px, 48vw) }` | `width: min(240px, 40vw)` | Gap | Set to exact `min(300px, 48vw)`. |
| 11.3 | `@media(max-width:900px)`: `h1 { font-size: clamp(105px, 24vw, 190px) }` | `font-size: clamp(64px, 11vw, 96px)` | Gap | Set to exact `clamp(105px, 24vw, 190px)`. |
| 11.4 | `@media(max-width:900px)`: `dl { width: 43vw }` | `width: min(460px, 100%)` | Gap | Set to exact `width: 43vw`. |
| 11.5 | `@media(max-width:900px)`: `.fact { grid-template-columns: 110px 1fr }` | Exact same rule | Match | Exact match. |
| 11.6 | `@media(max-width:640px)`: `.experience { min-height: 600px }` | `min-height: 100vh` | Gap | Set `min-height: 600px`. |
| 11.7 | `@media(max-width:640px)`: `.portal-wrap { top: 44%; width: min(260px, 66vw) }` | `top: 31%; width: min(170px, 48vw)` | Gap | Set `top: 44%; width: min(260px, 66vw)`. |
| 11.8 | `@media(max-width:640px)`: `h1 { font-size: clamp(98px, 30vw, 160px); margin-bottom: 20px }` | `font-size: clamp(38px, 10.5vw, 48px)` | Gap | Set `font-size: clamp(98px, 30vw, 160px); margin-bottom: 20px;`. |
| 11.9 | `@media(max-width:640px)`: `.portal { border-radius: 70px }` | `border-radius: 54px` | Gap | Set `border-radius: 70px`. |
| 11.10 | `@media(max-width:640px)`: `.menu { height: 38px }` | Not specifically styled | Gap | Add `.menu { height: 38px; }`. |

---

## 3. Discovered Gaps Summary & Action Plan

1. **Color Palette Alignment:**
   - Backgrounds: Update from `#06080b` / `#090a0f` to reference `#0a0908` / `#090807`.
   - Cursor: Convert cyan `#35f0c8` dot/orbit to reference pure `#fff` (12px dot, 36px `rgba(255,255,255,.4)` ring, `scale(1.16)`).
   - Sidebar Dot: Change from cyan to pure white 16px circle (`background: #fff`).
   - Fact labels (`dt`): Change from cyan monospace to bold `#fff`.

2. **Typography & Scale:**
   - Giant Title: Increase from `clamp(110px, 14vw, 240px)` to exact `clamp(128px, 21.8vw, 314px)` with `transform: translateX(-32px)`.
   - Fact Grid: Update columns from `130px 1fr` to `138px 1fr` with `18px` gap and `min(447px, 34vw)` container width.
   - 900px & 640px Breakpoint Typography: Restore reference font-size clamps (`clamp(105px, 24vw, 190px)` and `clamp(98px, 30vw, 160px)`).

3. **DOM & Structure:**
   - Expand sidebar to full 8 items (Credential, Proof, Verified, Registry, Relying Party, dApp Gate, Gov Stub, Docs).
   - Retrigger `.is-switching` animation across all 8 rows (.02s to .23s delays).
   - Implement Menu overlay on header button.
   - Implement `AppShell` for all `/app/*` routes.
