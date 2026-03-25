---
phase: 01-foundation
plan: "01"
subsystem: database
tags: [supabase, postgresql, rls, schema, migration, multi-tenancy]
dependency_graph:
  requires: []
  provides:
    - supabase/migrations/001_initial_schema.sql
    - supabase/seed.sql
  affects:
    - All subsequent phases that query Supabase tables
tech_stack:
  added: []
  patterns:
    - RLS multi-tenancy via client_users join table
    - auth.uid() → client_users → client_id isolation pattern
    - Append-only SQL migration files in supabase/migrations/
key_files:
  created:
    - supabase/migrations/001_initial_schema.sql
    - supabase/seed.sql
  modified: []
decisions:
  - "Added sms_sequences RLS policy missing from CLAUDE (1).md spec — documented in RESEARCH.md Pitfall 6; deny-all default would silently return zero rows to dashboard"
  - "client_users table has no RLS enabled — by design, it is the identity source used by all other policies"
  - "Fixed seed client UUID a0000000-0000-0000-0000-000000000001 for deterministic client_users reference"
metrics:
  duration_minutes: 2
  completed_date: "2026-03-25"
  tasks_completed: 2
  files_changed: 2
---

# Phase 1 Plan 1: Database Schema Migration Summary

**One-liner:** PostgreSQL multi-tenant schema with 6 tables, RLS enabled on 5 tables, tenant isolation via auth.uid() → client_users join pattern, and Oak Park HVAC seed data.

## What Was Built

### supabase/migrations/001_initial_schema.sql

Complete database migration for Tradeflow Phase 1, containing:

**6 Tables:**
- `public.clients` — one row per HVAC company; stores business info, service area zips, third-party IDs (GHL, CallRail, Stripe)
- `public.leads` — one row per inbound lead; status pipeline (new → contacted → booked → completed → lost)
- `public.calls` — CallRail-tracked inbound calls; linked to leads and clients
- `public.sms_sequences` — individual SMS touches in follow-up sequences; linked to leads
- `public.billing` — Stripe invoice records; linked to clients
- `public.client_users` — join table mapping `auth.users.id` → `clients.id`; the identity source for all RLS policies (no RLS on this table itself)

**5 RLS Enables** (client_users intentionally excluded):
```sql
alter table public.clients       enable row level security;
alter table public.leads         enable row level security;
alter table public.calls         enable row level security;
alter table public.sms_sequences enable row level security;
alter table public.billing       enable row level security;
```

**5 RLS Policies:**
- `clients: owner can read own record` — SELECT only via client_users subquery
- `leads: owner sees own leads` — ALL via client_id → client_users
- `calls: owner sees own calls` — ALL via client_id → client_users
- `billing: owner sees own billing` — SELECT only via client_id → client_users
- `sms_sequences: owner sees own sequences` — ALL via lead_id → leads → client_users (2-hop join)

**5 Indexes:**
```sql
create index leads_client_id_idx     on public.leads(client_id);
create index leads_status_idx        on public.leads(status);
create index leads_created_at_idx    on public.leads(created_at desc);
create index calls_client_id_idx     on public.calls(client_id);
create index sms_lead_id_idx         on public.sms_sequences(lead_id);
```

### supabase/seed.sql

Test data for RLS verification:
- **Oak Park HVAC** client with fixed UUID `a0000000-0000-0000-0000-000000000001`
- One test lead (Jane Smith, zip 60301, ac_repair, landing_page)
- Commented template for `client_users` INSERT (requires real Supabase Auth user UUID)

## Deployment Instructions

### Step 1 — Apply migration
1. Go to Supabase dashboard → SQL Editor
2. Paste and run `supabase/migrations/001_initial_schema.sql`
3. Confirm no errors

### Step 2 — Apply seed data
1. In SQL Editor, paste and run `supabase/seed.sql` (non-commented portions only)
2. Confirm client and lead rows inserted

### Step 3 — Verify RLS
```sql
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
```
Expected: clients, leads, calls, sms_sequences, billing → `rowsecurity = true`; client_users → `rowsecurity = false`

### Step 4 — Create test auth user
- Supabase dashboard → Authentication → Users → Add user
- Email: `testowner@tradeflow.test`, Password: `TestPass123!`
- Copy the user's UUID

### Step 5 — Link test user to test client
```sql
INSERT INTO public.client_users (user_id, client_id, role)
VALUES ('{AUTH_USER_UUID}', 'a0000000-0000-0000-0000-000000000001', 'owner');
```

### Step 6 — RLS cross-tenant verification (Phase 1 exit gate)
Sign in as `testowner@tradeflow.test` via Supabase JS SDK and run:
```javascript
const { data } = await supabase.from('leads').select('*')
// Should return exactly 1 lead
```
Create a second test user (NOT added to client_users) and run same query:
```javascript
// Should return [] (zero rows) — cross-tenant isolation confirmed
```

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical Functionality] Added sms_sequences RLS policy**
- **Found during:** Task 1 (documented in RESEARCH.md Pitfall 6 before execution)
- **Issue:** `CLAUDE (1).md` defines `ENABLE ROW LEVEL SECURITY` on `sms_sequences` but has no corresponding policy. RLS with no policy defaults to DENY ALL — HVAC owners could never read their SMS sequence records.
- **Fix:** Added `"sms_sequences: owner sees own sequences"` policy using a 2-hop join: `lead_id → leads.client_id → client_users`
- **Files modified:** `supabase/migrations/001_initial_schema.sql`
- **Commit:** 1531f9f

## Task 2 — Checkpoint: Human Verify

Task 2 is a `checkpoint:human-verify` for Supabase cloud deployment. Auto-approved per auto-chain configuration. The migration files are production-ready; deployment steps are documented above. The Phase 1 exit gate (cross-tenant RLS verification via JS SDK) must be completed before starting Phase 1 Plan 2.

## Known Stubs

None — this plan only creates SQL migration files. No UI stubs.

## Self-Check: PASSED

- `/Users/user/Desktop/Tradeflow/supabase/migrations/001_initial_schema.sql` — FOUND
- `/Users/user/Desktop/Tradeflow/supabase/seed.sql` — FOUND
- Commit `1531f9f` — FOUND
