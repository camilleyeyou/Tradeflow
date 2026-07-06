---
phase: 05-critical-security-launch-blockers
plan: 05
subsystem: database
tags: [typescript, supabase, postgrest, database-types, deploy-checklist]

# Dependency graph
requires:
  - phase: 05-critical-security-launch-blockers
    provides: "05-01 authorization guards on onboardClient/createClientLogin, 05-02 client_users RLS migration, 05-04 CallRail missed-call integration"
provides:
  - "Schema-accurate Database type (apps/web/src/lib/supabase/types.ts) covering all 6 tables with correct Row/Insert/Update shapes and FK Relationships metadata"
  - "Workaround-free Server Actions and settings page — no `as any` / `@ts-expect-error` left in the codebase"
  - "DEPLOY-CHECKLIST.md documenting env vars, migration order, live type-gen command, webhook config, and two E2E verification traces"
affects: [05-06, deploy, launch-readiness]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Hand-authored Supabase Database type mirrors the real `supabase gen types typescript` output shape (Row/Insert/Update/Relationships per table, empty Views/Functions/Enums/CompositeTypes via `{ [_ in never]: never }`) so it drops in as a like-for-like replacement and is diffable against the live-generated file later"
    - "FK Relationships metadata included per table so postgrest-js's select-query-parser can resolve embedded selects (e.g. `client_users` -> `clients(*)`) without a cast"

key-files:
  created:
    - .planning/phases/05-critical-security-launch-blockers/DEPLOY-CHECKLIST.md
  modified:
    - apps/web/src/lib/supabase/types.ts
    - apps/web/src/lib/actions/lead-actions.ts
    - apps/web/src/lib/actions/settings-actions.ts
    - apps/web/src/lib/actions/onboarding-actions.ts
    - apps/web/src/lib/actions/create-client-login.ts
    - apps/web/src/app/(dashboard)/dashboard/settings/page.tsx

key-decisions:
  - "Hand-authored the Database type directly from migrations 001-005 rather than waiting for live generation, since tsc can verify correctness in-repo without live credentials; the live `supabase gen types` run is deferred to 05-06 for reconciliation"
  - "Derived clients.slug at insert time in onboarding-actions.ts (same normalization as migration 002's backfill) because the column has no DB default and is NOT NULL — the real Insert type surfaced this as a genuine type error once the stub was removed, and it was a real correctness bug (the insert would have violated the NOT NULL constraint at runtime), not just a typing gap"
  - "Included empty FK Relationships arrays/entries per table so the settings page's embedded select (`client_users` -> `clients(*)`) resolves correctly under real types without reintroducing a cast"

requirements-completed: [DPLY-01, DPLY-02]

# Metrics
duration: 12min
completed: 2026-07-06
---

# Phase 05 Plan 05: Schema-Accurate Database Types + Deploy Checklist Summary

**Replaced the `Record<string, unknown>` types.ts stub with a schema-accurate Database type derived from migrations 001-005, removed every `as any`/`@ts-expect-error` workaround it had forced across five files, and wrote the operator DEPLOY-CHECKLIST.md covering env vars, migration order, live type-gen, and two end-to-end verification traces.**

## Performance

- **Duration:** ~12 min
- **Tasks:** 3 completed
- **Files modified:** 6 (1 created, 5 modified)

## Accomplishments
- `apps/web/src/lib/supabase/types.ts` now exports a real `Database` type for all 6 tables (`clients`, `leads`, `calls`, `sms_sequences`, `billing`, `client_users`) with correct column types, nullability, defaults-as-optional-Insert, and FK Relationships metadata — verified against migrations 001-005.
- All `as any` / `@ts-expect-error` type-stub workarounds removed from `lead-actions.ts`, `settings-actions.ts`, `onboarding-actions.ts`, `create-client-login.ts`, and `settings/page.tsx`. The 05-01 authorization guards in the latter two files were left untouched.
- Found and fixed a real bug surfaced by the real types: `onboardClient`'s client insert never set `slug`, which is `NOT NULL` with no DB default — would have thrown at the database level on every real onboarding attempt. Fixed by deriving the slug from `business_name` using the same normalization as migration 002's backfill.
- `.planning/phases/05-critical-security-launch-blockers/DEPLOY-CHECKLIST.md` written with env-var tables for Supabase/Vercel/Railway (including the Phase 5 additions `CALLRAIL_WEBHOOK_SECRET`, `GHL_PRIVATE_TOKEN`, `GHL_SMS_WORKFLOW_ID`, `ADMIN_EMAILS`), migration apply order 001→005, the live `supabase gen types typescript` command, CallRail/GHL webhook configuration notes, and two numbered E2E traces (lead form, missed call) with a requires-human/deploy banner.
- `npx tsc --noEmit` in `apps/web` exits 0 with the real types and no workarounds.

## Task Commits

Each task was committed atomically:

1. **Task 1: Replace the types.ts stub with schema-accurate Database types** - `7b7eb21` (feat)
2. **Task 2: Remove the as-any / ts-expect-error workarounds across the five files** - `fca693c` (fix)
3. **Task 3: Write the operator deploy + end-to-end verification checklist (DPLY-02)** - `0267d0b` (docs)

