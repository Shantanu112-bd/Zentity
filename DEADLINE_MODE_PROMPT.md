# DEADLINE MODE — Pramaan-ZK MVP (overrides ANTIGRAVITY_MASTER_LOOP_PROMPT.md where they conflict)

Commit this file to the repo root. Start the session with: "Read DEADLINE_MODE_PROMPT.md, AGENTS.md, docs/SESSION_HANDOFF.md, then build. Do not ask for approvals; the decisions in §1 are made."

Honesty rules from the master prompt still apply: never fake a verification, never claim Aadhaar/UIDAI/government integration, label every mock. Those are what make the demo credible to judges. Everything else about process is relaxed: short log entries, no long reports, commit after each working step.

## 1. Decisions made (human approved for this MVP only)

- **D-03 override:** No Anon Aadhaar / RSA-in-circuit today. It is not feasible in one day. The MVP uses a **synthetic credential** issued by a clearly labelled **DEMO ISSUER** and signed with EdDSA-Poseidon (circomlib). Every screen and README says: *"Synthetic credential. Real Aadhaar QR support is future work (milestone M2)."*
- **D-04 (demo-only):** `nullifier = Poseidon(credentialSecret, scopeId)`, where `credentialSecret` is a field inside the issuer-signed credential (not user-chosen). Document in `CRYPTO_DESIGN.md` that this is unreviewed.
- **D-05:** Public inputs: `issuerPubKeyHash, scopeId, nullifier, recipient, chainId, thresholdAgeDays/currentDate`. Contract checks `recipient`, `chainId`, and that the issuer key hash is registered.
- **D-15:** `PramaanRegistry` = Ownable + Pausable. No timelock today; list it as residual risk.
- **Network:** MST **legacy testnet (91562037)** is the demo target (verified chain ID, shuts down 31 Jan 2027). Label it so. Coral stays an open blocker. Mainnet: never.
- **Circuit statement:** "I hold a credential signed by registered issuer key K, and my age ≥ 18 as of public date D." Optional second predicate (state) only if time remains.

## 2. Ordered work (timeboxes are guides; cut from the bottom, never from the top)

1. **Funding check (2 min).** If `DEPLOYER_PRIVATE_KEY` is not in `.env`, skip every on-chain step, build everything else against local Hardhat, and make the demo's chain mode switchable (`CHAIN_MODE=local|mst-legacy-testnet`). The UI must display the active mode.
2. **Circuit (45 min).** `circuits/pramaan/age_credential.circom`: EdDSAPoseidon signature verify over `Poseidon(dobDays, stateCode, credentialSecret)`, age check via `LessEqThan`, nullifier, recipient/scope/chain binding signals (square them to constrain). Dev-only ceremony, labelled DEV-ONLY. Negative tests: under-18, wrong issuer, tampered signature, wrong scope.
3. **Contracts (45 min).** Generated verifier + `PramaanRegistry` (register issuer key hash, `verifyAndRecord`, nullifier set per scope, events with no PII, pause). Hardhat tests incl. replay, wrong recipient, wrong chainId, unregistered issuer, paused. Deploy to MST legacy testnet if funded; record tx hashes and gas in `docs/evidence/`.
4. **Backend (60 min).** Fastify + TypeScript:
   - `POST /api/demo/issue` → issues a synthetic credential (labelled DEMO ISSUER, never accepts real data).
   - `POST /api/verify` → snarkjs off-chain verify; optional relayed on-chain submit (relayer key from env; per-IP rate limit; idempotency key; **no IP/credential logging**).
   - `GET /api/registry/:nullifier` → reads chain state.
   - **OIDC-lite** (`/.well-known/openid-configuration`, `/authorize`, `/token`, `/userinfo`, `/jwks`): auth code + PKCE, exact redirect URI match, pairwise `sub` = HMAC(nullifier, clientId), `jose` for JWTs, one seeded demo tenant. Label "demo-grade; not a conformance-tested OIDC provider".
   - **Government channel:** signed-webhook stub, banner "SIMULATION — NOT A GOVERNMENT INTEGRATION".
5. **Client proving (30 min).** Browser SDK: snarkjs in a Web Worker, progress + cancel, artifacts (wasm/zkey) served statically with hash check. Credential never leaves the browser (add a test that asserts no network request contains credential fields).
6. **Frontend (90 min).** Vite + React + TS. Routes:
   - `/` landing (portal experience, below)
   - `/prove` proving flow (separate route; no canvas animation running here)
   - `/verify/:tx` result page reading real chain state
   - `/relying-party` demo Web2 app using the OIDC-lite flow
   - `/dapp` demo Web3 gate reading the registry
   Status chips everywhere: `REAL` (on-chain verified, tx link), `OFF-CHAIN VERIFIED`, `SYNTHETIC`, `SIMULATED`.
7. **Docs and demo (20 min).** README with a 3-minute demo script, architecture diagram (Mermaid), exact run commands, a table of **what is real / mocked / unverified**, known limitations (synthetic credential, unreviewed nullifier, DEV-ONLY ceremony, stolen-QR risk, legacy testnet shutdown, legal review pending).
8. **Cut list if time runs out (cut in this order):** second predicate → `/dapp` page → government stub → OIDC-lite (keep `/verify` + `/prove`) → landing animations (keep a static polished page). Never cut: real proof generation, real verification, honest labelling.

Commit after each numbered step with message `mvp(<step>): <what works>`. Run `pnpm test` before each commit; do not commit failing tests unless marked `// KNOWN-FAIL` with a note in the README. Never commit `.env`, zkeys that are production-labelled, or secrets. Push to the existing remote on the working branch only.

## 3. UI direction (original branding; mechanics inspired by the reference)

Place the reference URL/screenshots/notes in `docs/reference/ui/`. If absent, build to this spec and move on.

- **Concept:** the "proof gate". A canvas-masked portal on the landing page that opens as the visitor scrolls or presses "Begin proof"; the same gate opens on `/verify/:tx` only when the chain read returns verified. It must reflect real state; no fake success animation.
- **Effects to implement:** preloader with real progress counter (tied to loading assets); canvas mask portal with pointer parallax/tilt; staged text reveals (IntersectionObserver); desktop-only custom cursor (hidden on touch, system cursor preserved for keyboard users); smooth section transitions.
- **Assets:** generate original visuals procedurally (canvas/WebGL gradients, noise, particles, SVG). **Do not** use the reference's footage, logo, fonts, copy or CDN assets.
- **Brand:** name "Pramaan-ZK"; pick one distinctive typeface pair from Google Fonts with fallbacks and one restrained palette (dark ground, one accent, one status colour set); document choices in a few lines in the README.
- **Quality bar:** responsive from 360 px, `prefers-reduced-motion` honoured (static fallback), keyboard-navigable, visible focus, contrast AA, proving route free of heavy animation, bundle lazy-loaded (landing 3D/canvas code split from prover).
- **Copy:** say "age ≥ 18 attribute proven"; never "identity verified by government".

## 4. Definition of done for today

- `pnpm install && pnpm dev` runs frontend + backend locally from a clean clone (document Node/pnpm versions).
- Prove → verify off-chain → (if funded) verify on MST testnet with a real tx hash shown and linked to `testnet.mstscan.com`.
- Invalid cases visibly fail: under-18 credential, reused nullifier, wrong scope.
- README table of real/mocked/unverified is accurate and matches the code.
- Final commits pushed; a short `docs/SESSION_HANDOFF.md` update with one next action (Coral Gate 0 re-run, real QR circuit M2, crypto review).

Report at the end in ≤15 lines: what runs, what was verified on-chain (with tx hashes), what is mocked, what failed.
