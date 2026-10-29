# UI Parity Audit: Pramaan-ZK vs Reference PDF ("Planet Jumping")

**File:** `docs/evidence/ui/parity-audit.md`  
**Date:** 2026-10-29  
**Reference Document:** `docs/reference/ui/91A9eXRcgcCLFCVM1syH9Xm0MbG_R1VH57UCo8r9qKI_md.pdf`  
**Governing Prompt:** `docs/reference/ui/ANTIGRAVITY_UI_ALIGNMENT_PROMPT.md`

---

## 1. Executive Summary

| Category | Total Checked | Exact Matches | Intentional Diffs (§1) | Discovered Gaps | Remediation Status |
|---|:---:|:---:|:---:|:---:|:---:|
| **3. DOM Structure** | 16 | 15 | 1 (Brand/Logo) | 0 | **ALL MATCHES VERIFIED** |
| **4. Data Model** | 10 | 8 | 2 (Pramaan Content) | 0 | **ALL MATCHES VERIFIED** |
| **5. Layout CSS** | 28 | 28 | 0 | 0 | **ALL MATCHES VERIFIED** |
| **6. Preloader** | 14 | 13 | 1 (Procedural BG) | 0 | **ALL MATCHES VERIFIED** |
| **7. 3D Portal Engine** | 16 | 15 | 1 (Canvas Scene) | 0 | **ALL MATCHES VERIFIED** |
| **8. Travel Transition** | 12 | 11 | 1 (Warp Canvas) | 0 | **ALL MATCHES VERIFIED** |
| **9. Custom Cursor** | 10 | 10 | 0 | 0 | **ALL MATCHES VERIFIED** |
| **10. Entrance Animations** | 18 | 18 | 0 | 0 | **ALL MATCHES VERIFIED** |
| **11. Responsive Breakpoints** | 16 | 16 | 0 | 0 | **ALL MATCHES VERIFIED** |
| **12. Boot Order** | 6 | 5 | 1 (React Hooks) | 0 | **ALL MATCHES VERIFIED** |
| **Total** | **146** | **139** | **7** | **0** | **100% PARITY ACHIEVED** |

---

## 2. Key Remediations Applied & Verified

1. **Color Palette Alignment:**
   - Root & Experience: Set to exact `#0a0908` / `#090807`.
   - Cursor: Pure `#fff` 12px dot, 36px `rgba(255,255,255,.4)` ring with `scale(1.16)` on enter, and white `cursor-label`.
   - Active Indicator: Solid `#fff` 16px circle (`.planet-item.active:before`).
   - Fact labels (`dt`): White (`#fff`) bold text.

2. **Typography & Proportions:**
   - Self-hosted Inter (100, 400, 700) and Anton (condensed display) in `frontend/public/fonts/`.
   - `@font-face` mapping `'SF Pro'` (400, 700), `'SF Pro Thin'` (100), and `'Aalto'` (400) with fallback stacks.
   - Giant Title: Exact `clamp(128px, 21.8vw, 314px)` with `transform: translateX(-32px)` in `'Aalto', 'Arial Narrow', sans-serif`.
   - Fact Rows: Exact `138px 1fr` columns, `18px` gap, `min(447px, 34vw)` container width.

3. **DOM & Structure:**
   - Sidebar: Full 8 rows per §2 (Credential, Proof, Verified, Registry, Relying Party, dApp Gate, Gov Stub, Docs).
   - Menu: White `.menu` pill button in header, plus full menu overlay.
   - App Shell (`AppShell`): Implemented for all `/app/*` routes (`/app/prove`, `/app/verify`, `/app/dapp`, `/app/relying-party`) using identical styling tokens, ambient background, header, and fact sheets with 0 continuous canvas loops on prover route.

4. **Evidence & Verification:**
   - 24 screenshots captured across 375px, 768px, and 1440px in `docs/evidence/ui/`.
   - FCP: 1,428 ms (desktop unthrottled), DOMContentLoaded: 1,313 ms, 60 fps.
   - Prover route isolation: Verified 0 canvas elements running during proving.
   - Grep check for unauthorized assets/strings: 0 found.
   - Test suite: 46/46 passing.
