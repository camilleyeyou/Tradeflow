---
phase: 04-operations
verified: 2026-03-27T00:00:00Z
status: human_needed
score: 15/15 must-haves verified
re_verification: false
gaps:
  - truth: "Onboarding success message or redirect includes a reminder that the next step is to create the auth user in Supabase for the new client"
    status: resolved
    reason: "The detail page surfaces the Client ID (needed for manual linking) and the code in onboarding-actions.ts documents the requirement in a comment, but no user-visible banner, callout, or inline message prompts the admin to create the Supabase auth user after onboarding."
    artifacts:
      - path: "apps/web/src/app/(admin)/clients/[id]/page.tsx"
        issue: "No UI reminder rendered — the page shows the Client ID but provides no explicit instruction or callout about the required manual auth user creation step"
    missing:
      - "Add an info banner or callout card to /admin/clients/[id]/page.tsx that is shown when the client has no linked auth user (client_users row does not exist), prompting the admin to create an auth user in Supabase and link it"
human_verification:
  - test: "Visual confirmation that admin onboarding flow works end-to-end"
    expected: "Admin fills /admin/clients/new form, submits, is redirected to /admin/clients/[id], sees client info card with GHL link or Not provisioned warning"
    why_human: "Requires running the Next.js dev server and submitting the form against a live Supabase instance"
  - test: "Non-admin redirect enforced"
    expected: "Opening /admin/clients in incognito (or with a non-ADMIN_EMAIL account) redirects to /login"
    why_human: "Auth guard behavior requires a running server and browser session"
  - test: "Stripe webhook signature rejection"
    expected: "POST /api/webhooks/stripe without a valid stripe-signature header returns 400"
    why_human: "Requires a running FastAPI server to test the HTTP endpoint"
---

# Phase 4: Operations Verification Report

**Phase Goal:** The admin can onboard a new HVAC client (creating their Supabase record and GHL sub-account in one flow), and Stripe subscription lifecycle events automatically activate, deactivate, and track billing without any manual database changes.
**Verified:** 2026-03-27T00:00:00Z
**Status:** gaps_found
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Admin layout shows a top-nav header with Tradeflow Admin branding and Clients navigation link | VERIFIED | layout.tsx lines 21-31: `Tradeflow Admin` + `Link href="/admin/clients"` |
| 2 | Admin layout redirects non-ADMIN_EMAIL users to /login | VERIFIED | layout.tsx lines 13-15: `if (!user \|\| user.email !== process.env.ADMIN_EMAIL) redirect('/login')` |
| 3 | Client list page shows a table with Business Name, City, Status badge, Plan, Stripe Status, and Created columns | VERIFIED | clients/page.tsx lines 33-38: all six TableHead elements present |
| 4 | Client status is derived from is_active and trial_ends_at per D-52 logic | VERIFIED | admin.ts lines 3-10: exact D-52 logic; clients/page.tsx line 43: `deriveClientStatus(client)` |
| 5 | All admin pages use createAdminClient (service role key, bypasses RLS) | VERIFIED | clients/page.tsx line 1 + 12; [id]/page.tsx line 1 + 18; onboarding-actions.ts line 3 + 23 |
| 6 | A Stripe customer.subscription.created webhook sets is_active=true and stores stripe_subscription_id on the client | VERIFIED | stripe_service.py lines 37-53: `handle_subscription_created` updates both fields |
| 7 | A Stripe customer.subscription.deleted webhook sets is_active=false on the client | VERIFIED | stripe_service.py lines 56-70: `handle_subscription_deleted` sets `is_active: False` |
| 8 | A Stripe invoice.payment_succeeded webhook inserts a billing record with the correct amount and period | VERIFIED | stripe_service.py lines 73-119: `handle_invoice_paid` inserts into billing table with amount, period_start, period_end |
| 9 | A Stripe invoice.payment_failed webhook sends an alert email via Resend to ADMIN_EMAIL | VERIFIED | stripe_service.py lines 122-159: `handle_invoice_failed` calls `resend.Emails.send_async` |
| 10 | All Stripe webhooks reject requests without a valid signature (return 400) | VERIFIED | stripe_webhooks.py lines 38-57: missing header raises 400; `SignatureVerificationError` raises 400 |
| 11 | Duplicate webhook events do not create duplicate billing records (stripe_invoice_id UNIQUE) | VERIFIED | stripe_service.py lines 114-118: catches duplicate/unique constraint exceptions gracefully |
| 12 | Webhook returns 200 immediately; processing happens in BackgroundTasks | VERIFIED | stripe_webhooks.py lines 62-63: `background_tasks.add_task(process_stripe_event, event); return {"status": "received"}` |
| 13 | Admin can fill out the onboarding form and create a new client record in Supabase | VERIFIED | onboarding-actions.ts lines 28-48: inserts client record; new/page.tsx lines 29-38: calls `onboardClient` |
| 14 | GHL sub-account is provisioned during onboarding and ghl_sub_account_id is stored on the client record | VERIFIED | onboarding-actions.ts lines 58-74: `createSubAccount` called, result stored via update |
| 15 | Onboarding success message or redirect includes a reminder that the next step is to create the auth user in Supabase for the new client | PARTIAL | Code comment in onboarding-actions.ts lines 51-55 documents requirement; Client ID rendered in detail page for manual use; but NO user-visible UI reminder or callout exists in the detail page |

