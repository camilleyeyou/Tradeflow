---
phase: 09-features
plan: 02
subsystem: infra
tags: [sentry, observability, fastapi, nextjs, supabase, backups, uptime]

# Dependency graph
requires:
  - phase: 07-medium-priority-hardening
    provides: "requirements.txt trimmed (sentry-sdk removed in 07-02) — this plan re-adds it"
provides:
  - "Guarded Sentry error tracking on FastAPI (api/main.py), disabled unless SENTRY_DSN is set"
  - "Guarded Sentry error tracking on Next.js server/edge/client, disabled unless SENTRY_DSN / NEXT_PUBLIC_SENTRY_DSN is set"
  - "DEPLOY-CHECKLIST section documenting Supabase backups/PITR, /health uptime monitoring, and new Phase 9 env vars"
affects: [09-03, 09-04, 09-05, deploy]

# Tech tracking
tech-stack:
  added: ["sentry-sdk[fastapi]==2.39.0 (Python)", "@sentry/nextjs ^10.63.0 (Node)"]
  patterns:
    - "All new observability env vars are optional/feature-flag: absence disables the feature with no crash, no required-env-var validation added"
    - "Next.js instrumentation-client.ts lives alongside instrumentation.ts in src/ (this project uses src-dir), not at repo root"

key-files:
  created:
    - apps/web/src/instrumentation-client.ts
  modified:
    - api/requirements.txt
    - api/main.py
    - api/.env.example
    - apps/web/package.json
    - apps/web/src/instrumentation.ts
    - apps/web/next.config.ts
    - apps/web/.env.example
    - .planning/phases/05-critical-security-launch-blockers/DEPLOY-CHECKLIST.md

key-decisions:
  - "Placed instrumentation-client.ts at apps/web/src/instrumentation-client.ts (not apps/web/instrumentation-client.ts as listed in plan frontmatter) — this project uses the src/ directory convention, and Next.js requires instrumentation-client.ts to live in the same directory as instrumentation.ts"
  - "Documented migrations 006-009 (already present in supabase/migrations/) in the DEPLOY-CHECKLIST apply-order table alongside the new 010-012 rows, for a complete and accurate sequence rather than a partial one"

patterns-established:
  - "DSN-guarded init pattern: `if os.environ.get('SENTRY_DSN'): sentry_sdk.init(...)` / `if (process.env.SENTRY_DSN) { Sentry.init(...) }` — reusable for any future optional third-party integration"

requirements-completed: [OBSV-01, OBSV-02]

# Metrics
duration: 20min
completed: 2026-07-06
---

# Phase 9 Plan 2: Observability (Sentry) + Backups/Uptime Docs Summary

**Sentry error tracking wired into FastAPI and Next.js behind DSN env-var guards (no-op when unset), plus DEPLOY-CHECKLIST additions for Supabase backups/PITR and an external /health uptime monitor.**

## Performance

- **Duration:** ~20 min
- **Started:** 2026-07-06T09:50:00-07:00 (approx.)
- **Completed:** 2026-07-06T10:09:45-07:00
- **Tasks:** 3
- **Files modified:** 8 (1 created, 7 modified)

