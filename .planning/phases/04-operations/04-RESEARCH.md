# Phase 4: Operations - Research

**Researched:** 2026-03-26
**Domain:** Admin panel (Next.js App Router), Stripe webhook lifecycle (FastAPI/Python), GHL Agency API sub-account provisioning
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Admin Panel Layout**
- D-48: Admin panel uses a simple top-nav layout (not sidebar-nav from Phase 3). Navigation items: Clients (list), and a link back to the marketing site. The `(admin)/layout.tsx` already has the ADMIN_EMAIL guard — extend it with a simple header nav.
- D-49: All admin routes use `export const dynamic = 'force-dynamic'`. Data fetched in Server Components using `createAdminClient()` from `@/lib/supabase/admin` (service role key, bypasses RLS).
- D-50: Admin panel reuses shadcn/ui components from Phase 3 (Table, Badge, Button, Input, Card). No additional shadcn/ui components needed unless planner identifies a gap.

**Client List Page**
- D-51: `/admin/clients` page shows a table: Business Name, City, Status badge (active/trial/inactive), Plan, Stripe Status, Created. Clicking a row navigates to the client detail page.
- D-52: Status derived from `is_active` and `trial_ends_at`: if `is_active=true` and `trial_ends_at` in the future → "trial"; if `is_active=true` and no active trial → "active"; if `is_active=false` → "inactive".

**Client Onboarding Form**
- D-53: `/admin/clients/new` — single form (not multi-step). Fields: business_name, owner_name, email, phone, city, state (default IL), service_area_zips (comma-separated text input), plan (dropdown: starter/growth/premium). Uses react-hook-form + Zod.
- D-54: On submit, a Server Action: (1) inserts client record via createAdminClient, (2) creates GHL sub-account via GHL Agency API, (3) stores `ghl_sub_account_id`, (4) creates `client_users` row linking owner email to client. If GHL fails, client record is still created but `ghl_sub_account_id` is null — admin can retry.
- D-55: Idempotency: before creating GHL sub-account, check if `ghl_sub_account_id` already set on client. If set, skip GHL creation.
- D-56: Phase 4 does NOT automate user creation — admin sets up owner email/password in Supabase Auth manually.

**Client Detail Page**
- D-57: `/admin/clients/[id]` — full client info, GHL sub-account link, two sections: Recent Leads (last 20) and Recent Calls (last 20). Uses createAdminClient (bypasses RLS).
- D-58: Read-only for v1. Editing deferred.

**Stripe Webhook Handlers**
- D-59: Stripe webhooks → FastAPI on Railway at `/api/webhooks/stripe`. Signature verified with `stripe.Webhook.construct_event` before processing.
- D-60: Four events handled: `customer.subscription.created` → set `is_active=true` + store `stripe_subscription_id`; `customer.subscription.deleted` → set `is_active=false`; `invoice.payment_succeeded` → insert billing record; `invoice.payment_failed` → send alert email via Resend to `ADMIN_EMAIL`.
- D-61: Idempotency: `stripe_invoice_id` UNIQUE constraint on billing table (already in migration 001) prevents duplicate billing records. Subscription events are idempotent by nature.
- D-62: Stripe webhook returns `200 OK` immediately after signature verification. Processing in FastAPI `BackgroundTasks`.
- D-63: Client lookup from Stripe events uses `stripe_customer_id` on the clients table.

**GHL Sub-Account Provisioning**
- D-64: GHL sub-account creation uses GHL Agency API v2. Runs inline during onboarding Server Action (not a background job). Admin creates 2-5 clients in MVP.
- D-65: `apps/web/src/lib/ghl.ts` extended with `createSubAccount` function. Agency-level API token stored as `GHL_AGENCY_API_KEY` env var.
- D-66: Migration 004 NOT needed — all required columns already exist (`ghl_sub_account_id`, `stripe_customer_id`, `stripe_subscription_id`, `is_active`, `trial_ends_at`, billing table).

