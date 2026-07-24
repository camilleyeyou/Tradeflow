---
phase: quick-260723-ph8
plan: 01
subsystem: dashboard
tags: [supabase, postgres, zod, react-hook-form, next-server-actions, ghl, timezone, seed-data]

requires: []
provides:
  - "leads.job_value_cents + clients.timezone (migration 015, idempotent)"
  - "Standalone supabase/seed_demo.sql — re-runnable, is_active=false demo client with ~24 leads / ~14 calls / 4 sms rows, all fake 555 data"
  - "updateLeadJobValue server action + JobValueEditor component for per-lead reported job value"
  - "Reported + estimated value split on the dashboard ROI card and monthly report email (replacing the pure $400/lead placeholder)"
  - "lib/timezones.ts curated US timezone list + formatClientTime(iso, timeZone) with Chicago fallback"
  - "Timezone select in settings + admin onboarding forms; threaded into GHL sub-account creation and every dashboard timestamp"
affects: [dashboard-leads, dashboard-calls, dashboard-settings, admin-onboarding, ghl-integration, monthly-reports, sales-demos]

tech-stack:
  added: []
  patterns:
    - "Reported-vs-estimated value split: only completed leads WITHOUT a reported job_value_cents fall back to ESTIMATED_LEAD_VALUE, applied identically in the dashboard ROI card and the monthly cron email"
    - "IANA timezone fallback formatter (formatClientTime) — try/catch around toLocaleString to gracefully degrade an invalid/missing per-client timezone to America/Chicago"
    - "Dollar-input/cents-storage editor component (JobValueEditor, mirrors NotesEditor's inline-edit shape) — UI works in dollars, server action and DB store cents"
    - "Standalone hand-run seed file (seed_demo.sql) kept separate from migrations/ — delete-by-slug then re-insert for idempotent demo data with fixed UUIDs so dependent rows (calls, sms_sequences) can reference specific leads"

key-files:
  created:
    - supabase/migrations/015_job_value_and_timezone.sql
    - supabase/seed_demo.sql
    - apps/web/src/components/dashboard/job-value-editor.tsx
    - apps/web/src/lib/timezones.ts
  modified:
    - apps/web/src/lib/supabase/types.ts
    - apps/web/src/lib/types/dashboard.ts
    - apps/web/src/lib/actions/lead-actions.ts
    - apps/web/src/components/dashboard/roi-summary.tsx
    - apps/web/src/app/(dashboard)/dashboard/page.tsx
    - apps/web/src/app/api/cron/monthly-reports/route.ts
    - apps/web/src/components/dashboard/leads-table.tsx
    - apps/web/src/app/(dashboard)/dashboard/leads/[id]/page.tsx
    - apps/web/src/lib/utils/format.ts
    - apps/web/src/lib/validations/settings.ts
    - apps/web/src/lib/validations/onboarding.ts
    - apps/web/src/lib/actions/settings-actions.ts
    - apps/web/src/components/dashboard/settings-form.tsx
    - apps/web/src/app/(admin)/admin/clients/new/page.tsx
    - apps/web/src/lib/actions/onboarding-actions.ts
    - apps/web/src/lib/ghl.ts
    - apps/web/src/app/(dashboard)/dashboard/leads/page.tsx
    - apps/web/src/app/(dashboard)/dashboard/calls/page.tsx
    - apps/web/src/components/dashboard/recent-leads.tsx
    - apps/web/src/components/dashboard/calls-table.tsx
    - apps/web/src/components/dashboard/sms-inbox.tsx

key-decisions:
  - "ESTIMATED_LEAD_VALUE now applies only to completed leads lacking a reported job_value_cents, not to every lead in the month — both the ROI card and the monthly report were changed from `totalLeads * ESTIMATED_LEAD_VALUE` to a completed-only reported/estimated split"
  - "JobValueEditor renders its own 'Job value' label internally (not the parent page grid) so the same component serves both the prominent (completed) and compact (other statuses) cases from one contract"
  - "settings-form.tsx casts client.timezone (plain string, from the hand-authored types.ts stub) to SettingsFormValues['timezone'] for defaultValues — same category of workaround as the existing 'supabase as any cast' entries in STATE.md, resolves automatically once real `supabase gen types` runs post-deploy"
  - "Demo seed's 8 fixed-id leads are spread 2 each across new/contacted/booked/completed so the calls and sms_sequences rows below have a realistic, varied set of leads to reference"

