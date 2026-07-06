---
phase: 09-features
plan: 05
subsystem: ai
tags: [anthropic, claude, lead-scoring, dashboard, supabase, nextjs]

# Dependency graph
requires:
  - phase: 09-features (09-02, 09-03, 09-04)
    provides: instrumentation pattern for optional/feature-flagged env vars, existing leads dashboard + leads-table with View link
provides:
  - Migration 012 adding leads.urgency_score (1-10, checked) + urgency_reason
  - apps/web/src/lib/scoring.ts — scoreLeadUrgency() calling claude-fable-5 via @anthropic-ai/sdk, resilient (timeout, graceful skip, defensive JSON parse)
  - Background AI urgency scoring wired into lead-submit's after() block
  - Dashboard leads list sorted hot-first (urgency_score desc, nulls last, then created_at desc) with a "Hot" badge for scores >= 8
affects: [dashboard, leads, ai-scoring]

# Tech tracking
tech-stack:
  added: ["@anthropic-ai/sdk"]
  patterns:
    - "Feature-flagged external AI call: absence of ANTHROPIC_API_KEY short-circuits scoring with no error, no throw"
    - "Background scoring runs as its own independent try/catch inside the existing after() block, isolated from GHL/Resend blocks"

key-files:
  created:
    - supabase/migrations/012_add_urgency.sql
    - apps/web/src/lib/scoring.ts
  modified:
    - apps/web/package.json
    - apps/web/.env.example
    - apps/web/src/lib/supabase/types.ts
    - apps/web/src/lib/types/dashboard.ts
    - apps/web/src/app/api/leads/submit/route.ts
    - apps/web/src/app/(dashboard)/dashboard/leads/page.tsx
    - apps/web/src/components/dashboard/leads-table.tsx

key-decisions:
  - "Scoring runs as its own try/catch block inside after(), placed after the GHL and Resend blocks, so a failure in scoring can never affect either of those or the homeowner's already-returned 200"
  - "urgency_score/urgency_reason are both nullable with no DB default — null means 'not yet scored' or 'scoring skipped', distinguished from a real low score of 1"
  - "Dashboard sort uses two order() calls (urgency_score desc nullsFirst:false, then created_at desc) rather than a computed sort key, keeping the existing RLS-scoped query pattern unchanged"

patterns-established:
  - "Optional AI feature keyed off a single env var (ANTHROPIC_API_KEY) that fully disables the feature when unset, matching the Sentry/observability pattern from 09-02"

requirements-completed: [AI-01, AI-02]

# Metrics
duration: 12min
completed: 2026-07-06
---

# Phase 9 Plan 5: Claude-API Lead Urgency Scoring Summary

**Claude (claude-fable-5) scores inbound form leads 1-10 for urgency in the background via a new scoring.ts module, and the dashboard leads list now sorts hot leads to the top with a destructive "Hot" badge.**

## Performance

- **Duration:** 12 min
- **Started:** 2026-07-06T17:22:00Z
- **Completed:** 2026-07-06T17:34:45Z
- **Tasks:** 3
- **Files modified:** 8

## Accomplishments
- Migration 012 adds `leads.urgency_score` (int, 1-10 check constraint) and `leads.urgency_reason` (text), both nullable
- `apps/web/src/lib/scoring.ts` implements `scoreLeadUrgency()`: calls `claude-fable-5` via `@anthropic-ai/sdk` with an 8s timeout, a strict-JSON system prompt, and defensive parsing (regex-extracted JSON object, clamped score, truncated reason); returns `null` on missing key, timeout, or any parse/API error — never throws
- Lead-submit's existing `after()` background block now scores every new form lead in its own independent try/catch and writes `urgency_score`/`urgency_reason` back onto the lead row, entirely after the homeowner's 200 response
- Dashboard leads query now orders by `urgency_score` descending with `nullsFirst: false`, then `created_at` descending — hot, unscored, and older leads sort correctly
- `leads-table.tsx` renders a `destructive`-variant "Hot" badge next to the homeowner name when `urgency_score >= 8`, with the AI's `urgency_reason` as a tooltip; the existing 09-04 View link and all columns are preserved

## Task Commits

Each task was committed atomically:

1. **Task 1: Migration 012 + urgency fields in types + install SDK + env** - `b86852c` (feat)
2. **Task 2: Anthropic scoring module + wire into lead-submit after()** - `1da7a47` (feat)
3. **Task 3: Sort hot leads first + Hot badge in the leads list** - `17d9d24` (feat)

_No TDD tasks in this plan — all `type="auto"`._

## Files Created/Modified
- `supabase/migrations/012_add_urgency.sql` - Adds urgency_score (1-10 checked) + urgency_reason columns
- `apps/web/src/lib/scoring.ts` - `scoreLeadUrgency()` — resilient claude-fable-5 call
- `apps/web/package.json` / `package-lock.json` - Adds `@anthropic-ai/sdk` dependency
- `apps/web/.env.example` - Documents optional `ANTHROPIC_API_KEY`
- `apps/web/src/lib/supabase/types.ts` - Adds urgency fields to leads Row/Insert/Update
- `apps/web/src/lib/types/dashboard.ts` - Adds urgency fields to the `Lead` interface
- `apps/web/src/app/api/leads/submit/route.ts` - Invokes `scoreLeadUrgency` inside `after()`, updates the lead row
- `apps/web/src/app/(dashboard)/dashboard/leads/page.tsx` - Orders leads hot-first, nulls last
- `apps/web/src/components/dashboard/leads-table.tsx` - Renders the "Hot" badge

## Decisions Made
- Scoring block placed as a third, independent try/catch inside `after()` (after GHL and Resend) so a scoring failure can never cascade into either of those paths or into the already-sent 200 response
- Kept both new columns nullable with no default, so "not yet scored" (null) is distinguishable from a genuine score of 1
- Used two chained `.order()` calls on the Supabase query instead of a client-side sort, keeping the existing RLS-scoped server-component query pattern intact

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

**External service requires manual configuration.** Set `ANTHROPIC_API_KEY` in the Vercel project environment (and `.env.local` for local testing) to enable lead urgency scoring. Until it is set, scoring is a complete no-op — leads are still captured normally and the dashboard simply shows no Hot badges / all-null urgency sort order.

## Next Phase Readiness
- AI-01 and AI-02 are complete; this was the final plan (5 of 5) in Phase 9 — Features.
- `npx tsc --noEmit` and `npm run build` both pass cleanly.
- No blockers. Live deployment still needs `ANTHROPIC_API_KEY` populated in Vercel to activate scoring (tracked under existing DPLY prerequisites in STATE.md).

---
*Phase: 09-features*
*Completed: 2026-07-06*

## Self-Check: PASSED

All created/modified files verified present; all task commit hashes (b86852c, 1da7a47, 17d9d24) verified present in git log.