### Claude's Discretion
- Admin nav styling and visual hierarchy
- Client detail page layout (tabs vs sections for leads/calls)
- Badge color scheme for client status (active/trial/inactive)
- Error state presentation for GHL provisioning failures
- Stripe webhook retry/error logging approach
- Email template content for payment failure alerts

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ADMN-01 | Admin panel accessible only to users matching `ADMIN_EMAIL` env var | Existing `(admin)/layout.tsx` guard handles this; extend with nav header only |
| ADMN-02 | Client list page showing all clients with active/trial/inactive status | D-51/D-52 specify table columns and status derivation logic |
| ADMN-03 | Client onboarding form that creates client record + provisions GHL sub-account | D-53/D-54/D-55 specify form, Server Action, GHL Agency API call |
| ADMN-04 | Single client detail page showing leads, calls, and GHL sub-account link | D-57 specifies layout; uses createAdminClient for bypassing RLS |
| ADMN-05 | Admin Supabase client uses service role key (bypasses RLS) — never exposed to browser | `createAdminClient()` already exists in `apps/web/src/lib/supabase/admin.ts` |
| BILL-01 | Stripe webhook handles `customer.subscription.created` → activates client | FastAPI BackgroundTasks pattern; stripe Python SDK 14.4.1 already installed |
| BILL-02 | Stripe webhook handles `customer.subscription.deleted` → deactivates client | Same handler, same pattern; idempotent DB update |
| BILL-03 | Stripe webhook handles `invoice.payment_succeeded` → inserts billing record | billing table and `stripe_invoice_id` UNIQUE constraint already exist |
| BILL-04 | Stripe webhook handles `invoice.payment_failed` → sends alert email via Resend | Resend Python SDK with `send_async()` for FastAPI async context |
| BILL-05 | All Stripe webhooks verify signature before processing | `stripe.Webhook.construct_event(body, sig, secret)` using raw bytes |
| BILL-06 | Idempotency enforced — duplicate webhook events do not create duplicate records | `stripe_invoice_id` UNIQUE constraint + upsert-safe subscription updates |
| GHL-02 | Sub-account created programmatically via GHL Agency API during client onboarding | `POST /locations/` with Agency-level Bearer token; response contains `id` (location ID) |
</phase_requirements>

---

## Summary

Phase 4 builds the admin operations layer: an admin-protected panel for client management and Stripe billing automation. No new infrastructure is introduced — every component extends established patterns from Phases 1–3.

The admin panel extends the existing `(admin)/layout.tsx` ADMIN_EMAIL guard with a top-nav header, then implements three new pages: a client list (`/admin/clients`), an onboarding form (`/admin/clients/new`), and a detail view (`/admin/clients/[id]`). All pages use `createAdminClient()` (service role, bypasses RLS) and `force-dynamic`. The onboarding form runs a Server Action that chains a Supabase insert with a GHL Agency API call — the critical new integration in this phase.

The Stripe webhook handler is a new FastAPI router (`/api/webhooks/stripe`) that mirrors the existing GHL webhook pattern: read raw body, verify signature with `stripe.Webhook.construct_event`, return 200, process in BackgroundTasks. Four event types map to database writes or Resend email alerts. All required columns and the billing table already exist in migration 001 — no new migrations are needed.

**Primary recommendation:** Follow the established FastAPI webhook pattern for Stripe exactly as it exists for GHL; extend `ghl.ts` with a `createSubAccount` function using the Agency token; add the Stripe webhook router to `main.py` alongside the existing GHL webhook router.

---

## Standard Stack

### Core (all already installed)

| Library | Version | Purpose | Source |
|---------|---------|---------|--------|
| `stripe` (Python) | 14.4.1 | Stripe webhook signature verification + event parsing | Already in `requirements.txt` |
| `supabase` (Python) | 2.28.3 | FastAPI writes to Supabase (service role) | Already in `requirements.txt` |
| `httpx` | 0.28.1 | Async HTTP client for GHL Agency API call | Already in `requirements.txt` |
| `resend` (Python) | 2.26.0 (latest) | Send payment failure alert emails from FastAPI | **NOT yet in `requirements.txt` — must add** |
| `fastapi` | 0.135.2 | Webhook router, BackgroundTasks | Already installed |
| `react-hook-form` | 7.x | Onboarding form state | Already installed |
| `zod` | 3.x | Onboarding form validation schema | Already installed |
| `@supabase/supabase-js` | 2.99.x | `createAdminClient()` for Next.js admin pages | Already installed |