## Accomplishments
- FastAPI now initializes `sentry_sdk` at module load, guarded by `SENTRY_DSN` — unset means zero overhead and zero risk of boot failure
- Next.js captures server, edge, and client-side errors via `@sentry/nextjs`, each guarded by its own DSN env var, with the existing `validateEnv()` boot check preserved untouched
- `next.config.ts` wrapped in `withSentryConfig` (inert without an auth token, per Sentry's own no-op behavior)
- DEPLOY-CHECKLIST now documents all five new optional env vars, Supabase automated backups + PITR setup steps, an external uptime monitor targeting `/health`, and the full migration apply order through 012

## Task Commits

Each task was committed atomically:

1. **Task 1: FastAPI Sentry — re-add sentry-sdk and init guarded in main.py** - `7786ae5` (feat)
2. **Task 2: Next.js Sentry — install, extend instrumentation, add client + config, env** - `d99ec09` (feat)
3. **Task 3: OBSV-02 — document backups + uptime + new env vars in DEPLOY-CHECKLIST** - `2026c8a` (docs)

**Plan metadata:** (this commit)

## Files Created/Modified
- `api/requirements.txt` - Added `sentry-sdk[fastapi]==2.39.0`
- `api/main.py` - Added DSN-guarded `sentry_sdk.init()` before `app = FastAPI(...)`
- `api/.env.example` - Documented `SENTRY_DSN`, `SENTRY_TRACES_SAMPLE_RATE`
- `apps/web/package.json` / `package-lock.json` - Added `@sentry/nextjs` dependency
- `apps/web/src/instrumentation.ts` - Extended with server/edge Sentry init + `onRequestError`, kept `validateEnv()`
- `apps/web/src/instrumentation-client.ts` - New: browser Sentry init guarded by `NEXT_PUBLIC_SENTRY_DSN`, exports `onRouterTransitionStart`
- `apps/web/next.config.ts` - Wrapped export in `withSentryConfig(nextConfig, { silent: true })`
- `apps/web/.env.example` - Documented `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`, and both sample-rate vars
- `.planning/phases/05-critical-security-launch-blockers/DEPLOY-CHECKLIST.md` - New section 6 (Sentry/Anthropic env vars, Supabase backups/PITR, `/health` uptime monitor); migration table extended to 012

## Decisions Made
- Instrumentation client file placed under `src/` to match this project's existing `src/instrumentation.ts` location and Next.js's requirement that both files share a directory — a path adjustment from the plan's literal `files_modified` list, not a scope change.
- Filled in migrations 006-009 in the DEPLOY-CHECKLIST apply-order table (they already exist in `supabase/migrations/` from Phases 6-7 but were missing from this doc) so the full 001-012 sequence is documented in one place, not just the three new rows the plan asked for.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Instrumentation-client.ts path corrected to match src-dir convention**
- **Found during:** Task 2
- **Issue:** Plan's `files_modified` frontmatter listed `apps/web/instrumentation.ts` and `apps/web/instrumentation-client.ts` at repo root, but the actual existing file is `apps/web/src/instrumentation.ts` (this project uses the `src/` directory). Next.js requires `instrumentation-client.ts` to live alongside `instrumentation.ts`.
- **Fix:** Created `apps/web/src/instrumentation-client.ts` instead of the root-level path; extended the existing `apps/web/src/instrumentation.ts` in place.
- **Files modified:** apps/web/src/instrumentation.ts, apps/web/src/instrumentation-client.ts
- **Verification:** `npx tsc --noEmit` and `npm run build` both pass with Sentry disabled.
- **Committed in:** d99ec09 (Task 2 commit)

**2. [Rule 2 - Missing Critical] Filled in migrations 006-009 in DEPLOY-CHECKLIST apply-order table**
- **Found during:** Task 3
- **Issue:** The existing migration table jumped straight from 005 to (planned) 010-012, omitting migrations 006-009 that already exist in `supabase/migrations/` from Phases 6-7 — an operator following the checklist verbatim would have an incomplete apply sequence.
- **Fix:** Added rows for 006_add_ghl_token_to_clients.sql, 007_add_reviews_to_clients.sql, 008_least_privilege_rls.sql, 009_schema_integrity.sql before the new 010-012 rows.
- **Files modified:** .planning/phases/05-critical-security-launch-blockers/DEPLOY-CHECKLIST.md
- **Verification:** Confirmed via `ls supabase/migrations/` that all listed files exist on disk.
- **Committed in:** 2026c8a (Task 3 commit)

---

**Total deviations:** 2 auto-fixed (1 blocking path correction, 1 missing-critical documentation gap)
**Impact on plan:** Both are corrections that make the delivered artifacts match the real repo structure and a complete/accurate deploy doc. No scope creep — no new features added.

## Issues Encountered
- `npm install --legacy-peer-deps @sentry/nextjs` took ~7 minutes to resolve/install — no error, just slow; handled by running in background and waiting for the process to exit before proceeding to file edits.

## User Setup Required

None for this plan to merge — Sentry, backups, and uptime monitoring are all optional/deferred to actual deploy time. Before production launch, the operator still needs to (per the updated DEPLOY-CHECKLIST section 6):
- Create a Sentry project and set `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` in Railway and Vercel
- Enable Supabase automated backups + PITR (Dashboard → Database → Backups; PITR requires a paid plan)
- Configure an external uptime monitor against `https://<railway-host>/health`

## Next Phase Readiness
- Both apps are ready to receive Sentry DSNs at deploy time with zero code changes required.
- DEPLOY-CHECKLIST is now the single source of truth for all Phase 9 env vars (Sentry + upcoming `ANTHROPIC_API_KEY` for AI-01) and the full migration apply order through 012 (011/012 migrations themselves are not yet created on disk — they belong to later plans in this phase, e.g. ROI-01/AI-01).
- No blockers for 09-03/09-04/09-05.

---
*Phase: 09-features*
*Completed: 2026-07-06*

## Self-Check: PASSED

All 10 referenced files verified present on disk; all 3 task commit hashes (7786ae5, d99ec09, 2026c8a) verified present in git history.