requirements-completed: [DEMO-SEED, JOB-VALUE, CLIENT-TZ]

duration: ~10min
completed: 2026-07-23
---

# Quick Task 260723-ph8: Demo client seed + real job-value tracking + per-client timezone Summary

**Idempotent migration 015 (job_value_cents + timezone) backing three shipped features: a standalone fake-data demo client for sales calls, real reported-vs-estimated job value on the dashboard/monthly report, and per-client IANA timezone support threaded through every dashboard timestamp and the GHL sub-account create call.**

## Performance

- **Duration:** ~10 min (task commits afb5fec → 253a309)
- **Completed:** 2026-07-23
- **Tasks:** 3
- **Files modified:** 25 (4 created, 21 modified)

## Accomplishments

- `supabase/migrations/015_job_value_and_timezone.sql` adds `leads.job_value_cents` (DO-block-guarded `>= 0` CHECK) and `clients.timezone` (default `America/Chicago`), plus the matching column-scoped UPDATE grant — fully idempotent
- `supabase/seed_demo.sql` is a standalone, re-runnable (delete-by-slug then insert) demo client (`is_active = false`, unmistakably fake 555 phone numbers) with 24 leads, 14 calls, and 4 sms_sequences rows spread realistically over the last 30 days
- Owners can now record a real per-lead job value (`JobValueEditor`, dollars in the UI / cents in the DB, capped at $1,000,000); the dashboard ROI card and the monthly report email both show an honest reported + estimated split instead of the flat $400/lead placeholder
- `lib/timezones.ts` + `formatClientTime()` (with an America/Chicago fallback on invalid IANA zones) back a timezone select in both the settings and admin-onboarding forms; the client's timezone is now written to `clients.timezone`, passed into GHL sub-account creation, and used to render every lead/call/sms timestamp across the dashboard

## Task Commits

1. **Task 1: Migration 015, type stubs, and standalone demo seed** - `afb5fec` (feat)
2. **Task 2: Real job-value tracking (action, editor, ROI card, monthly report, leads table)** - `7391b30` (feat)
3. **Task 3: Per-client timezone (formatter, shared list, forms/validation, ghl, thread through all surfaces)** - `253a309` (feat)

**Plan metadata:** (this commit)

## Files Created/Modified