### New Dependency to Add

```bash
# In api/ (FastAPI Python environment)
pip install "resend[async]"
```

The `[async]` extra enables `resend.Emails.send_async()` which is compatible with FastAPI's async BackgroundTasks without blocking the event loop. The synchronous `resend.Emails.send()` should not be used directly in async FastAPI routes.

### shadcn/ui Components (all already installed from Phase 3)

| Component | Use |
|-----------|-----|
| `Table`, `TableHeader`, `TableRow`, `TableCell`, `TableBody` | Client list page |
| `Badge` | Status badges (active/trial/inactive) |
| `Button` | Form submit, row navigation |
| `Input`, `Select`, `Label` | Onboarding form fields |
| `Card`, `CardHeader`, `CardContent` | Client detail page sections |

---

## Architecture Patterns

### Recommended Project Structure (new files only)

```
apps/web/src/
├── app/(admin)/
│   ├── layout.tsx               # EXISTING — extend with <nav> header
│   └── clients/
│       ├── page.tsx             # EXISTING stub → replace with full client list
│       ├── new/
│       │   └── page.tsx         # NEW — onboarding form page
│       └── [id]/
│           └── page.tsx         # NEW — client detail page
├── lib/
│   ├── ghl.ts                   # EXISTING — add createSubAccount()
│   ├── validations/
│   │   └── onboarding.ts        # NEW — Zod schema for onboarding form
│   └── actions/
│       └── onboarding-actions.ts # NEW — Server Action: insert client + GHL provisioning

api/
├── routers/
│   ├── webhooks.py              # EXISTING GHL handler
│   └── stripe_webhooks.py       # NEW — Stripe webhook router
├── services/
│   └── stripe_service.py        # NEW — Stripe event processors
└── main.py                      # EXISTING — add stripe_webhooks router
```

### Pattern 1: Admin Page with Service Role Client

All admin pages follow this exact pattern — consistent with D-49:

```typescript
// Source: established D-07 + D-49 pattern
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export default async function AdminClientsPage() {
  const supabase = createAdminClient()
  const { data: clients } = await supabase
    .from('clients')
    .select('*')
    .order('created_at', { ascending: false })

  return <ClientsTable clients={clients ?? []} />
}
```

Note: `createAdminClient()` does NOT use `await` — it returns a client directly (not a promise), unlike `createClient()` from `@/lib/supabase/server` which requires `await cookies()`.

### Pattern 2: Client Status Derivation (D-52)

```typescript
// Source: D-52 decision
type ClientStatus = 'active' | 'trial' | 'inactive'

function deriveClientStatus(client: {
  is_active: boolean
  trial_ends_at: string | null
}): ClientStatus {
  if (!client.is_active) return 'inactive'
  if (client.trial_ends_at && new Date(client.trial_ends_at) > new Date()) return 'trial'
  return 'active'
}
```

### Pattern 3: Onboarding Server Action (D-54/D-55)

```typescript
// Source: D-54, D-55 — Server Action pattern from Phase 3
'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createSubAccount } from '@/lib/ghl'
import { onboardingSchema } from '@/lib/validations/onboarding'
import { redirect } from 'next/navigation'

export async function onboardClient(formData: OnboardingFormValues) {
  const parsed = onboardingSchema.safeParse(formData)
  if (!parsed.success) throw new Error(parsed.error.issues[0].message)

  const supabase = createAdminClient()

  // Step 1: Insert client record
  const { data: client, error } = await supabase
    .from('clients')
    .insert({
      ...parsed.data,
      service_area_zips: parsed.data.service_area_zips
        .split(',').map(z => z.trim()).filter(Boolean),
    })
    .select()
    .single()

  if (error || !client) throw new Error('Failed to create client record')

  // Step 2: Create client_users row linking owner email
  // Admin must create auth user separately — this links by email for future matching
  // Actual user_id linking happens when admin creates Supabase Auth user manually

  // Step 3: GHL sub-account provisioning (D-55 idempotency guard)
  if (!client.ghl_sub_account_id) {
    const locationId = await createSubAccount({
      name: client.business_name,
      phone: client.phone,
      email: client.email,
      city: client.city,
      state: client.state,
    })

    if (locationId) {
      await supabase
        .from('clients')
        .update({ ghl_sub_account_id: locationId })
        .eq('id', client.id)
    }
    // If GHL fails: client record still created, ghl_sub_account_id remains null — D-54
  }

  redirect(`/admin/clients/${client.id}`)
}
```