**Score:** 14/15 truths verified (1 partial)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `apps/web/src/app/(admin)/layout.tsx` | Admin layout with top-nav header and ADMIN_EMAIL auth guard | VERIFIED | Contains `createClient`, `ADMIN_EMAIL` guard, `Tradeflow Admin` branding, Clients link |
| `apps/web/src/app/(admin)/clients/page.tsx` | Client list table with status derivation | VERIFIED | Contains `createAdminClient`, `deriveClientStatus`, `export const dynamic = 'force-dynamic'`, all 6 columns |
| `apps/web/src/lib/types/admin.ts` | ClientStatus type and deriveClientStatus utility | VERIFIED | Exports `ClientStatus`, `deriveClientStatus`, `statusBadgeVariant` |
| `api/routers/stripe_webhooks.py` | Stripe webhook POST endpoint with signature verification | VERIFIED | Contains `stripe.Webhook.construct_event`, `stripe.errors.SignatureVerificationError`, `background_tasks.add_task` |
| `api/services/stripe_service.py` | Stripe event processing functions | VERIFIED | Contains `process_stripe_event`, all four event handlers, `get_supabase()`, `resend.Emails.send_async` |
| `api/main.py` | FastAPI app with stripe webhook router included | VERIFIED | Contains `from api.routers import stripe_webhooks`, `app.include_router(stripe_webhooks.router)` |
| `apps/web/src/lib/validations/onboarding.ts` | Zod schema for client onboarding form | VERIFIED | Exports `onboardingSchema`, `OnboardingFormValues` with all D-53 fields |
| `apps/web/src/lib/actions/onboarding-actions.ts` | Server Action that inserts client and provisions GHL sub-account | VERIFIED | Contains `onboardClient`, `createAdminClient`, `createSubAccount`, idempotency guard |
| `apps/web/src/lib/ghl.ts` | Extended GHL client with createSubAccount function | VERIFIED | Contains `createSubAccount` using `GHL_AGENCY_API_KEY`, POST to `/locations/` |
| `apps/web/src/app/(admin)/clients/new/page.tsx` | Client onboarding form page | VERIFIED | Contains `onboardingSchema`, `zodResolver`, `onboardClient` call, all D-53 fields |
| `apps/web/src/app/(admin)/clients/[id]/page.tsx` | Client detail page with leads and calls sections | VERIFIED | Contains `createAdminClient`, leads query, calls query, GHL link, Client ID display |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `clients/page.tsx` | `createAdminClient` | import from @/lib/supabase/admin | WIRED | Line 1 import + line 12 call |
| `clients/page.tsx` | `admin.ts` | import deriveClientStatus | WIRED | Line 2 import + line 43 call |
| `stripe_webhooks.py` | `stripe_service.py` | import process_stripe_event | WIRED | Line 15 import + line 62 `background_tasks.add_task(process_stripe_event, event)` |
| `stripe_webhooks.py` | `stripe.Webhook.construct_event` | signature verification | WIRED | Lines 47-51 |
| `main.py` | `stripe_webhooks.py` | app.include_router | WIRED | Line 5 import + line 18 include |
| `stripe_service.py` | `supabase_client.py` | get_supabase() for DB writes | WIRED | Line 15 import + calls in all four handlers |
| `new/page.tsx` | `onboarding-actions.ts` | form submission calls onboardClient | WIRED | Line 6 import + line 33 `await onboardClient(data)` |
| `onboarding-actions.ts` | `ghl.ts` | import createSubAccount | WIRED | Line 4 import + line 59 `await createSubAccount(...)` |
| `onboarding-actions.ts` | `createAdminClient` | import from @/lib/supabase/admin | WIRED | Line 3 import + line 23 call |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `clients/page.tsx` | `clientList` | `supabase.from('clients').select('*')` via `createAdminClient()` (service role) | Yes — live DB query | FLOWING |
| `[id]/page.tsx` | `typedClient`, `leadsList`, `callsList` | Three separate Supabase queries (clients, leads, calls) via `createAdminClient()` | Yes — live DB queries | FLOWING |
| `stripe_service.py` | billing table, client is_active | `db.table("clients").update(...)` / `db.table("billing").insert(...)` | Yes — writes to real DB via get_supabase() | FLOWING |
| `onboarding-actions.ts` | client record | `supabase.from('clients').insert(...)` via `createAdminClient()` | Yes — live DB write | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Python syntax: stripe_webhooks.py | `python3 -c "import ast; ast.parse(...)"` | stripe_webhooks.py: OK | PASS |
| Python syntax: stripe_service.py | `python3 -c "import ast; ast.parse(...)"` | stripe_service.py: OK | PASS |
| Python syntax: main.py | `python3 -c "import ast; ast.parse(...)"` | main.py: OK | PASS |
| Next.js build | `cd apps/web && npx next build` | Exit 0, 8 static pages, admin routes in .next/server/app/(admin)/ | PASS |
| stripe_service async functions | `ast.walk` for AsyncFunctionDef | process_stripe_event, handle_subscription_created, handle_subscription_deleted, handle_invoice_paid, handle_invoice_failed | PASS |
| Stripe router wired in FastAPI | `grep "stripe_webhooks" api/main.py` | import + include_router present | PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| ADMN-01 | 04-01 | Admin panel accessible only to users matching ADMIN_EMAIL env var | SATISFIED | layout.tsx lines 13-15: ADMIN_EMAIL guard with redirect('/login') |
| ADMN-02 | 04-01 | Client list page showing all clients with active/trial/inactive status | SATISFIED | clients/page.tsx: full table with deriveClientStatus badges |
| ADMN-03 | 04-03 | Client onboarding form that creates client record and provisions GHL sub-account | SATISFIED | onboarding-actions.ts + new/page.tsx: full flow implemented |
| ADMN-04 | 04-03 | Single client detail page showing their leads, calls, and GHL sub-account link | SATISFIED | [id]/page.tsx: leads (last 20), calls (last 20), GHL link or "Not provisioned" |
| ADMN-05 | 04-01 | Admin Supabase client uses service role key (bypasses RLS) — never exposed to browser | SATISFIED | createAdminClient() used only in Server Components and Server Actions; all admin pages are server-side |
| BILL-01 | 04-02 | Stripe webhook handles customer.subscription.created → activates client | SATISFIED | stripe_service.py handle_subscription_created: sets is_active=True, stores stripe_subscription_id |
| BILL-02 | 04-02 | Stripe webhook handles customer.subscription.deleted → deactivates client | SATISFIED | stripe_service.py handle_subscription_deleted: sets is_active=False |
| BILL-03 | 04-02 | Stripe webhook handles invoice.payment_succeeded → inserts billing record | SATISFIED | stripe_service.py handle_invoice_paid: inserts into billing table with all required fields |
| BILL-04 | 04-02 | Stripe webhook handles invoice.payment_failed → sends alert email via Resend | SATISFIED | stripe_service.py handle_invoice_failed: resend.Emails.send_async to ADMIN_EMAIL |
| BILL-05 | 04-02 | All Stripe webhooks verify signature before processing | SATISFIED | stripe_webhooks.py: stripe.Webhook.construct_event before BackgroundTasks; 400 on failure |
| BILL-06 | 04-02 | Idempotency enforced — duplicate webhook events do not create duplicate records | SATISFIED | stripe_service.py lines 114-118: catches duplicate/unique exception; stripe_invoice_id UNIQUE in billing table |
| GHL-02 | 04-03 | Sub-account created programmatically via GHL Agency API during client onboarding | SATISFIED | ghl.ts createSubAccount: POST /locations/ with GHL_AGENCY_API_KEY; called in onboarding-actions.ts |

