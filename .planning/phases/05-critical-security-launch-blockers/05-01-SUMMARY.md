---
phase: 05-critical-security-launch-blockers
plan: 01
subsystem: auth
tags: [nextjs, server-actions, supabase-auth, authorization]

# Dependency graph
requires: []
provides:
  - Admin authorization guard pattern applied to onboardClient and createClientLogin Server Actions
affects: [05-critical-security-launch-blockers, 06]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Server Actions that use createAdminClient() must first call createClient() + auth.getUser() + isAdmin(email) and throw 'Not authorized' before constructing the service-role client"

key-files:
  created: []
  modified:
    - apps/web/src/lib/actions/onboarding-actions.ts
    - apps/web/src/lib/actions/create-client-login.ts

key-decisions:
  - "Reused the exact getUser()/isAdmin() guard pattern already present in settings-actions.ts rather than introducing a new helper, keeping the codebase's auth-check style consistent"

patterns-established:
  - "Admin-only Server Action guard: await createClient() -> auth.getUser() -> isAdmin(user.email) -> throw 'Not authorized' -- placed as the first statements, strictly before any createAdminClient() call"

requirements-completed: [SEC-01]

# Metrics
duration: 2min
completed: 2026-07-06
---

# Phase 5 Plan 1: Admin Authorization Guard on Service-Role Server Actions Summary

**Added a request-scoped admin authorization check (getUser + isAdmin) to onboardClient and createClientLogin, closing a remotely exploitable privilege-escalation gap where any caller could invoke service-role writes.**

## Performance

- **Duration:** 2 min
- **Started:** 2026-07-06T11:03:12Z
- **Completed:** 2026-07-06T11:05:23Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- `onboardClient` now throws `Not authorized` for any unauthenticated or non-admin caller before `createAdminClient()` is constructed or any client/GHL write occurs
- `createClientLogin` now throws `Not authorized` for any unauthenticated or non-admin caller before `createAdminClient()` is constructed, preventing unauthorized auth-user creation and `client_users` inserts
- Both guards reuse the existing `createClient()` + `auth.getUser()` + `isAdmin()` pattern already established in `settings-actions.ts`, keeping the codebase consistent

## Task Commits

Each task was committed atomically:

1. **Task 1: Add admin authorization guard to onboardClient** - `31c1a87` (fix)
2. **Task 2: Add admin authorization guard to createClientLogin** - `30a5798` (fix)

**Plan metadata:** (this commit) (docs: complete plan)

## Files Created/Modified
- `apps/web/src/lib/actions/onboarding-actions.ts` - Added `createClient`/`isAdmin` imports and a guard (`getUser()` + `isAdmin()` check throwing `Not authorized`) as the first statements of `onboardClient`, preceding `createAdminClient()` and the existing schema parsing/insert/GHL provisioning logic (all left unchanged downstream)
- `apps/web/src/lib/actions/create-client-login.ts` - Added `createClient`/`isAdmin` imports and the same guard as the first statements of `createClientLogin`, preceding `createAdminClient()`, temp-password generation, auth-user creation, and the `client_users` insert (all left unchanged downstream)

## Decisions Made
- Reused the exact `getUser()`/`isAdmin()` pattern from `settings-actions.ts` rather than extracting a shared helper function — plan scope was limited to these two files and introducing a new abstraction was not requested; kept changes minimal and consistent with the existing codebase style

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required. This fix is purely application-layer code; the `ADMIN_EMAILS`/`ADMIN_EMAIL` environment variable used by `isAdmin()` was already required by the existing admin panel before this plan.

## Next Phase Readiness

- SEC-01 is closed: both service-role Server Actions reject non-admin/unauthenticated callers before any service-role client is constructed or any database/GHL write occurs
- `npx tsc --noEmit` passes cleanly in `apps/web` after both edits
- Ready for the next plan in Phase 5 (05-02) — no blockers introduced by this change; remaining Phase 5 work (SEC-02 client_users RLS, SEC-03 GHL signature bypass removal, DPLY-01/02, MISS-01..04) is independent of this plan

---
*Phase: 05-critical-security-launch-blockers*
*Completed: 2026-07-06*

## Self-Check: PASSED

- FOUND: apps/web/src/lib/actions/onboarding-actions.ts
- FOUND: apps/web/src/lib/actions/create-client-login.ts
- FOUND: 31c1a87 (Task 1 commit)
- FOUND: 30a5798 (Task 2 commit)