### Pattern 4: Stripe Webhook Router (D-59/D-60/D-62)

```python
# Source: mirrors existing api/routers/webhooks.py GHL pattern
# stripe Python SDK 14.4.1 — already installed

import stripe
import logging
from fastapi import APIRouter, Request, Header, HTTPException, BackgroundTasks
from typing import Optional
from api.services.supabase_client import get_supabase

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["stripe-webhooks"])

@router.post("/webhooks/stripe")
async def stripe_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    stripe_signature: Optional[str] = Header(default=None, alias="stripe-signature"),
):
    body = await request.body()  # raw bytes — REQUIRED before any parsing

    try:
        event = stripe.Webhook.construct_event(
            payload=body,
            sig_header=stripe_signature,
            secret=os.environ["STRIPE_WEBHOOK_SECRET"],
        )
    except stripe.errors.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid Stripe signature")

    # Return 200 immediately — process in background (D-62)
    background_tasks.add_task(process_stripe_event, event)
    return {"status": "received"}
```

### Pattern 5: GHL Agency API — createSubAccount

```typescript
// Source: GHL API v2 docs — POST /locations/
// Extends existing apps/web/src/lib/ghl.ts

interface CreateSubAccountInput {
  name: string       // business_name
  phone: string
  email: string
  city: string
  state: string
}

export async function createSubAccount(
  input: CreateSubAccountInput
): Promise<string | null> {
  const agencyToken = process.env.GHL_AGENCY_API_KEY
  if (!agencyToken) {
    console.error('[ghl] GHL_AGENCY_API_KEY not set')
    return null
  }

  try {
    const response = await ghlFetch('/locations/', agencyToken, {
      method: 'POST',
      body: JSON.stringify({
        name: input.name,
        phone: input.phone,
        email: input.email,
        city: input.city,
        state: input.state,
        country: 'US',
        timezone: 'America/Chicago',
      }),
    })

    const data = await response.json() as { id?: string; location?: { id?: string } }
    // GHL API v2 returns either top-level id or nested location.id — handle both
    return data.id ?? data.location?.id ?? null
  } catch (err) {
    console.error('[ghl] createSubAccount error:', err)
    return null
  }
}
```

**IMPORTANT: GHL Agency API requires Agency Pro plan ($497/mo).** The GHL_AGENCY_API_KEY must be an Agency-level Private Integration Token, not a sub-account token. If the agency plan is Starter, this API call will return 403. Verify plan level before testing.

### Pattern 6: Resend from FastAPI BackgroundTask (BILL-04)

```python
# Source: resend PyPI docs — version 2.26.0
# Use send_async() in async FastAPI context to avoid blocking event loop
import resend

async def send_payment_failure_alert(client_name: str, amount_cents: int) -> None:
    resend.api_key = os.environ["RESEND_API_KEY"]
    params = {
        "from": "Tradeflow <alerts@yourdomain.com>",
        "to": [os.environ["ADMIN_EMAIL"]],
        "subject": f"Payment Failed: {client_name}",
        "html": f"<p>Payment of ${amount_cents / 100:.2f} failed for <strong>{client_name}</strong>.</p>",
    }
    await resend.Emails.send_async(params)
```

### Anti-Patterns to Avoid