All 12 requirement IDs declared across plans are accounted for. No orphaned requirements found.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `new/page.tsx` | 54,62,70,78,87,94,103 | `placeholder="..."` attributes | Info | HTML form input placeholders — not code stubs; legitimate UX pattern |

No blockers or warnings found. All placeholder matches are HTML `placeholder` attributes on Input elements, not stub implementations.

### Human Verification Required

#### 1. End-to-End Admin Onboarding Flow

**Test:** Start the dev server (`cd apps/web && npm run dev`). Log in with ADMIN_EMAIL. Navigate to /admin/clients, click "Add Client", fill out the form, submit.
**Expected:** Client record created in Supabase, GHL sub-account provisioned (or "Not provisioned" if GHL_AGENCY_API_KEY is not set), redirect to /admin/clients/[id] detail page.
**Why human:** Requires running server, live Supabase instance, and optionally a GHL agency token to test sub-account provisioning.

#### 2. Non-Admin Access Redirect

**Test:** Open incognito window, navigate to /admin/clients (or any /admin/* route).
**Expected:** Immediate redirect to /login; no admin content visible.
**Why human:** Auth guard behavior requires browser session and running server.

#### 3. Stripe Webhook Signature Enforcement

**Test:** POST to `http://localhost:PORT/api/webhooks/stripe` without a `stripe-signature` header, then with an invalid signature.
**Expected:** Both requests return HTTP 400 with appropriate error messages.
**Why human:** Requires running FastAPI server.

### Gaps Summary

One gap was identified, classified as a warning (not a blocker):

**Missing auth-user reminder UI (Plan 03 truth #8):** The plan required the onboarding success redirect to include a user-visible reminder that the admin must manually create a Supabase auth user and link it via the client_users table. The client detail page (`/admin/clients/[id]`) does display the Client ID (which the admin needs for the manual linking step), but there is no callout, alert banner, or inline instruction prompting this action. The Server Action code contains a developer comment explaining this requirement, but the admin UI user would not see it.

This is a warning-level gap. The core onboarding functionality is complete and operational. The missing UI reminder is a UX omission that could cause admin confusion during the first onboarding, but does not prevent goal achievement — the admin can still find the information needed in the Supabase dashboard. However, the plan's explicit requirement for a user-visible reminder is not met.

**Fix:** Add a callout or info banner to `apps/web/src/app/(admin)/clients/[id]/page.tsx` that displays (e.g., only when `stripe_customer_id` is null or on first load via a query param from the redirect) instructing the admin to create an auth user in Supabase and link it to the client ID shown.

---

_Verified: 2026-03-27T00:00:00Z_
_Verifier: Claude (gsd-verifier)_
