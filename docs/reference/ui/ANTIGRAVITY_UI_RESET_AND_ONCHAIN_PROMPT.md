# ANTIGRAVITY_UI_RESET_AND_ONCHAIN_PROMPT.md — remove the UI, make the app fully on-chain on MST testnet, prepare for mainnet

Supersedes all earlier UI prompts (portal, VortxLab redesign, app-layout refinement). `ANTIGRAVITY_MASTER_BUILD_PROMPT.md` honesty, security and evidence rules still apply.

## 0. Truth rules (non-negotiable)

1. **"Not demo" means every functional path uses the real chain and real persistence.** It does not mean the credential is a real government identity. Until the real Aadhaar QR circuit (M2) exists and is reviewed, credentials come from a **Testnet Issuer** that attests self-provided data without any identity check. The product must say so plainly ("Testnet issuer: attests the date of birth you enter; no identity verification"). Remove the word "demo" from code and UI where the thing is now real, but never replace it with a claim of identity verification, government approval, DPDP/UIDAI/RBI compliance, or "mainnet ready".
2. Never fake success. A result shows as verified only from a real receipt (`status == 1`, matching chain ID, decoded event) or a real on-chain read.
3. No secrets or PII in code, logs or commits. Keys only from git-ignored `.env`/KMS. Mainnet writes stay **disabled**; the agent prepares mainnet readiness but never broadcasts to mainnet or runs a production ceremony.
4. Existing contracts, circuits, prover logic and tests keep working unless a change is required by §3 and recorded in `docs/DECISIONS`. Every behaviour change gets a test.
5. Sequential commits on branch `reset/ui-and-onchain`; tag `pre-ui-reset` first; never force-push.

## 1. Phase 0 — Inspect and snapshot (≤15 min)

`git status`, `git log -n 20`, `pnpm install`, `pnpm test`, `pnpm build`. Tag the current commit `pre-ui-reset` and push the tag. Write `docs/evidence/reset/inventory.md`: every frontend file classified as **PRESENTATION** (components, pages, CSS, scenes, fonts, images, animations, Tailwind/CSS config, layout wrappers) or **LOGIC** (wallet/chain context, network guard use, prover worker/client calls, API client, hooks, types, tx submission, receipt decoding, ABIs, deployment/config loaders). Record which tests touch each.

## 2. Phase 1 — Remove all UI, keep all functionality

1. Create `frontend/src/core/` and move (not rewrite) every LOGIC file there with no JSX: wallet and chain handling, network guard, prover client, API client, contract read/write helpers, receipt decoding, evidence/deployment loaders, state machines (idle/proving/ready/submitting/confirmed/rejected). Expose them as typed hooks/services (`useWallet`, `useNetwork`, `useProver`, `useSubmitProof`, `useTxResult`, `useRegistry`, `useIssuer`).
2. Delete every PRESENTATION file: all components, pages, styles, landing/portal/scene code, brand assets, fonts, animations, Tailwind config if no longer needed, and the `/dev/ui` route. Leave a **blank unstyled shell** (`<div id="root">`, a single route table, a plain `<pre>` status page at `/` showing network, wallet, and links) so the app still builds and the core hooks can be exercised.
3. Add **headless tests** for the core hooks/services (wallet connect/switch, prover happy and failure paths, submit and receipt decode, registry reads) so functionality is protected independent of any UI. All previous tests plus new ones pass; `pnpm build` passes; zero-egress prover test passes.
4. Commit: `reset(ui): remove presentation layer, extract core`. **Stop and report**, then wait for the new UI reference in `docs/reference/ui/`. Do not design a UI yet.

## 3. Phase 2 — Make everything real on MST testnet

Do this before the new UI so the UI has real data to bind to. Default network is **Coral** (verify live chain ID; legacy only as labelled fallback). Network is chosen by one env var `NETWORK=coral|legacy|mainnet`; **no testnet address, chain ID, RPC or explorer URL may be hardcoded outside `config/networks.ts` and per-network deployment manifests** (`deployments/<network>.json`).

1. **Remove local/demo modes from the product path.** `CHAIN_MODE=local` stays only for automated tests. The runtime refuses to start without a verified network. Delete mock/simulated results, hardcoded tx hashes, and any code path that shows success without a chain check.
2. **Testnet Issuer service (real, persistent).** Replace the in-memory demo issuer with an issuer module: stable EdDSA keypair from env/KMS (never regenerated per run), issuer key hash registered on-chain in `PramaanRegistry` via an owner-only script, credential issuance API with input validation and rate limiting, issuer key rotation procedure documented. It attests user-entered DOB/state; the response and the UI must state exactly that.
3. **On-chain proof flow (already real; harden).** The user's wallet signs `verifyAndRecord`; recipient bound to the wallet; chain ID, scope and issuer checked by the contract; replay rejected. Add: pre-flight `eth_call` simulation before asking the wallet to sign; gas estimate with margin; receipt polling with timeout and reorg-aware confirmation depth; clear mapping of every custom error to a user message.
4. **Persistence and indexing.** Postgres (use what exists; otherwise docker-compose Postgres) for tenants, OIDC clients, auth codes, nonces, sessions, issued-credential metadata (no DOB, no secrets), and an **event indexer** that reads `PramaanRegistry` events from the chain (with block cursor and reorg handling) so history pages and the relying-party gate read indexed on-chain data. No in-memory state that must survive a restart.
5. **Relying-party / OIDC gateway uses the chain.** A token is issued only if the chain shows the nullifier recorded for the requested scope and the wallet signature (EIP-191/SIWE-style, nonce, origin, expiry) proves control of the recipient address. Real signing keys with `kid` and JWKS rotation, persisted. Pairwise `sub` stays. Remove "OIDC-lite demo" wording; document what is and isn't conformant.
6. **Registry operations are real.** Owner-only scripts to register/revoke issuer keys, pause/unpause, transfer ownership; ownership of the registry moves to a **multisig/timelock** before mainnet (script and doc prepared; on testnet use a test multisig or document the key custody). Verify contract sources on the Coral explorer (Blockscout API) if available.
7. **Government/webhook adapter.** The "government stub" cannot be real. Convert it to a generic **signed webhook delivery** feature (tenant-configured HTTPS URL, HMAC/EdDSA signature, retries, delivery log) that fires on registry events. Label it "Webhook" and never imply a government integration; remove the simulation banner only because the thing is no longer pretending.
8. **Privacy.** No IP, credential bytes, DOB or witness in logs; no analytics; short, documented retention for operational metadata; CORS and CSP set; rate limits; input size limits. Update `PRIVACY_AND_COMPLIANCE.md` with an accurate data inventory and what each party can see.
9. **Live end-to-end test.** `pnpm test:live` (manual, requires funded keys) runs on the target testnet: issue → prove → submit → decode receipt → indexer shows the event → OIDC token issued only after chain check → replay and tampered-proof rejected. Save sanitized evidence to `docs/evidence/live-<network>-<date>/` including tx hashes and explorer URLs, and fetch/open the explorer pages to confirm.
10. Update Gate 0 / VERIFICATION_AUDIT with MEASURED values (gas, receipts, block times) from the deployed Coral contracts; relabel any LOCAL figures.