- **`createAdminClient()` outside `(admin)/` route group:** The comment in `admin.ts` says NEVER import outside admin routes. The service role key bypasses all RLS — exposing it to dashboard or landing page code would be a security breach.
- **Stripe `event.data.object` as ground truth:** Stripe payloads can be stale. For subscription events, use `data.object.customer` (string ID) to look up the client — don't trust subscription status from the payload directly.
- **`await createAdminClient()`:** `createAdminClient()` returns a client synchronously (no async, no cookies). Do NOT use `await` on it. This differs from `createClient()` from server.ts which needs `await cookies()`.
- **Parsing request body before `stripe.Webhook.construct_event`:** The raw bytes must be passed to `construct_event`. If you call `await request.json()` first, the body stream is consumed and signature verification fails.
- **Module-level `resend.api_key` assignment in FastAPI:** Set `resend.api_key` inside the function or during lifespan, not at module top-level (Railway injects env vars at startup, not import time).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Stripe webhook signature verification | Manual HMAC comparison | `stripe.Webhook.construct_event(body, sig, secret)` | Handles timing attacks, header parsing, and API version tolerance |
| Billing deduplication | Custom "already processed" flag | `stripe_invoice_id UNIQUE` constraint already in migration 001 | UNIQUE constraint is atomic at DB layer — race conditions impossible |
| Status badge rendering | Custom CSS status pill | shadcn/ui `Badge` with variant prop — already installed | Consistent with Phase 3 dashboard; no new CSS needed |
| Form validation | Manual field checks | Zod schema + react-hook-form — established Phase 2/3 pattern | Validates on both client and in Server Action |
| Admin auth guard | Per-page email check | Existing `(admin)/layout.tsx` wraps all admin routes | Already done; adding a route to `(admin)/` auto-inherits the guard |
| Email from FastAPI | SMTP / raw HTTP | `resend.Emails.send_async()` — Python SDK | Same Resend account as Node.js; no new API key needed |

**Key insight:** The billing table, all column references, and billing idempotency constraint were designed in Phase 1 specifically for this phase. There is no schema work in Phase 4.

---

## Common Pitfalls

### Pitfall 1: GHL Agency Token vs Sub-Account Token

**What goes wrong:** `GHL_AGENCY_API_KEY` (used for `POST /locations/`) is a different token type from the per-client Private Integration Tokens used in Phase 2 for contact operations. If the admin accidentally uses a sub-account token for `POST /locations/`, the API returns a 403 with no helpful error message.

**Why it happens:** The existing `ghl.ts` uses per-request tokens passed as function arguments. The new `createSubAccount` function reads from `process.env.GHL_AGENCY_API_KEY` — a separate env var that must be provisioned as an Agency-level Private Integration Token.

**How to avoid:** Use the `ghlFetch` helper (already in `ghl.ts`) but pass `process.env.GHL_AGENCY_API_KEY` as the token argument, not any per-client token. Name the env var distinctly (`GHL_AGENCY_API_KEY`) to make the distinction clear.

**Warning signs:** HTTP 403 on `POST /locations/` when all other GHL calls succeed.

### Pitfall 2: GHL `POST /locations/` Response Shape

**What goes wrong:** The GHL API v2 response for sub-account creation may return the location ID as a top-level `id` field or nested inside a `location` object depending on the API version header sent. Code that only checks one path will store `null` for `ghl_sub_account_id`.

**Why it happens:** GHL's API v2 response structure varies by the `Version` header date. The existing `ghlFetch` helper sends `Version: 2021-07-28`.

**How to avoid:** Check both `data.id` and `data.location?.id` in the response parser. Log the full response body on success during initial testing to confirm the shape.

**Warning signs:** Client record created but `ghl_sub_account_id` is null even when GHL shows a new sub-account was created.

### Pitfall 3: Stripe `stripe-signature` Header Case Sensitivity

**What goes wrong:** FastAPI Header injection lowercases header names by default. Stripe sends `Stripe-Signature` — FastAPI converts it to `stripe-signature`. The alias `alias="stripe-signature"` in the `Header(...)` dependency handles this. If the alias is wrong or omitted, `sig_header` is `None` and `construct_event` raises an exception.

**Why it happens:** HTTP headers are case-insensitive per spec but Python attribute names are not. FastAPI normalizes to lowercase.

