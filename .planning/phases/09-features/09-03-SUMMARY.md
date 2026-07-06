---
phase: 09-features
plan: 03
subsystem: dashboard
tags: [supabase, migration, nextjs, server-component, roi]

# Dependency graph
requires:
  - phase: 03-client-dashboard
    provides: dashboard overview page, count-cards pattern, Lead/StatusCounts types
provides:
  - "leads.first_contact_at column (migration 011) recording time-to-first-contact"
  - "updateLeadStatus stamps first_contact_at exactly once, on first move off 'new'"
  - "RoiSummary server component: this-month lead count, estimated value, avg speed-to-lead"
affects: [dashboard, roi, analytics]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Server-component-computed monthly metrics from a single leads select (no new query/endpoint)"
    - "Earliest-touch-wins timestamp stamping: read-then-conditionally-set pattern in a Server Action"

key-files:
  created:
    - supabase/migrations/011_add_first_contact_at.sql
    - apps/web/src/components/dashboard/roi-summary.tsx
  modified:
    - apps/web/src/lib/supabase/types.ts
    - apps/web/src/lib/types/dashboard.ts
    - apps/web/src/lib/actions/lead-actions.ts
    - apps/web/src/app/(dashboard)/dashboard/page.tsx

key-decisions:
  - "ESTIMATED_LEAD_VALUE hardcoded at $400/lead as a conservative placeholder, exported as a named constant and clearly labeled 'estimated' in the UI — no real per-job revenue data exists yet (billing table tracks subscription invoices, not job value)"
  - "first_contact_at stamped via read-then-write in updateLeadStatus rather than a DB trigger, keeping ROI-01 logic colocated with the existing Server Action and avoiding new migration complexity"

patterns-established:
  - "Speed-to-lead avg computed client-side (in the server component) from created_at/first_contact_at diff in minutes — no new aggregate query needed"

requirements-completed: [ROI-01, ROI-02]

# Metrics
duration: 5min
completed: 2026-07-06
---

# Phase 9 Plan 3: ROI + Speed-to-Lead Dashboard Summary

**leads.first_contact_at migration + earliest-touch stamping in updateLeadStatus, surfaced as a monthly ROI summary card (lead count, estimated value, avg speed-to-lead) on the dashboard overview**

## Performance

- **Duration:** ~5 min
- **Tasks:** 3 completed
- **Files modified:** 6 (1 created migration, 1 created component, 4 modified)

## Accomplishments
- Added `leads.first_contact_at` (migration 011) to record time-to-first-contact per lead
- `updateLeadStatus` now stamps `first_contact_at` exactly once — the first time a lead moves off `'new'` — using a read-then-conditional-write pattern so later status changes never overwrite the original timestamp
- New `RoiSummary` server component renders three mobile-responsive cards (black+gold, matching `CountCards` style): leads this month, estimated value (clearly labeled as an estimate, not actual revenue), and average speed-to-lead in minutes
- Dashboard overview page computes all three metrics from the existing leads query (no new endpoint) and renders `RoiSummary` above `CountCards`

## Task Commits

Each task was committed atomically:

1. **Task 1: Migration 011 + add first_contact_at to types** - `d3b7cf1` (feat)
2. **Task 2: Set first_contact_at on first transition off 'new'** - `b6c5cbd` (feat)
3. **Task 3: RoiSummary component + wire into overview page** - `0425716` (feat)

_No TDD tasks in this plan._

## Files Created/Modified
- `supabase/migrations/011_add_first_contact_at.sql` - Adds nullable `leads.first_contact_at timestamptz`
- `apps/web/src/lib/supabase/types.ts` - Added `first_contact_at` to leads Row/Insert/Update
- `apps/web/src/lib/types/dashboard.ts` - Added `first_contact_at: string | null` to `Lead` interface
- `apps/web/src/lib/actions/lead-actions.ts` - `updateLeadStatus` reads current `first_contact_at`, stamps it once on first move off `'new'`
- `apps/web/src/components/dashboard/roi-summary.tsx` - New `RoiSummary` component + exported `ESTIMATED_LEAD_VALUE` constant
- `apps/web/src/app/(dashboard)/dashboard/page.tsx` - Fetches `first_contact_at`, computes month-scoped ROI metrics, renders `RoiSummary`

## Decisions Made
- `ESTIMATED_LEAD_VALUE = 400` is a placeholder assumption, not derived from real client data — exported so it's a single, greppable/overridable source of truth, and the UI caption always says "not actual revenue"
- Avg speed-to-lead excludes leads with no `first_contact_at` this month rather than counting them as 0, avoiding a misleadingly fast average; shows `—` when there is no data yet

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required. Migration 011 will need to be applied to the live Supabase project as part of the standard deploy/migration process (already tracked under Phase 5 DPLY-01/02, not new to this plan).

## Next Phase Readiness
- ROI-01 and ROI-02 requirements satisfied; dashboard overview now surfaces retainer-value signal for HVAC owners
- `ESTIMATED_LEAD_VALUE` is a rough placeholder — if per-job revenue data becomes available (e.g., from a future invoicing/booking-value field), this constant should be replaced with real numbers
- No blockers for remaining Phase 9 plans

---
*Phase: 09-features*
*Completed: 2026-07-06*

## Self-Check: PASSED

All created files verified present; all task commits (d3b7cf1, b6c5cbd, 0425716) verified in git log.
