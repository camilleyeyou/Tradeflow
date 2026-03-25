---
phase: 02-lead-pipeline
plan: "03"
subsystem: lead-submit-api
tags: [api, supabase, ghl, resend, idempotency, after]
dependency_graph:
  requires:
    - 02-01 (leadSchema from validations/lead.ts, GHL client from lib/ghl.ts)
  provides:
    - POST /api/leads/submit Route Handler
    - Lead insert with service role key (bypasses RLS)
    - GHL contact creation + workflow enrollment in after()
    - sms_sequences initial record on workflow trigger
    - Resend owner email notification in after()
  affects:
    - 02-04 (landing page form calls this endpoint)
    - 02-05 (CallRail missed-call handler follows same Supabase insert pattern)
tech_stack:
  added:
    - next/server after() (background tasks after 200 response)
  patterns:
    - after() for decoupled post-response side effects (GHL + Resend)
    - Inline createClient with SUPABASE_SERVICE_ROLE_KEY (not admin.ts — restricted to (admin)/ group)
    - .maybeSingle() for idempotency check
    - Error catch per integration (GHL/Resend) — never fails the primary response
key_files:
  created:
    - apps/web/src/app/api/leads/submit/route.ts
  modified:
    - apps/web/src/lib/validations/lead.ts (Zod v4 errorMap -> error fix)
decisions:
  - Used inline createClient instead of createAdminClient() per note in admin.ts (restricted to (admin)/ route group)
  - GHL and Resend calls placed inside after() per D-13 — 200 returned before external calls
  - Two separate try/catch blocks in after() — GHL and Resend failures are independent
  - GHL contact lookup before creation for idempotency per D-14
metrics:
  duration: 4 minutes
  completed: "2026-03-25T18:29:25Z"
  tasks_completed: 1
  files_changed: 2
---

# Phase 02 Plan 03: Lead Submit Route Handler Summary

**One-liner:** Next.js Route Handler at `/api/leads/submit` that validates with Zod, inserts to Supabase, and triggers GHL contact creation + SMS workflow + Resend owner email asynchronously via `after()`.

## What Was Built

A single `POST /api/leads/submit` Route Handler that is the core backend entry point for every form submission in the lead pipeline. The handler:

1. Validates request body with `leadSchema.safeParse()` — returns 400 on failure
2. Creates a Supabase client with service role key inside the handler (RLS bypass for lead writes)
3. Checks for duplicate submissions (same `phone` + `client_id` within 5 minutes) — returns existing `lead_id` on match
4. Inserts the lead record with `source='landing_page'`, `status='new'`
5. Returns `{ success: true, lead_id }` immediately (200)
6. In `after()` background task:
   - Fetches client row to get `ghl_sub_account_id`
   - Looks up existing GHL contact by phone before creating (idempotency)
   - Creates GHL contact if none found, stores `ghl_contact_id` on lead
   - Triggers SMS workflow via `addContactToWorkflow`, writes `sms_sequences` record (touch_number=1, status=pending)
   - Fetches client email and sends Resend notification with lead details

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed Zod v4 errorMap property name in lead.ts**
- **Found during:** Task 1 (TypeScript compile check)
- **Issue:** `z.enum(SERVICE_TYPES, { errorMap: () => ... })` — Zod v4 renamed `errorMap` to `error`; was causing a TS2769 overload mismatch error
- **Fix:** Changed to `{ error: 'Select a service type' }` (Zod v4 string shorthand)
- **Files modified:** `apps/web/src/lib/validations/lead.ts`
- **Commit:** 84db042

### Out-of-Scope Pre-existing Issues

Logged but not fixed (different plan's artifacts):
- `src/app/(landing)/[clientSlug]/[service]/page.tsx` — missing `@/components/lead-form` module (created in plan 02-02)

## Commits

| Hash | Message |
|------|---------|
| 84db042 | feat(02-lead-pipeline-03): add lead submit Route Handler with Supabase, GHL, and Resend |

## Known Stubs

None. All data fields are wired to real Supabase inserts and real external API calls. The `message_body` field in `sms_sequences` is set to `'Initial SMS workflow triggered'` as a placeholder — the actual message content is managed by the GHL workflow, not this handler.

## Self-Check: PASSED