**How to avoid:** Use `Header(default=None, alias="stripe-signature")` exactly — lowercase. This is already demonstrated in the GHL webhook handler with `alias="X-GHL-Signature"`.

**Warning signs:** `stripe.errors.SignatureVerificationError` on every request even with correct `STRIPE_WEBHOOK_SECRET`.

### Pitfall 4: `stripe_customer_id` Not Set at Webhook Time

**What goes wrong:** D-63 says client lookup uses `stripe_customer_id` on the clients table. If the admin hasn't set `stripe_customer_id` on a client record before Stripe sends webhook events, the event processor cannot find the client and silently fails — `is_active` never updates.

**Why it happens:** D-56 defers Stripe customer creation to a manual step. There's a window between creating the client record and creating the Stripe customer where webhooks may fire.

**How to avoid:** In the Stripe webhook processor, when a lookup by `stripe_customer_id` returns no results, log a warning with the Stripe customer ID. Do NOT raise an exception or return 400 (Stripe would retry). Return 200 and log for manual resolution.

**Warning signs:** Stripe dashboard shows webhooks delivered successfully but client `is_active` doesn't change.

### Pitfall 5: Double-Submit on Onboarding Form

**What goes wrong:** Admin clicks "Create Client" twice. Two client records are created in Supabase; GHL may receive two `POST /locations/` calls creating two sub-accounts under the agency.

**Why it happens:** Server Actions have no built-in duplicate prevention. Network latency can make the first response appear to fail.

**How to avoid:** Disable the submit button via `useFormStatus` (React 19) or track a `pending` state using `useActionState`. The D-55 GHL idempotency check (if `ghl_sub_account_id` already set, skip) only prevents duplicate GHL accounts per Supabase record — it doesn't prevent two separate Supabase records from being created.

**Warning signs:** Two client rows in Supabase with the same email (which will fail since `email` is UNIQUE on the clients table — so the second insert returns an error, but the first GHL sub-account is orphaned).

### Pitfall 6: Resend Sync vs Async in BackgroundTasks

**What goes wrong:** Using `resend.Emails.send()` (synchronous) inside an `async` FastAPI BackgroundTask blocks the async event loop during the HTTP call, killing throughput.

**Why it happens:** The Resend Python SDK default is synchronous. The FastAPI docs example uses synchronous Resend because it's used in a synchronous route handler.

**How to avoid:** Install `resend[async]` and call `await resend.Emails.send_async(params)` inside async BackgroundTask functions. Since `process_stripe_event` is `async def`, it correctly propagates `await`.

**Warning signs:** Stripe webhook response times > 1 second; Railway CPU spikes when emails send.

---

## Code Examples

### Stripe Event Payload Key Fields

```python
# customer.subscription.created / customer.subscription.deleted
subscription = event['data']['object']  # Stripe Subscription object
customer_id = subscription['customer']  # string: "cus_Na6dX7aXxi11N4"
subscription_id = subscription['id']    # string: "sub_1234"
status = subscription['status']         # "active" | "canceled" | "past_due" etc.

# invoice.payment_succeeded / invoice.payment_failed
invoice = event['data']['object']       # Stripe Invoice object
customer_id = invoice['customer']       # string: "cus_Na6dX7aXxi11N4"
invoice_id = invoice['id']              # string: "in_1234"
amount_paid = invoice['amount_paid']    # int: cents
subscription_id = invoice.get('subscription')  # string or None
period_start = invoice.get('period_start')     # Unix timestamp or None
period_end = invoice.get('period_end')         # Unix timestamp or None
```

### Stripe Background Task Handler