_Note: Tasks 1 and 2 were verified together via a single final `tsc --noEmit` pass, since Task 1 alone left the (now-superfluous) `@ts-expect-error` directives as "unused directive" errors until Task 2 removed them — see Issues Encountered._

## Files Created/Modified
- `apps/web/src/lib/supabase/types.ts` - Schema-accurate `Database` type for all 6 tables, hand-authored from migrations 001-005
- `apps/web/src/lib/actions/lead-actions.ts` - Removed 2x `@ts-expect-error` above `.update()` calls
- `apps/web/src/lib/actions/settings-actions.ts` - Removed `@ts-expect-error` above `.update()` call
- `apps/web/src/lib/actions/onboarding-actions.ts` - Removed 2x `as any` casts; added `slug` derivation on client insert (bug fix)
- `apps/web/src/lib/actions/create-client-login.ts` - Removed `as any` cast + eslint-disable comment on `client_users` insert
- `apps/web/src/app/(dashboard)/dashboard/settings/page.tsx` - Removed `const db = supabase as any`, queries directly with the typed `supabase` client
- `.planning/phases/05-critical-security-launch-blockers/DEPLOY-CHECKLIST.md` - New operator deploy + E2E verification checklist

## Decisions Made
- Hand-authored the Database type in the exact shape `supabase gen types typescript` produces (including empty `Views`/`Functions`/`Enums`/`CompositeTypes` via `{ [_ in never]: never }` and per-table `Relationships` arrays) so it is a drop-in, diffable stand-in for the live-generated file rather than a simplified approximation.
- Fixed the missing `slug` on client insert as a Rule 1 (auto-fix bug) deviation rather than reintroducing a cast to silence the error, since the real column constraint (`NOT NULL`, no default) made this a genuine runtime bug, not just a typing mismatch.
- Left the 05-01 authorization guards (`getUser()` + `isAdmin()` checks) in `onboarding-actions.ts` and `create-client-login.ts` completely untouched, per the plan's explicit instruction.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] `onboardClient` client insert missing required `slug` column**
- **Found during:** Task 2 (removing `as any` from `onboarding-actions.ts`)
- **Issue:** The client insert payload never included `slug`, but migration 002 made `clients.slug` `NOT NULL` with no DB default (it only backfilled pre-existing rows at migration time). Every new admin-onboarded client would have failed the insert with a NOT NULL violation at the database level — a real, currently-live bug, previously masked by the `as any` cast on the write path.
- **Fix:** Derived `slug` in `onboardClient` from `business_name` using the identical normalization as migration 002's backfill (lowercase, replace non-alphanumeric runs with hyphens, trim leading/trailing hyphens) and included it in the insert payload.
- **Files modified:** `apps/web/src/lib/actions/onboarding-actions.ts`
- **Verification:** `npx tsc --noEmit` passes; insert payload now satisfies the real `Insert` type's required `slug: string` field.
- **Committed in:** `fca693c` (part of Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 — bug)
**Impact on plan:** Necessary for correctness — this was a real, currently-live data-integrity bug the stub types had been masking. No scope creep; no architectural change.

## Issues Encountered
- Task 1's own `<verify>` block requires `npx tsc --noEmit` to exit 0 immediately after replacing `types.ts`, but doing so alone caused the now-correctly-typed queries to make the five files' `@ts-expect-error` comments "unused" (`TS2578`), which is itself a compile error. This is an inherent ordering artifact of splitting the type replacement (Task 1) from the workaround removal (Task 2) into separate tasks — the real types make the `@ts-expect-error` directives statically detectable as no-longer-needed the moment they're introduced. Resolved by treating Tasks 1 and 2 as executed back-to-back with a single final `tsc --noEmit` verification covering both, since that is the only way both tasks' acceptance criteria can be jointly satisfied. No code or scope changes were needed to resolve this — it was purely a task-sequencing artifact.

## User Setup Required
None for this plan's in-repo scope. DEPLOY-CHECKLIST.md documents the environment variables and live steps (Supabase live type generation, CallRail/GHL webhook registration, two E2E traces) that the operator must perform manually as part of plan 05-06 (requires-human/deploy) — see [DEPLOY-CHECKLIST.md](./DEPLOY-CHECKLIST.md).

## Next Phase Readiness
DPLY-01's in-repo portion (real types, workaround-free writes, tsc green) and DPLY-02's documentation are both complete. Plan 05-06 can now proceed with the live Supabase type generation, populating Vercel/Railway env vars, registering the CallRail/GHL webhooks, and executing the two end-to-end traces against the deployed system — all clearly scoped in DEPLOY-CHECKLIST.md as requires-human/deploy steps. No blockers identified.

---
*Phase: 05-critical-security-launch-blockers*
*Completed: 2026-07-06*

## Self-Check: PASSED

All created/modified files confirmed present on disk (types.ts, lead-actions.ts, settings-actions.ts, onboarding-actions.ts, create-client-login.ts, settings/page.tsx, DEPLOY-CHECKLIST.md, this SUMMARY.md). All three task commit hashes (`7b7eb21`, `fca693c`, `0267d0b`) confirmed present in `git log`. `npx tsc --noEmit` confirmed exiting 0 in `apps/web`.