- `supabase/migrations/015_job_value_and_timezone.sql` - New: idempotent `job_value_cents` + `timezone` columns and grant
- `supabase/seed_demo.sql` - New: standalone hand-run demo data seed (not a migration)
- `apps/web/src/lib/supabase/types.ts` - Database type stub gains `job_value_cents` (leads) and `timezone` (clients)
- `apps/web/src/lib/types/dashboard.ts` - `Lead.job_value_cents` and `Client.timezone` added
- `apps/web/src/lib/actions/lead-actions.ts` - New `updateLeadJobValue(leadId, cents)` — validates range, clears on null, revalidates 3 paths
- `apps/web/src/components/dashboard/job-value-editor.tsx` - New: dollar-input client component, prominent styling when `status === 'completed'`
- `apps/web/src/components/dashboard/roi-summary.tsx` - `RoiSummaryProps` now takes `reportedValueDollars` + `estimatedValueDollars`, renders an honest combined/labeled subtitle
- `apps/web/src/app/(dashboard)/dashboard/page.tsx` - Computes the completed-leads reported/estimated split; also fetches and threads the client `timeZone` into `RecentLeads`
- `apps/web/src/app/api/cron/monthly-reports/route.ts` - Same reported/estimated split computed per client; report row labeled accordingly
- `apps/web/src/components/dashboard/leads-table.tsx` - New `Value` column (`hidden lg:table-cell`); `timeZone` prop threaded into `formatClientTime`
- `apps/web/src/app/(dashboard)/dashboard/leads/[id]/page.tsx` - Renders `JobValueEditor`; fetches `timeZone` and passes it to `formatClientTime` + `SmsInbox`
- `apps/web/src/lib/utils/format.ts` - New `formatClientTime(iso, timeZone)` with try/catch Chicago fallback; `formatChicagoTime` now a deprecated thin wrapper
- `apps/web/src/lib/validations/settings.ts` / `onboarding.ts` - Both schemas gain `timezone: z.enum(TIMEZONE_VALUES)`
- `apps/web/src/lib/actions/settings-actions.ts` - `updateClientSettings` formData type widened with `timezone: string`
- `apps/web/src/components/dashboard/settings-form.tsx` - New timezone `<select>` in the Business Information card
- `apps/web/src/app/(admin)/admin/clients/new/page.tsx` - New timezone `<select>`, defaults to `America/Chicago`
- `apps/web/src/lib/actions/onboarding-actions.ts` - Writes `clients.timezone` and passes it into `createSubAccount`
- `apps/web/src/lib/ghl.ts` - `CreateSubAccountInput.timezone` replaces the hardcoded `'America/Chicago'` in the `/locations/` POST body
- `apps/web/src/app/(dashboard)/dashboard/leads/page.tsx` / `calls/page.tsx` - Fetch client timezone via `client_users -> clients(timezone)` embed, pass to table components
- `apps/web/src/components/dashboard/recent-leads.tsx` / `calls-table.tsx` / `sms-inbox.tsx` - Accept a `timeZone` prop, use `formatClientTime` instead of the hardcoded Chicago formatter

## Decisions Made

- `ESTIMATED_LEAD_VALUE` now applies only to completed leads without a reported `job_value_cents`, not to every lead in the month, in both the dashboard and the monthly report — this is the crux of the "honest reported + estimated" requirement.
- `JobValueEditor` owns its own "Job value" label (rather than relying on the parent detail-page grid label) so a single component correctly serves both the prominent (completed) and compact (other statuses) presentation without duplicating markup at each call site.
- `settings-form.tsx` casts the hand-authored `Client.timezone: string` to `SettingsFormValues['timezone']` (the zod-enum-derived literal union) for `defaultValues` — the same category of workaround already tracked in STATE.md for this stub-types situation; resolves automatically once real `supabase gen types` runs post-deploy.
- Demo seed's 8 fixed-id leads are spread 2 per status across new/contacted/booked/completed so the calls and sms_sequences rows have a varied, realistic set of leads to reference by id.

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

- This worktree had no `apps/web/node_modules` (gitignored, not copied on worktree creation). Symlinking to the main checkout's `node_modules` let `tsc --noEmit` succeed but `next build --turbopack` failed with "Symlink node_modules is invalid, it points out of the filesystem root" (Turbopack rejects a symlink resolving outside the worktree root). Resolved by replacing the symlink with a real `cp -R` copy of `node_modules` (still gitignored, nothing committed) — both `tsc --noEmit` and `npm run build` then passed cleanly.

## User Setup Required

**External services require manual configuration before these features are fully live:**
- Apply `supabase/migrations/015_job_value_and_timezone.sql` to the Supabase project (locked deploy-order dependency for both the job-value and timezone features, and for `seed_demo.sql`)
- After migration 015 is applied, run `supabase/seed_demo.sql` once in the Supabase SQL editor to create the demo client, then use the admin "create login" action to provision a demo dashboard login for sales calls
- No new environment variables are required for either the job-value or timezone features

## Next Phase Readiness

Both job-value tracking and per-client timezone support are additive and backward-compatible (nullable/defaulted columns, deprecated-but-functional `formatChicagoTime` wrapper). The demo seed is fully isolated (`is_active = false`) and cannot affect any real client's data, landing pages, sitemap, or monthly reports. No blockers for future work.

---
*Quick task: 260723-ph8*
*Completed: 2026-07-23*

## Self-Check: PASSED

All 25 created/modified files listed above verified present on disk; all 3 task commit hashes (`afb5fec`, `7391b30`, `253a309`) verified present in git log.