Commit after each item (`onchain: <what>`), tests and build first.

## 4. Mainnet readiness package (prepare, never execute)

Create `docs/MAINNET_READINESS.md` and make the code ready for a later, human-run launch:
- `NETWORK=mainnet` loads `deployments/mainnet.json` and chain 4646 with live `eth_chainId` verification; writes require `MAINNET_WRITES_ENABLED=true` **and** a signed-off file `docs/MAINNET_APPROVAL.md` created by the human; otherwise the guard refuses.
- Deployment script is network-agnostic and idempotent, writes a manifest, verifies source, and has a dry-run mode that prints actions and gas without sending.
- **Hard blockers that cannot be closed by code** (list status honestly in the doc and in the final report): production trusted-setup ceremony (current is DEV-ONLY pot13 with a single contributor); independent audit of the circuit and contracts; written review of the nullifier construction; real credential source (Aadhaar QR circuit M2 and certificate handling); legal opinion (UIDAI offline-verification rules, DPDP, RBI KYC acceptability); multisig/timelock custody; monitoring, incident response and key rotation runbooks; relayer/gas funding plan; rate-limit and abuse testing; MST confirmation of precompile gas, finality and support commitments.
- Provide a readiness matrix (passed / failed / not tested / blocked) and an estimated list of what a responsible mainnet launch still requires. Do **not** mark the app "production ready" in code, docs or UI.

## 5. Phase 3 — New UI (starts only when the reference is in `docs/reference/ui/`)

1. Read the reference (code/spec/screenshots) and extract: layout grid, spacing scale, typography, colours, component shapes, motion. Write `docs/evidence/ui/design-system.md`. Do not copy another brand's name, logo, copy, footage, fonts or hotlinked assets; reproduce the structure and visual language with original assets.
2. **Aesthetic brief:** calm, neutral and trustworthy privacy product; restrained palette, generous whitespace, clear hierarchy, no gimmicky clutter; motion only where it explains state. (If "agnostic" meant something different, ask the human once, then proceed.)
3. **Layout first, then pages.** Build the shell and primitives (`PageShell`, `PageHeader`, `Card`, `DataList`, `CodeBlock`, `StatusBanner`, `ProgressSteps`, `EmptyState`, `Field`, buttons) on a 12-column grid with one spacing scale, a fixed nav, an internally scrolling content area, no horizontal scroll, one primary action per card, truncated hashes with copy and tooltips. No page is built until the primitives pass layout checks at 375 / 768 / 1440 px.
4. **Information architecture:** Landing (what it proves, what it reveals, honest limits, network and contract, CTA) → App: **Get credential** (testnet issuer) → **Generate proof** → **Submit on-chain** → **Result** (tx, block, gas, event, explorer link) → **Verify any transaction** → **Registry** (live reads, indexed events) → **Relying parties** (tenant setup, OIDC test, webhooks) → **Settings/Network**. Progressive disclosure: one step per card on the prove flow, always-visible summary (network, wallet, contract, status).
5. Bind only through the `core` hooks. Every state is designed: no wallet, wrong network, insufficient funds, proving (progress + cancel), simulating, awaiting signature, pending, confirmed, reverted (real reason), replay detected, issuer unavailable, RPC down. Chips show real states only; permanent testnet banner (network name + chain ID) while `NETWORK != mainnet`.
6. Accessibility: keyboard flow, visible non-clipped focus, AA contrast, `prefers-reduced-motion`, 44 px touch targets, semantic landmarks, live-region status announcements.
7. **Layout checks (automated):** per page at 3 widths assert no horizontal scroll, no overflow or overlap, console clean; screenshots of every state in `docs/evidence/ui/`.
8. No continuous canvas or heavy animation on the proving page.

## 6. Verification and reporting

- After each phase: `pnpm test`, `pnpm build`, secret scan, `git status` clean, docs updated (ACTIVITY_LOG, VERIFICATION_AUDIT, CHANGELOG, SESSION_HANDOFF, GATE0_TEST_REPORT).
- `grep -riE "demo|mock|simulat|synthetic|hardcod" frontend/src backend config scripts` reviewed: every remaining hit is either test-only or an accurate label (e.g. "Testnet issuer").
- Final report each phase (≤12 lines): what was removed/added, what is real vs still blocked, test counts, tx hashes and explorer links, commits, open blockers.