```python
# Source: Stripe docs + GHL webhook pattern in api/routers/webhooks.py
import stripe
import os
from datetime import datetime, timezone

async def process_stripe_event(event: stripe.Event) -> None:
    db = get_supabase()
    event_type = event['type']
    obj = event['data']['object']

    if event_type == 'customer.subscription.created':
        customer_id = obj['customer']
        subscription_id = obj['id']
        result = db.table('clients').update({
            'is_active': True,
            'stripe_subscription_id': subscription_id,
        }).eq('stripe_customer_id', customer_id).execute()
        if not result.data:
            logger.warning('[stripe] No client found for customer_id=%s', customer_id)

    elif event_type == 'customer.subscription.deleted':
        customer_id = obj['customer']
        db.table('clients').update({'is_active': False}).eq(
            'stripe_customer_id', customer_id
        ).execute()

    elif event_type == 'invoice.payment_succeeded':
        customer_id = obj['customer']
        # Look up client_id
        result = db.table('clients').select('id, business_name').eq(
            'stripe_customer_id', customer_id
        ).execute()
        if not result.data:
            logger.warning('[stripe] No client for invoice customer_id=%s', customer_id)
            return
        client = result.data[0]
        # Insert billing record — UNIQUE on stripe_invoice_id prevents duplicates (BILL-06)
        db.table('billing').insert({
            'client_id': client['id'],
            'stripe_invoice_id': obj['id'],
            'stripe_subscription_id': obj.get('subscription'),
            'amount_cents': obj.get('amount_paid', 0),
            'currency': obj.get('currency', 'usd'),
            'status': 'paid',
            'period_start': datetime.fromtimestamp(obj['period_start'], tz=timezone.utc).isoformat() if obj.get('period_start') else None,
            'period_end': datetime.fromtimestamp(obj['period_end'], tz=timezone.utc).isoformat() if obj.get('period_end') else None,
            'paid_at': datetime.now(tz=timezone.utc).isoformat(),
        }).execute()

    elif event_type == 'invoice.payment_failed':
        customer_id = obj['customer']
        result = db.table('clients').select('business_name').eq(
            'stripe_customer_id', customer_id
        ).execute()
        client_name = result.data[0]['business_name'] if result.data else 'Unknown'
        await send_payment_failure_alert(client_name, obj.get('amount_due', 0))

    else:
        logger.info('[stripe] Unhandled event_type=%s', event_type)
```

### Onboarding Form Zod Schema

```typescript
// Source: D-53 — consistent with apps/web/src/lib/validations/settings.ts pattern
import { z } from 'zod'

export const onboardingSchema = z.object({
  business_name: z.string().min(2).max(100),
  owner_name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().min(10),
  city: z.string().min(2).max(100),
  state: z.string().default('IL'),
  service_area_zips: z.string().min(1, 'At least one ZIP code required'),
  plan: z.enum(['starter', 'growth', 'premium']),
})

export type OnboardingFormValues = z.infer<typeof onboardingSchema>
```

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| Resend sync `send()` in async handlers | `resend.Emails.send_async()` with `[async]` extra | Non-blocking; compatible with FastAPI BackgroundTasks |
| `stripe.error.SignatureVerificationError` | `stripe.errors.SignatureVerificationError` | Stripe Python SDK v10+ moved to `stripe.errors` namespace; verify import path matches installed version |
| GHL `POST /locations` with v1 agency key | GHL Agency API v2 with Agency Private Integration Token | v1 agency keys deprecated; only v2 Private Integration or OAuth Agency tokens work |

**Stripe Python SDK version note:** The project has `stripe==14.4.1` installed (well beyond the 10.x recommendation in CLAUDE.md). Version 14.x has `stripe.errors.SignatureVerificationError` (not `stripe.error`). Verify the correct exception class name before writing the handler:

```python
# stripe 14.x — correct namespace
except stripe.errors.SignatureVerificationError:
    raise HTTPException(status_code=400, detail="Invalid signature")
```

---

## Open Questions

1. **GHL Agency API response shape for `POST /locations/`**
   - What we know: Endpoint is `POST /locations/`; requires Agency-level Bearer token; returns a location/sub-account object
   - What's unclear: Whether the location ID is at `data.id` or `data.location.id` — official docs weren't machine-readable during research
   - Recommendation: Log the full JSON response on first successful call in development; implement defensive parsing of both `data.id` and `data.location?.id`

2. **GHL Agency Plan requirement**
   - What we know: The create sub-account API docs mention "Agency Pro ($497/mo) plan required"
   - What's unclear: Whether the existing agency account is on Pro plan
   - Recommendation: Planner should include a verification step: admin tests `POST /locations/` with a dummy payload; if 403, plan upgrade is required before GHL-02 can be implemented

