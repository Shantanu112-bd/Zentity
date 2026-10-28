# AGENTS.md — Operational Rules for Pramaan-ZK

## 1. Prime Directives (Non-Negotiable)
1. **Evidence over assertion:** Never report "works", "passes", "deployed", or "verified" without recording the exact command, raw output, and artifact hash/path.
2. **Never invent:** No hallucinated RPCs, APIs, SDKs, chain IDs, gas sponsorship, or UIDAI specs. Mark unknown items as `UNVERIFIED` and create a blocker.
3. **Label every fact:** In all audits, tag facts as `OFFICIAL`, `SECONDARY`, `CLAIM`, `MEASURED`, or `UNVERIFIED`.
4. **Gates block dependents:** If a gate (e.g. Gate 0) is `FAIL` or `INCONCLUSIVE`, stop dependent tasks. Never silently downgrade trust models.
5. **Zero secrets / Zero PII:** Never ask for, log, or commit private keys, real Aadhaar data, or raw witnesses. Use synthetic test fixtures only.
6. **No mainnet execution:** Strictly testnet-only until M10 and explicit human approval.
7. **No unhackable claims:** Defense-in-depth and documented residual risks only. Never claim government/regulatory approval.
8. **No ad-hoc cryptography:** Use audited primitives (e.g., Anon Aadhaar base after review). No novel unreviewed circuits or nullifier formulas.
9. **Minimal coherent changes:** Single framework, single EVM client, single package manager. No speculative services.
10. **Bounded effort:** Maximum 3 distinct fix attempts per failure, then log `BLOCKED` with evidence and notify the human.

## 2. Session Start Protocol
At the beginning of each session:
1. Read in order: `AGENTS.md` → `PROJECT_CONTEXT.md` → `implementation_plan.md` → last 150 lines of `docs/ACTIVITY_LOG.md` → `docs/VERIFICATION_AUDIT.md` → `docs/SESSION_HANDOFF.md`.
2. Run and record: `git status`, `git log --oneline -n 15`, `git diff --stat`. If tree is dirty with uncommitted human changes, stop and ask.
3. Check toolchain versions (node, pnpm, git, circom, snarkjs, solc/hardhat, docker) and log them.
4. Announce the single next unblocked, approved task and state acceptance criteria aloud.

## 3. Session End Protocol
At the end of each session:
1. Update `docs/ACTIVITY_LOG.md` (append-only), `implementation_plan.md`, `docs/VERIFICATION_AUDIT.md`, `docs/CHANGELOG.md`.
2. Run secret scan (`git grep` for keys/addresses, ensure `.env` untracked).
3. Commit with descriptive message referencing task ID on branch `m<N>/<slug>`. Never force-push.
4. Rewrite `docs/SESSION_HANDOFF.md` with: last completed task, last test results, blockers, files to read first, and exactly ONE next action.

## 4. Status Vocabulary
Only use: `PLANNED` · `IN_PROGRESS` · `IMPLEMENTED` · `TESTED` · `VERIFIED` · `BLOCKED` · `DEFERRED`.
`VERIFIED` strictly requires reproducible evidence stored in `docs/evidence/` and linked in `docs/VERIFICATION_AUDIT.md`.

