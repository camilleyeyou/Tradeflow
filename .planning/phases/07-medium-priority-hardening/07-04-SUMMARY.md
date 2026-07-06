---
phase: 07-medium-priority-hardening
plan: 04
subsystem: infra
tags: [nextjs, fonts, zod, instrumentation, env-validation, performance]

# Dependency graph
requires:
  - phase: 07-medium-priority-hardening
    provides: async DB access, dependency hygiene (07-01, 07-02, 07-03)
provides:
  - Self-hosted-only font strategy in the Next.js app shell (no third-party font requests)
  - Fail-fast environment validation at Next.js server boot via instrumentation.ts
affects: [08-low-priority-cleanup, 09-features, deployment]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Next.js instrumentation.ts register() hook validates required server env vars on nodejs runtime only, before any request is served"
    - "zod safeParse against process.env inside a function (not at module top-level) so build-time evaluation never throws"

key-files:
  created:
    - apps/web/src/lib/env.ts
    - apps/web/src/instrumentation.ts
  modified:
    - apps/web/src/app/layout.tsx

key-decisions:
  - "Removed the Fontshare <head> block entirely rather than self-hosting General Sans/Gambetta via next/font/local — inline fontFamily references already carry system-ui/Georgia fallbacks, so the degradation is the accepted CONTEXT tradeoff, not a regression"
  - "validateEnv() is only invoked inside a function body, never at module top-level, so `next build` (which has no runtime env vars) never crashes; it only runs when instrumentation.ts's register() executes on the nodejs runtime at actual server boot"

patterns-established:
  - "Any future required env var should be added to the zod schema in apps/web/src/lib/env.ts — instrumentation.ts already wires it into the boot sequence"

requirements-completed: [HARD-07, HARD-09]

# Metrics
duration: 8min
completed: 2026-07-06
---

# Phase 7 Plan 4: Font Self-Hosting + Boot-Time Env Validation Summary

**Removed the render-blocking api.fontshare.com `<head>` links (self-hosted next/font retained) and added a zod-validated `validateEnv()` wired into `instrumentation.ts` so the Next.js server refuses to boot silently when required env vars are missing.**

## Performance

- **Duration:** 8 min
- **Started:** 2026-07-06T13:31:46Z
- **Completed:** 2026-07-06T13:39:58Z
- **Tasks:** 2
- **Files modified:** 3 (1 modified, 2 created)

## Accomplishments
- `apps/web/src/app/layout.tsx` no longer requests any third-party font resource — the preconnect and two `api.fontshare.com` stylesheet `<link>` tags are gone; self-hosted `next/font/google` Poppins (`--font-sans`/`--font-heading`) and Geist Mono remain
- `apps/web/src/lib/env.ts` exports `validateEnv()`, a zod-backed check of `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `RESEND_API_KEY` that throws a single error listing every missing/invalid var
- `apps/web/src/instrumentation.ts` exports `register()`, which dynamically imports and calls `validateEnv()` only when `process.env.NEXT_RUNTIME === 'nodejs'` — Next.js 15 invokes this automatically at server boot with no config flag needed
- Confirmed via manual zod parse test that the schema correctly reports which vars are missing (e.g., `NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY`) rather than failing silently or crashing with an unhelpful stack trace

## Task Commits

Each task was committed atomically:

1. **Task 1: Remove render-blocking Fontshare links (HARD-07)** - `289c77c` (fix)
2. **Task 2: Fail-fast env validation at boot (HARD-09, Next.js side)** - `e23c9ae` (feat)

**Plan metadata:** (this commit, see final_commit step)

## Files Created/Modified
- `apps/web/src/app/layout.tsx` - Deleted the `<head>` block containing the `api.fontshare.com` preconnect and two stylesheet `<link>` tags; kept `next/font/google` Poppins + Geist_Mono setup unchanged
- `apps/web/src/lib/env.ts` - New: `validateEnv()` — zod object schema over the four required server env vars, throws a single descriptive error on failure
- `apps/web/src/instrumentation.ts` - New: `register()` — Next.js boot hook, dynamically imports and runs `validateEnv()` only on the `nodejs` runtime

## Decisions Made
- Deleted the Fontshare `<head>` block outright instead of migrating General Sans/Gambetta to `next/font/local` with downloaded font files — per the plan's interface notes, no CSS rule depends on those families (only inline `style={{ fontFamily: ... }}` with system fallbacks), so the CONTEXT-accepted typography tradeoff (system-ui / Georgia fallback) is achieved with zero new asset management, matching the plan exactly.
- Kept `validateEnv()` parsing scoped inside the function body (never at module top-level) so `next build`, which runs with no real runtime secrets locally, cannot be broken by the new file — validation only fires when `instrumentation.ts`'s `register()` actually executes at server boot.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. `npx tsc --noEmit` and `npm run build` (via Turbopack) both passed cleanly after each task; grep-based acceptance criteria all passed (`fontshare` count 0, `rel="stylesheet"` count 0, `next/font/google` present, `validateEnv`/`register`/`NEXT_RUNTIME === 'nodejs'` all present).

## User Setup Required

None - no external service configuration required. (Note: at actual deploy time, Vercel must have `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `RESEND_API_KEY` set, or the server will now correctly refuse to boot — this was already a known Phase 5 deployment prerequisite (DPLY-02), not new work introduced here.)

## Next Phase Readiness
- Phase 7 (Medium-Priority Hardening) is now fully complete: all four plans (07-01 through 07-04) executed.
- HARD-07 and HARD-09 (Next.js side) are closed. Note: HARD-09 may also have a FastAPI-side counterpart tracked elsewhere in the audit; this plan only covered the Next.js app per its explicit scope.
- No blockers for Phase 8.

---
*Phase: 07-medium-priority-hardening*
*Completed: 2026-07-06*

## Self-Check: PASSED

- FOUND: apps/web/src/lib/env.ts
- FOUND: apps/web/src/instrumentation.ts
- FOUND: apps/web/src/app/layout.tsx
- FOUND commit: 289c77c
- FOUND commit: e23c9ae