3. **`client_users` row creation in onboarding (D-54 step 4)**
   - What we know: D-54 says "creates a `client_users` row linking the owner's email to the client" but D-56 says user creation is manual via Supabase dashboard
   - What's unclear: How to create the `client_users` row before the Supabase Auth user (and their `user_id`) exists
   - Recommendation: Skip `client_users` row creation in the Server Action — it can only be created after the admin creates the Supabase Auth user (which gives the `user_id`). The Server Action creates the client record; the admin links the auth user manually post-creation. Planner should resolve this with a note in the client detail page (show the client UUID so admin can use it when linking the auth user).

---

## Environment Availability

| Dependency | Required By | Available | Version | Notes |
|------------|------------|-----------|---------|-------|
| `stripe` (Python) | BILL-01 through BILL-06 | Yes | 14.4.1 | Already in `requirements.txt` |
| `supabase` (Python) | All FastAPI writes | Yes | 2.28.3 | Already in `requirements.txt` |
| `httpx` | GHL Agency API call | Yes | 0.28.1 | Already in `requirements.txt` |
| `resend` (Python) | BILL-04 | No | Not installed | Must add `resend[async]` to `requirements.txt` |
| `GHL_AGENCY_API_KEY` env var | GHL-02 | Unknown | — | New env var; must be provisioned as Agency-level Private Integration Token |
| `STRIPE_WEBHOOK_SECRET` env var | BILL-05 | Unknown | — | Webhook signing secret from Stripe dashboard |

**Missing dependencies with no fallback:**
- `resend` Python package — required for BILL-04 payment failure alerts; must be added to `requirements.txt`

**New environment variables required:**
- `GHL_AGENCY_API_KEY` — Agency-level Private Integration Token (not sub-account token)
- `STRIPE_WEBHOOK_SECRET` — Stripe webhook endpoint signing secret

---

## Sources

### Primary (HIGH confidence)
- GHL Developer Portal `marketplace.gohighlevel.com/docs/ghl/locations/create-location/` — Create Sub-Account endpoint path (`POST /locations/`) and Agency auth requirement
- Stripe API docs `docs.stripe.com/billing/subscriptions/webhooks` — subscription lifecycle events, `data.object.customer` field
- Stripe API docs `docs.stripe.com/api/subscriptions/object` — Subscription object fields: `id`, `customer` (string), `status`
- Existing codebase: `api/routers/webhooks.py` — GHL BackgroundTasks webhook pattern to replicate for Stripe
- Existing codebase: `supabase/migrations/001_initial_schema.sql` — billing table and UNIQUE constraint confirmed

### Secondary (MEDIUM confidence)
- Resend PyPI page `pypi.org/project/resend/` — version 2.26.0 confirmed, `send_async()` documented
- GitHub `github.com/ianrufus/youtube/blob/main/fastapi-stripe-webhook/app.py` — FastAPI Stripe webhook pattern
- FastAPI Stripe integration `fast-saas.com/blog/fastapi-stripe-integration/` — `construct_event` parameter usage

### Tertiary (LOW confidence — verify at implementation)
- GHL response shape for `POST /locations/` — official docs not fully machine-readable; implement defensive parsing
- GHL Agency Pro plan requirement — mentioned in search results but not confirmed for this agency account

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries verified against installed `requirements.txt` and npm packages
- Architecture patterns: HIGH — all patterns replicate established Phase 2/3 code in the codebase
- GHL Agency API details: MEDIUM — endpoint path confirmed; response shape and plan requirement need verification at implementation time
- Stripe webhook: HIGH — `construct_event` pattern verified against official docs and existing GHL handler structure
- Pitfalls: HIGH — drawn from existing project PITFALLS.md plus Phase 4 specific analysis

**Research date:** 2026-03-26
**Valid until:** 2026-04-25 (Stripe and Supabase are stable; GHL API changes more frequently — recheck GHL Agency API if implementing after 30 days)
