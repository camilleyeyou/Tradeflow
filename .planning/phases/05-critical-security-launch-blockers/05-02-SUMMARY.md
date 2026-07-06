---
phase: 05-critical-security-launch-blockers
plan: 02
subsystem: database
tags: [supabase, postgres, rls, row-level-security, multi-tenancy, security]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: client_users join table (defined in 001_initial_schema.sql, RLS intentionally left disabled)
provides:
  - "Migration 004 enabling RLS on public.client_users with a self-read-only SELECT policy"
  - "Closed root tenant-isolation vulnerability (SEC-02) at the schema level"
affects: [06-correctness-legal-fixes, deploy/DPLY-01, deploy/DPLY-02]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "RLS self-read policy pattern: USING (user_id = (select auth.uid())) — lets a user read only their own client_users mapping without circular dependency, since other tables' policies subquery client_users by user_id"

key-files:
  created: [supabase/migrations/004_enable_rls_client_users.sql]
  modified: []

key-decisions:
  - "Confirmed the v1.0 'circular dependency' rationale for disabling RLS on client_users was incorrect — a self-read SELECT policy resolves the concern without breaking other tables' subqueries"
  - "No INSERT/UPDATE/DELETE policies added — admin writes go through the service role key which bypasses RLS by design"

patterns-established:
  - "New Supabase migrations follow numeric prefix ordering (004 after 003) with a header comment block explaining the security rationale"

requirements-completed: [SEC-02]

# Metrics
duration: 3min
completed: 2026-07-06
---

# Phase 5 Plan 2: Enable RLS on client_users Summary

**Migration 004 enables Row Level Security on `public.client_users` with a single self-read-only SELECT policy, closing the root tenant-isolation vulnerability where any anon/authenticated user could read or write the identity-mapping table via PostgREST.**

## Performance

- **Duration:** 3 min
- **Started:** 2026-07-06T00:00:00Z (approx)
- **Completed:** 2026-07-06 (approx)
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Created `supabase/migrations/004_enable_rls_client_users.sql` enabling RLS on `client_users` with `USING (user_id = (select auth.uid()))` SELECT policy
- Verified no write policies (INSERT/UPDATE/DELETE) were added — admin writes rely on the service role key bypassing RLS
- Closed SEC-02: previously, a public-schema table with RLS disabled was fully readable AND writable by any anon/authenticated caller via PostgREST, allowing an attacker to insert `(auth.uid(), victim_client_id)` and defeat every other table's tenant-isolation policy

## Task Commits

Each task was committed atomically:

1. **Task 1: Write migration 004 enabling RLS + self-read policy on client_users** - `45015f3` (fix)

**Plan metadata:** (this commit)

## Files Created/Modified
- `supabase/migrations/004_enable_rls_client_users.sql` - Enables RLS on `client_users`, adds self-read-only SELECT policy scoped to `auth.uid()`

## Decisions Made
- Confirmed via re-reading the phase context that the original "circular dependency" concern (logged in STATE.md from Phase 01-foundation) was a mistaken rationale; a self-read SELECT policy does not create a circular dependency because other tables' policies only need to resolve `client_id` for the current `auth.uid()`, which this policy permits
- No write policies added, matching the plan's explicit instruction — admin/onboarding writes to `client_users` happen via the FastAPI service role client, which bypasses RLS entirely

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None for this plan directly, but note this migration must be applied to the live Supabase database as part of the DPLY-01/DPLY-02 deploy checklist (already tracked in STATE.md blockers) before it takes effect. Local file creation alone does not change database behavior until `supabase db push` (or equivalent) is run against the target project.

## Next Phase Readiness

- Schema-level fix for SEC-02 is complete and committed.
- Runtime verification (a second client JWT confirming it cannot read another client's `client_users` row) is deferred to the DPLY deploy plan, which requires a live database connection — consistent with the plan's stated scope boundary.
- No blockers introduced for subsequent Phase 5 plans (05-03 through 05-06).

---
*Phase: 05-critical-security-launch-blockers*
*Completed: 2026-07-06*

## Self-Check: PASSED

- FOUND: supabase/migrations/004_enable_rls_client_users.sql
- FOUND: 45015f3 (task commit)
