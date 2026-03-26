---
phase: 04-operations
plan: "03"
subsystem: admin-onboarding
tags: [admin, onboarding, ghl, supabase-admin, client-detail, react-hook-form]
dependency_graph:
  requires: [04-01]
  provides: [client-onboarding-form, ghl-sub-account-provisioning, client-detail-page]
  affects: [admin-panel, ghl-integration]
tech_stack:
  added: []
  patterns: [supabase-as-any-for-write-ops, zod-rhf-resolver, ghl-agency-api, force-dynamic-admin]
key_files:
  created:
    - apps/web/src/lib/validations/onboarding.ts
    - apps/web/src/lib/actions/onboarding-actions.ts
    - apps/web/src/app/(admin)/clients/new/page.tsx
    - apps/web/src/app/(admin)/clients/[id]/page.tsx
  modified:
    - apps/web/src/lib/ghl.ts
    - apps/web/.env.example
decisions:
  - "supabase as any cast required for insert/update operations — types.ts stub maps Record<string,unknown> Insert to never in Postgres builder write paths; read operations (select) work without cast"
  - "state field uses z.string().min(1) (no .default) to avoid OnboardingFormValues input/output type mismatch with react-hook-form Resolver; default IL set in form defaultValues instead"
  - "@ts-expect-error directives removed from admin createAdminClient queries — types.ts stub makes them unused (no error to suppress on read ops); write ops use as any cast instead"
metrics:
  duration_minutes: 20
  completed_date: "2026-03-26"
  tasks_completed: 2
  files_created: 4
  files_modified: 2
---

# Phase 4 Plan 3: Client Onboarding and Detail Pages Summary

**One-liner:** Client onboarding form with GHL Agency API sub-account provisioning using react-hook-form + Zod, plus read-only client detail page showing leads and calls.

## What Was Built

### Task 1: Onboarding schema, GHL createSubAccount, Server Action
- **`apps/web/src/lib/validations/onboarding.ts`** — Zod schema with all D-53 fields: business_name, owner_name, email, phone, city, state (required, defaults to IL in form), service_area_zips, plan enum (starter/growth/premium)
- **`apps/web/src/lib/ghl.ts`** — Extended with `createSubAccount()` function using GHL_AGENCY_API_KEY and `/locations/` endpoint; handles both top-level `id` and nested `location.id` in response
- **`apps/web/src/lib/actions/onboarding-actions.ts`** — Server Action `onboardClient()`: inserts client record, provisions GHL sub-account with idempotency guard (skips if ghl_sub_account_id already set), stores locationId, redirects to detail page on success; GHL failure is non-blocking
- **`apps/web/.env.example`** — Added GHL_AGENCY_API_KEY comment with source instructions

### Task 2: Onboarding form page and client detail page
- **`apps/web/src/app/(admin)/clients/new/page.tsx`** — Client Component using react-hook-form + zodResolver; renders all D-53 fields; state defaults to IL; submit button disabled during pending state to prevent double-submit; calls onboardClient Server Action
- **`apps/web/src/app/(admin)/clients/[id]/page.tsx`** — Server Component with `export const dynamic = 'force-dynamic'`; fetches client, leads (last 20), calls (last 20) via createAdminClient; shows GHL sub-account link or "Not provisioned" warning; Client ID displayed for manual auth user linking; read-only (no edit forms)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed unused @ts-expect-error directives from admin queries**
- **Found during:** Task 2 build verification
- **Issue:** Plan specified `@ts-expect-error` on Supabase queries in admin files, but createAdminClient returns an `any`-typed client for read operations — the directive was unused and caused compile errors
- **Fix:** Removed `@ts-expect-error` from all read operations (`select()`) in both onboarding-actions.ts and [id]/page.tsx
- **Files modified:** `apps/web/src/lib/actions/onboarding-actions.ts`, `apps/web/src/app/(admin)/clients/[id]/page.tsx`
- **Commit:** a79c250

**2. [Rule 1 - Bug] Used `supabase as any` cast for write operations (insert/update)**
- **Found during:** Task 2 build verification
- **Issue:** `Record<string, unknown>` as Insert type in types.ts stub causes the Postgres builder to resolve insert/update value types as `never`; this only affects write operations, not reads
- **Fix:** Cast supabase client to `any` specifically for `.insert()` and `.update()` calls in onboarding-actions.ts
- **Files modified:** `apps/web/src/lib/actions/onboarding-actions.ts`
- **Commit:** a79c250

**3. [Rule 1 - Bug] Removed .default('IL') from state schema field**
- **Found during:** Task 2 build verification
- **Issue:** `z.string().default('IL')` makes the Zod input type `state?: string | undefined` which conflicts with react-hook-form `Resolver<OnboardingFormValues>` expecting `state: string` (non-optional)
- **Fix:** Changed to `z.string().min(1, 'State is required')` without `.default()`; the IL default is set in the form's `defaultValues` object instead
- **Files modified:** `apps/web/src/lib/validations/onboarding.ts`
- **Commit:** a79c250

## Commits

| Task | Hash | Message |
|------|------|---------|
| Task 1 | 1fc4485 | feat(04-03): add onboarding schema, GHL createSubAccount, and Server Action |
| Task 2 | a79c250 | feat(04-03): build onboarding form page and client detail page |

## Known Stubs

None — all form fields wire to the database, GHL integration is live (with null fallback if GHL_AGENCY_API_KEY missing), and the detail page renders real data from Supabase.

## Self-Check: PASSED
