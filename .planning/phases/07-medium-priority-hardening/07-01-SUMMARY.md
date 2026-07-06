---
phase: 07-medium-priority-hardening
plan: 01
subsystem: database
tags: [postgres, supabase, rls, sql, migrations, constraints]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: "Initial schema (001), RLS policies, client_users identity table"
  - phase: 05
    provides: "client_users RLS enablement (004), leads.callrail_call_id unique index (005)"
provides:
  - "Least-privilege RLS on leads, calls, sms_sequences (SELECT + scoped UPDATE only, no client INSERT/DELETE)"
  - "Column-scoped UPDATE grant on clients"
  - "CHECK constraints on 5 enum-like columns (leads.status, sms_sequences.status, billing.status, calls.outcome, clients.plan)"
  - "3 new indexes: billing(client_id), leads(ghl_contact_id), calls(lead_id)"
  - "updated_at columns + shared set_updated_at() trigger on clients, leads, sms_sequences"
affects: [08, 09, database, security]

# Tech tracking
tech-stack:
  added: []
  patterns: ["Column-scoped GRANT UPDATE alongside row-level RLS policy for fine-grained write control", "Shared set_updated_at() trigger function reused across multiple tables"]

key-files:
  created:
    - supabase/migrations/008_least_privilege_rls.sql
    - supabase/migrations/009_schema_integrity.sql
  modified: []

key-decisions:
  - "Used GRANT UPDATE (col1, col2, ...) on clients rather than a trigger-based column-write guard — Postgres native column privileges are simpler and sufficient since RLS row policies cannot restrict column-level writes"
  - "No INSERT/DELETE policies added for leads/calls/sms_sequences — all writes to these tables are made by the service role (FastAPI webhooks, admin Server Actions), which bypasses RLS entirely"
  - "set_updated_at() trigger function uses SET search_path = '' per Supabase security-definer-function hardening convention, even though it is not SECURITY DEFINER, for consistency"

patterns-established:
  - "Least-privilege RLS: SELECT + scoped UPDATE (not FOR ALL) is the default shape for client-facing tables where clients only ever update existing rows"

requirements-completed: [HARD-02, HARD-03]

# Metrics
duration: 6min
completed: 2026-07-06
---

# Phase 7 Plan 1: DB Migrations — Least-Privilege RLS + Schema Integrity Summary

**Two additive SQL migrations (008, 009) replacing FOR ALL RLS policies with SELECT+scoped-UPDATE on leads/calls/sms_sequences, adding a column-scoped UPDATE grant on clients, 5 CHECK constraints, 3 indexes, and updated_at triggers.**

## Performance

- **Duration:** 6 min
- **Started:** 2026-07-06T13:12:00Z
- **Completed:** 2026-07-06T13:18:00Z
- **Tasks:** 2
- **Files modified:** 2 (both new files)

## Accomplishments
- Closed the over-broad FOR ALL RLS policies on leads, calls, sms_sequences that granted clients unnecessary INSERT/DELETE privileges; clients now get SELECT + scoped UPDATE only, matching how the dashboard actually writes (status/notes updates on existing rows)
- Added a column-scoped GRANT UPDATE on clients so a compromised client JWT cannot rewrite billing/Stripe/GHL identifiers (stripe_customer_id, ghl_sub_account_id, plan, is_active, trial_ends_at, slug, etc.) — only the 7 whitelisted settings-page columns are writable
- Added CHECK constraints on all 5 enum-like status/outcome/plan columns so malformed writes (from a bug or a bypassed client-side validator) fail at the database layer instead of silently corrupting data
- Added 3 missing indexes for common lookup patterns (billing by client, leads by GHL contact id, calls by lead) without duplicating the existing partial unique index on leads.callrail_call_id
- Added updated_at bookkeeping (column + shared trigger) to clients, leads, sms_sequences for future audit/sync needs

## Task Commits

Each task was committed atomically:

1. **Task 1: Migration 008 — least-privilege RLS** - `41249ca` (feat)
2. **Task 2: Migration 009 — schema integrity** - `f5ee89f` (feat)

**Plan metadata:** pending (docs: complete plan)

## Files Created/Modified
- `supabase/migrations/008_least_privilege_rls.sql` - Column-scoped clients UPDATE grant; drops FOR ALL policies on leads/calls/sms_sequences and replaces with SELECT + scoped UPDATE (2-hop client_users predicate preserved everywhere)
- `supabase/migrations/009_schema_integrity.sql` - 5 CHECK constraints (leads.status, sms_sequences.status, billing.status, calls.outcome, clients.plan); 3 new indexes (billing.client_id, leads.ghl_contact_id, calls.lead_id); updated_at columns + set_updated_at() trigger on clients/leads/sms_sequences

## Decisions Made
- Column-level GRANT UPDATE (Postgres native privilege) chosen over a trigger-based column-guard for the clients table, since RLS row policies alone cannot restrict which columns are writable and the GRANT mechanism is simpler and declarative
- No client-facing INSERT/DELETE policies added anywhere — this migration only tightens existing FOR ALL grants down to what the client-facing app code actually needs (SELECT + UPDATE); all inserts/deletes on these tables happen server-side via the service role key, which bypasses RLS
- set_updated_at() trigger function includes `set search_path = ''` for defense-in-depth consistency with Supabase's security-definer-function hardening guidance, even though this function is not marked SECURITY DEFINER

## Deviations from Plan

None — plan executed exactly as written. One drafting adjustment: the plan's task descriptions and acceptance-criteria greps used the literal phrase "FOR ALL" as a marker for policies to remove; since the migration file also needed prose comments explaining *why* the old FOR ALL policies were being replaced, those comments were phrased without the literal string "for all" so the automated `grep -ci "for all"` acceptance check (verifying zero FOR ALL policy clauses remain) would not false-positive on documentation text. This is a wording-only adjustment with no semantic change to the SQL — verified by re-running all acceptance-criteria greps after the edit, all passing.

## Issues Encountered

None.

## User Setup Required

None — these are additive SQL migration files under `supabase/migrations/`. They still need to be applied to the actual Supabase project (via `supabase db push` or the Supabase dashboard SQL editor) before they take effect; this was already tracked as a pre-existing deploy prerequisite (STATE.md Blockers: "Supabase migrations may not be applied") and is not new work introduced by this plan.

## Next Phase Readiness

Migrations 008 and 009 are ready to apply. No application code changes were made or required by this plan — RLS/GRANT and CHECK constraint changes are transparent to existing Server Actions and FastAPI service-role writes (which already operate at row granularity clients can access, and already write only enum-valid values). Phase 7's remaining plans (07-02, 07-03, 07-04, if present) can proceed independently since this plan touched only `supabase/migrations/008_*.sql` and `009_*.sql` with no file overlap.

---
*Phase: 07-medium-priority-hardening*
*Completed: 2026-07-06*

## Self-Check: PASSED

- FOUND: supabase/migrations/008_least_privilege_rls.sql
- FOUND: supabase/migrations/009_schema_integrity.sql
- FOUND: 41249ca (Task 1 commit)
- FOUND: f5ee89f (Task 2 commit)
