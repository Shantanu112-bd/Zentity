# ANTIGRAVITY_STATUS_AND_MAINNET_PARITY_PROMPT.md — report what is done, then build mainnet-grade functionality (still on testnet)

Place in `docs/reference/`. Start with: "Read docs/reference/ANTIGRAVITY_STATUS_AND_MAINNET_PARITY_PROMPT.md and run Part 1 now. Do not start Part 3 until I answer Part 2 or say 'use your recommendations'."
The honesty, security and evidence rules of `ANTIGRAVITY_MASTER_BUILD_PROMPT.md` and `ANTIGRAVITY_UI_RESET_AND_ONCHAIN_PROMPT.md` still apply. Mainnet writes stay disabled. The agent never asks for or prints secrets; the human creates accounts and puts credentials in git-ignored env files or the host's secret store.

## Part 1 — Status audit (do this first; re-verify, do not recall)

Re-run, don't trust earlier reports: `git status`, `git log --oneline -n 40`, branches/tags, `pnpm install`, `pnpm test`, `pnpm build`, secret scan, and the live test (`pnpm test:live`) if funded. Then write `docs/STATUS_REPORT.md` (and print a ≤40-line summary) answering:

1. **Done and verified** — per area (contracts, circuit, prover, backend/OIDC, issuer, indexer, persistence, wallet flow, UI, CI), with evidence paths, tests (counts), deployed addresses per network, tx hashes + explorer links, gas MEASURED vs LOCAL.
2. **Done but not verified / partial** — what exists but lacks tests or live evidence.
3. **Still mock, simulated, in-memory, hardcoded or testnet-only** — from a grep of `demo|mock|simulat|TODO|FIXME|hardcod|localhost|in-memory` and a manual review of config. List each with file and why.
4. **What the Coral deployment actually is:** addresses, owner, paused state, registered issuer key hash, who holds each key, ceremony type, compiler settings, source verified on explorer (yes/no).
5. **Open blockers and risks** (ceremony, audit, nullifier review, real credential source, legal, key custody) with status.
6. **Mismatches** between the docs/README and the code, and between earlier claims and evidence. Correct the docs.
Do not flatter. If something is unverified, say so.

## Part 2 — Gap analysis and recommendations (answer in the same report, then wait)

Produce a prioritized backlog for **mainnet-grade functionality at MVP scale** using the matrix below. For each item give: what exists, gap, recommended option (+ one alternative), effort (S/M/L), cost (free-tier or paid), and who must supply what. Use these recommendations as defaults unless a better evidence-based option exists:

| Area | Recommended default | Notes |
|---|---|---|
| **Database** | Keep the Fastify API for all crypto, relayer, indexer and OIDC logic. Use **Supabase as managed Postgres** (migrations in SQL, row-level security for tenant tables, server-only service key, daily backups, point-in-time recovery if plan allows). Optional: Supabase Realtime for the live-events feed. | **Do not use Supabase Auth** for end users; it would introduce identity data this product avoids. Alternative: Neon/RDS/self-hosted Postgres. Hosting is not a trust upgrade; trust comes from contracts, circuits and key management. |
| **API gateway & edge** | Cloudflare in front (DNS, TLS, WAF, rate limiting, bot protection, Turnstile on the issuer endpoint). In-app gateway layer: versioned `/v1`, API keys (hashed), per-key rate limits, request IDs, OpenAPI 3 spec, idempotency keys. | |
| **Hosting** | Frontend on a static host (Cloudflare Pages/Vercel); API + indexer + relayer worker on a container host (Fly.io/Render/Railway) with health checks, auto-restart, secrets in the platform store, staging + production. | Pick what the human has accounts for. |
| **Key management** | KMS-backed signing (AWS KMS or GCP KMS) behind the existing signer interface for issuer key, JWKS signing keys and relayer; documented rotation; no private keys in env on production. | Testnet may use env keys; the code path for KMS must exist and be tested with a local KMS emulator or sandbox. |
| **RPC resilience** | Multi-endpoint RPC with health scoring, timeouts, retries/backoff, fallback and stale-block detection; endpoints configured per network. | Add Coral/mainnet endpoints from MST docs/support; do not invent. |
| **Indexer** | Idempotent, resumable cursor, reorg handling, backfill command, lag metric, gap detection, Realtime/WS feed. | |
| **Observability** | Structured JSON logs with PII redaction, `/healthz` + `/readyz`, Prometheus-style `/metrics`, error tracking (Sentry or self-hosted; scrub PII), uptime checks, alert rules (RPC lag, indexer lag, deployer/relayer balance, failed-tx rate, registry paused, owner changed, issuer key changed, 5xx rate). | |
| **Contract ops** | Source verified on explorer; owner moved to multisig + timelock (Safe if MST supports it; otherwise a documented alternative); event-based alerts; invariant/fuzz tests; Slither; upgrade policy documented (no proxy unless justified). | |
| **Developer experience (relying parties)** | Tenant dashboard (create client, redirect URIs, API keys, webhooks, usage), `@pramaan/sdk` (TS) with typed client and OIDC helpers, embeddable "Verify with Pramaan" button/widget, quickstart docs, Postman/OpenAPI. | |
| **Webhooks** | Signed delivery, retries with backoff, dead-letter queue, delivery log, replay protection (timestamp + signature). | |
| **Security hardening** | CSP/HSTS/CORS allowlist, rate limits, input size limits, dependency + secret scanning in CI, SBOM, `security.txt`, abuse tests, DoS limits on proof submission endpoints. | |
| **CI/CD** | GitHub Actions: lint, typecheck, unit, contract tests, build, audit, secret scan; preview deploys; manual workflow for live testnet tests; protected main. | |
| **Product polish ("inspiring")** | Public **proof receipt** page per tx (shareable link + QR), live network/registry stats page (count of verifications, active issuers, recent events from chain), clear onboarding, plain-language privacy explainer, i18n (English + Hindi first), PWA/offline caching of circuit artifacts with hash checks, accessibility pass, status page. | UI follows the new design system from `docs/reference/ui/`. |
| **Privacy & legal pages** | Privacy notice and terms drafts that match the real data inventory; flagged "needs legal review"; retention jobs. | No compliance claims. |
| **Testing** | Playwright E2E (wallet mocked at the browser level only for UI tests, plus a live path), k6 load tests on API/relayer, RPC-outage and DB-failure chaos tests, regression suite. | |

Ask the human only for things that block decisions: hosting accounts, Supabase project URL/keys placement, domain, KMS provider, budget limit. Offer "use your recommendations" as the default answer.

## Part 3 — Implementation (after approval; order and acceptance criteria)

Work on branch `feat/mainnet-parity`; commit sequentially; tests and build before each commit; no force-push; update CHANGELOG, VERIFICATION_AUDIT, ACTIVITY_LOG, SESSION_HANDOFF each step.

- **P0 (production backbone):** managed-Postgres adapter + migrations + RLS; env-driven config for staging/production; `/healthz`, `/readyz`, `/metrics`; structured redacted logging; RPC fallback layer; indexer hardening with lag metric; KMS signer implementation + rotation script; CI pipeline. *Accept:* restart/redeploy loses no state; killing the primary RPC doesn't break reads; indexer resumes after downtime and matches chain events; logs contain no PII (test).
- **P1 (gateway and developer surface):** `/v1` API with API keys, rate limits, request IDs, OpenAPI; tenant dashboard and webhooks (signed, retried, DLQ); `@pramaan/sdk` + widget; Cloudflare/edge configuration docs and WAF/Turnstile hooks; security headers. *Accept:* a second developer can integrate from the docs in under 30 minutes (document the timed walkthrough); abuse tests pass.
- **P2 (contract ops and trust):** multisig + timelock scripts and runbook; explorer source verification; owner/issuer/pause alerts; Slither + invariant tests clean or documented; public transparency page; proof receipt page with QR. *Accept:* owner actions require the multisig path in a testnet rehearsal with evidence.
- **P3 (polish and scale):** i18n, PWA artifact caching, status page, E2E + load + chaos tests, accessibility pass, docs site. *Accept:* k6 and chaos results recorded in `PERF_BENCHMARKS.md` (labelled environment).

**Cut order:** P3 → P2 polish → webhook DLQ. Never cut P0.

## Part 4 — Mainnet-parity checklist (maintain in `docs/MAINNET_READINESS.md`)

For each item mark passed / failed / not tested / blocked, with evidence: config-driven networks and manifests · chain-ID guard · mainnet write lock (flag + signed approval file) · KMS keys · multisig/timelock ownership · monitored alerts · backups and restore test · incident and rotation runbooks · rate limits and abuse tests · privacy inventory · live E2E on Coral · load test · **external blockers that code cannot close** (production ceremony, independent audit, nullifier review, real credential source, legal opinion, MST support commitments). Never label the product "production ready" or "mainnet ready".

