# Architecture Research

**Domain:** Multi-tenant lead generation platform (HVAC home services)
**Researched:** 2026-03-25
**Confidence:** HIGH — stack is fully locked; patterns verified against official Supabase docs, FastAPI docs, and GHL API docs

## Standard Architecture

### System Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                        EXTERNAL ENTRY POINTS                         │
│  ┌─────────────────┐  ┌──────────────┐  ┌───────────────────────┐   │
│  │  HVAC Landing   │  │  Client      │  │  Admin Panel          │   │
│  │  Pages (Static) │  │  Dashboard   │  │  (Internal only)      │   │
│  └────────┬────────┘  └──────┬───────┘  └──────────┬────────────┘   │
│           │                  │                      │                │
│           └──────────────────┴──────────────────────┘                │
│                              │                                       │
│                    Next.js 15 App Router                             │
│                    (Vercel — single deployment)                      │
└──────────────────────────────┬───────────────────────────────────────┘
                               │
               ┌───────────────┴────────────────────┐
               │                                    │
               ▼                                    ▼
┌──────────────────────────┐        ┌───────────────────────────────┐
│   FastAPI (Railway)      │        │   Supabase                    │
│                          │        │                               │
│  /webhook/callrail       │        │  Postgres + RLS               │
│  /webhook/stripe         │        │  Auth (email/magic link)      │
│  /webhook/ghl            │        │  Storage (call recordings)    │
│  /leads (POST)           │◄──────►│                               │
│  /cron/* (scheduled)     │        │  Tables:                      │
│                          │        │  - clients (tenant root)      │
│  Background workers:     │        │  - leads                      │
│  - GHL contact sync      │        │  - calls                      │
│  - Resend email dispatch │        │  - sms_messages               │
│  - RLS-scoped audit log  │        │  - subscriptions              │
└──────────────────────────┘        │  - notes                      │
               ▲                    └───────────────────────────────┘
               │ webhooks
┌──────────────┴───────────────────────────────────────────┐
│                    EXTERNAL SERVICES                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐  │
│  │ CallRail │  │  Stripe  │  │   GHL    │  │ Resend  │  │
│  │ (calls)  │  │(billing) │  │  (CRM)   │  │ (email) │  │
│  └──────────┘  └──────────┘  └──────────┘  └─────────┘  │
└──────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Implementation |
|-----------|----------------|----------------|
| Next.js App Router | All browser-facing surfaces: landing pages, dashboard, admin, marketing site | Single Vercel deployment, App Router with route groups |
| FastAPI (Railway) | Webhook ingestion, third-party orchestration, cron jobs, server-side operations requiring Python | Separate Railway service, never exposed to browsers |
| Supabase Postgres | Source of truth for all business data; enforces multi-tenancy via RLS | `clients` table is tenant root; every other table has `client_id` FK + RLS policy |
| Supabase Auth | User identity; JWT claims carry `client_id` for RLS evaluation | Email/password for HVAC owners; magic link for admin |
| GoHighLevel (per sub-account) | CRM contact storage, SMS workflow execution, missed-call text-back | One GHL sub-account per Tradeflow client; contacts mirrored from Supabase |
| CallRail | Call tracking per campaign, recording storage, missed call detection | Webhooks fire to FastAPI on call completion |
| Stripe | Subscription lifecycle; revenue of record | Webhooks fire to FastAPI on payment events |
| Resend | Transactional email (new lead alerts, payment failures) | Called from FastAPI after lead creation or Stripe event |

## Recommended Project Structure

### Next.js App (`/`)

```
app/
├── (marketing)/            # Public marketing site (no auth)
│   ├── page.tsx            # Homepage
│   └── pricing/page.tsx
├── (landing)/              # Per-client HVAC landing pages (static)
│   └── [slug]/
│       ├── page.tsx        # generateStaticParams → one page per client
│       └── components/     # HeroSection, LeadForm, CTAButton
├── (dashboard)/            # Auth-protected client portal
│   ├── layout.tsx          # Supabase session guard
│   ├── leads/page.tsx      # Lead list + status pipeline
│   ├── calls/page.tsx      # Call log + recordings
│   └── settings/page.tsx
├── (admin)/                # Admin-only (magic link auth)
│   ├── layout.tsx          # Admin role guard
│   ├── clients/page.tsx    # All clients overview
│   ├── clients/[id]/page.tsx
│   └── onboard/page.tsx    # New client wizard
├── api/
│   └── leads/route.ts      # Form submission → FastAPI proxy OR direct Supabase insert
└── middleware.ts            # Auth redirect, route protection

lib/
├── supabase/
│   ├── client.ts           # Browser client (anon key)
│   ├── server.ts           # Server component client (cookie-based)
│   └── admin.ts            # Service role client (admin routes only)
├── ghl.ts                  # GHL API wrapper
└── types/                  # Shared TypeScript types (lead, client, call)
```

### FastAPI Service (`/api-service/`)

```
app/
├── main.py                 # App entry, router mounts, lifespan hooks
├── routers/
│   ├── webhooks.py         # /webhook/callrail, /webhook/stripe, /webhook/ghl
│   ├── leads.py            # /leads POST (from landing page form)
│   └── health.py           # /health for Railway health checks
├── services/
│   ├── lead_service.py     # Lead creation logic, GHL contact sync
│   ├── ghl_service.py      # GHL API calls (create contact, trigger workflow)
│   ├── resend_service.py   # Email dispatch
│   └── billing_service.py  # Stripe event handlers
├── models/
│   ├── webhook_payloads.py # Pydantic models for each webhook shape
│   └── lead.py
├── middleware/
│   └── signature_verify.py # HMAC verification per provider
└── db/
    └── supabase.py         # Supabase Python client (service role)
```

### Structure Rationale

- **(landing)/[slug]/:** `generateStaticParams` fetches all active clients at build time and emits one HTML file per client. Zero JS on the critical path meets the sub-2s mobile target.
- **(dashboard)/ and (admin)/:** Route groups allow separate layout trees and auth guards without URL nesting. Dashboard uses client's JWT (RLS enforced). Admin layout swaps to service role Supabase client.
- **FastAPI routers/services split:** Routers only parse requests, verify signatures, and return 200 immediately. All business logic lives in service modules. This keeps webhook handlers thin and testable.
- **lib/supabase/admin.ts vs client.ts:** Explicit separation ensures service role key is never imported in a client component. TypeScript module resolution makes accidental misuse a build error.

## Architectural Patterns

### Pattern 1: Webhook Ack-Then-Process

**What:** Webhook endpoint returns HTTP 200 immediately after signature verification and persisting the raw payload to a `webhook_events` table. Processing (GHL sync, email, state updates) runs in FastAPI `BackgroundTasks`.

**When to use:** Every inbound webhook (CallRail, Stripe, GHL). External providers retry on non-2xx — blocking on downstream calls risks timeouts and duplicate processing.

**Trade-offs:** Requires idempotency (check `webhook_events` for duplicate delivery IDs before processing). Small operational overhead of the events table. Pays off immediately in reliability.

**Example:**
```python
@router.post("/webhook/callrail")
async def callrail_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    db: SupabaseClient = Depends(get_db),
):
    body = await request.body()
    verify_callrail_signature(request.headers, body)  # raises 401 on failure

    payload = CallRailPayload.model_validate_json(body)

    # Persist raw event for idempotency and audit
    event = await db.table("webhook_events").insert({
        "provider": "callrail",
        "external_id": payload.call_id,
        "payload": payload.model_dump(),
    }).execute()

    # Return 200 immediately — process async
    background_tasks.add_task(process_callrail_call, payload, db)
    return {"status": "accepted"}
```

### Pattern 2: RLS-Based Multi-Tenancy (Shared Tables)

**What:** All tenant data lives in shared Postgres tables. Every table has a `client_id` UUID foreign key to the `clients` table. RLS policies filter every SELECT/INSERT/UPDATE/DELETE to the authenticated user's client.

**When to use:** This is the only multi-tenancy model for this project — no schema-per-tenant needed at this scale (< 100 clients initially).

**Trade-offs:** Requires indexes on `client_id` in every table (without this, RLS overhead can turn 2ms queries into seconds). Admin backend uses service role key which bypasses RLS entirely — never expose this in Next.js client components.

**Example:**
```sql
-- Every table follows this pattern
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Clients see only their own leads
CREATE POLICY "client_own_leads" ON leads
  FOR ALL
  USING (client_id = (
    SELECT client_id FROM client_users
    WHERE user_id = (SELECT auth.uid())
  ));

-- Critical: index every client_id column used in policies
CREATE INDEX idx_leads_client_id ON leads(client_id);
CREATE INDEX idx_calls_client_id ON calls(client_id);
```

### Pattern 3: Static Landing Pages with On-Demand Revalidation

**What:** `generateStaticParams` in Next.js fetches all active client slugs at build time and pre-renders one HTML page per client. When a client is onboarded or their page content changes, the admin panel triggers `revalidatePath('/[slug]')` via Next.js cache invalidation.

**When to use:** All HVAC client landing pages. Static HTML loads in < 500ms on mobile; no server needed per request.

**Trade-offs:** New clients require a revalidation call (not a full rebuild) — acceptable since onboarding is a manual admin action. Page content is data-driven from Supabase `clients` table, not file-based.

**Example:**
```typescript
// app/(landing)/[slug]/page.tsx
export async function generateStaticParams() {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('clients')
    .select('slug')
    .eq('status', 'active')
  return data?.map(({ slug }) => ({ slug })) ?? []
}

export default async function LandingPage({ params }: { params: { slug: string } }) {
  const client = await getClientBySlug(params.slug)
  return <ClientLandingTemplate client={client} />
}
```

## Data Flow

### Lead Capture Flow (Landing Page Form)

```
User submits form on /[slug]
    ↓
Next.js API Route: POST /api/leads
    ↓
FastAPI: POST /leads
    │  Validate payload + honeypot
    │  Insert lead → Supabase leads table (status: 'new')
    │  [BackgroundTask] Create/update GHL contact in client's sub-account
    │  [BackgroundTask] Trigger GHL SMS follow-up workflow
    │  [BackgroundTask] Send owner notification email via Resend
    ↓
Response: 200 { lead_id }
    ↓
Next.js: Show confirmation UI to user
```

### Missed-Call Text-Back Flow

```
HVAC owner misses a call (CallRail tracking number)
    ↓
CallRail fires webhook: POST /webhook/callrail
    ↓
FastAPI: verify HMAC signature
    │  Insert webhook_event (idempotency check)
    │  Return 200 immediately
    ↓
BackgroundTask: process_callrail_call()
    │  Create lead in Supabase (source: 'callrail', status: 'new')
    │  Lookup client's GHL sub-account id
    │  Create GHL contact
    │  Trigger GHL "Missed Call Text-Back" workflow
    ↓
GHL sends automated SMS to caller within 30 seconds
```

### Stripe Billing Flow

```
Stripe payment event fires
    ↓
FastAPI: POST /webhook/stripe
    │  Verify Stripe-Signature header
    │  Persist to webhook_events
    │  Return 200
    ↓
BackgroundTask: handle_stripe_event()
    │  subscription.created → upsert Supabase subscriptions row
    │  invoice.payment_failed → send alert email via Resend
    │                         → set client status 'payment_failed'
    │  customer.subscription.deleted → set client status 'churned'
    ↓
Dashboard reflects updated billing status on next load
```

### Dashboard Data Flow

```
HVAC owner logs in (Supabase Auth)
    ↓
Next.js server component: createServerClient() with session cookies
    │  JWT contains user_id
    │  client_users table maps user_id → client_id
    ↓
Supabase query: SELECT * FROM leads WHERE ...
    │  RLS policy enforces client_id filter automatically
    │  No client_id ever passed from frontend — RLS handles it
    ↓
Server component renders lead list, passes data to client components
    │  No sensitive data in client bundle
    ↓
Inline status updates: Server Action → Supabase UPDATE
    │  RLS prevents updating another client's leads
```

### Admin Data Flow

```
Admin logs in (magic link)
    ↓
Next.js (admin) layout: verify admin role claim in JWT
    ↓
Admin queries use lib/supabase/admin.ts (service role key)
    │  Bypasses RLS — sees all clients' data
    │  Never imported outside (admin)/ route group
    ↓
Onboard new client:
    │  Insert into clients table
    │  Create GHL sub-account via GHL Agency API
    │  Store ghl_location_id on client record
    │  Trigger static page revalidation for new slug
```

## Integration Points

### External Services

| Service | Integration Pattern | Boundary | Notes |
|---------|---------------------|----------|-------|
| GoHighLevel | REST API from FastAPI only; one sub-account per client | FastAPI → GHL | `ghl_location_id` stored on `clients` row. OAuth2 bearer token stored in Railway env vars. Never called from Next.js. |
| CallRail | Inbound webhooks to FastAPI `/webhook/callrail` | CallRail → FastAPI | Verify `X-CallRail-Signature` HMAC-SHA256. One CallRail account; filter by `company_id` to route to correct client. |
| Stripe | Inbound webhooks to FastAPI `/webhook/stripe` | Stripe → FastAPI | Verify `Stripe-Signature` header with `stripe.webhook.construct_event()`. `customer.metadata.client_id` links Stripe customer to Supabase client. |
| Resend | Outbound email from FastAPI background tasks only | FastAPI → Resend | Never called from Next.js — avoids exposing API key in server actions. Simple fire-and-forget with error logging. |
| Supabase | Next.js uses anon/user JWT for dashboard. FastAPI uses service role for all writes. | Both → Supabase | Two separate Supabase client instances in Next.js: `client.ts` (anon, browser-safe) and `admin.ts` (service role, server-only). |

### Internal Boundaries

| Boundary | Communication | Direction | Notes |
|----------|---------------|-----------|-------|
| Next.js landing form → FastAPI | HTTPS POST `/leads` | → FastAPI | Form data validated client-side + Pydantic server-side. CORS restricted to Vercel domain. |
| Next.js dashboard → Supabase | Supabase JS SDK (JWT auth) | → Supabase | RLS is the security layer. Server components only — no client-side Supabase queries. |
| Next.js admin → Supabase | Supabase service role client | → Supabase | Only in `(admin)/` route group. File-level guard prevents accidental import elsewhere. |
| FastAPI → Supabase | Supabase Python client (service role) | → Supabase | All writes go through FastAPI — Next.js dashboard is read-only via RLS. |
| FastAPI → GHL | HTTPS REST (OAuth2 bearer) | → GHL | Async in BackgroundTasks. Retry on 429/5xx with exponential backoff. |

## Build Order (Phase Dependencies)

The architecture has hard dependencies that dictate what must exist before what:

```
1. Supabase schema + RLS policies
        ↓
2. Supabase Auth (users, client_users mapping)
        ↓  (parallel after this point)
   ┌────┴──────────────────────┐
   ▼                           ▼
3a. FastAPI service            3b. Next.js routing scaffold
    (webhook endpoints,            ((landing)/[slug], (dashboard)/,
     lead creation,                 (admin)/, middleware auth guards)
     GHL integration)
        ↓                               ↓
4a. Webhook integrations        4b. Landing page + lead form
    (CallRail, Stripe)               connected to FastAPI /leads
        ↓                               ↓
        └───────────────┬───────────────┘
                        ▼
             5. Client dashboard (reads from Supabase RLS)
                        ↓
             6. Admin panel (service role, GHL onboarding)
                        ↓
             7. Static page generation per client
```

**Rationale:**
- Schema and RLS must be complete before any service can write data — fixes the security model first.
- Auth comes second because every subsequent component depends on session context.
- FastAPI and Next.js scaffold can proceed in parallel once auth is set up.
- Lead capture (landing page + /leads endpoint) is the critical path to revenue — prioritize above dashboard.
- Dashboard comes after lead capture because there must be leads to display.
- Admin onboarding flow comes last (internal tool, not client-facing).

## Scaling Considerations

| Scale | Architecture Adjustment |
|-------|--------------------------|
| 0–20 clients | FastAPI `BackgroundTasks` sufficient. No queue needed. Single Railway instance. |
| 20–100 clients | Add ARQ (Redis-backed async queue) to FastAPI for webhook processing if Railway single instance shows memory pressure. Supabase free tier → Pro. |
| 100–500 clients | Consider read replicas in Supabase for dashboard queries. Add Railway autoscaling for FastAPI. GHL rate limits become relevant — queue with backoff essential. |
| 500+ clients | Per-schema tenancy or dedicated Postgres instances. Out of scope for MVP. |

### Scaling Priorities

1. **First bottleneck (webhook fan-out):** At high call volume (busy season), CallRail webhooks arrive in bursts. FastAPI `BackgroundTasks` processes in-process — move to ARQ + Redis before sustained load exceeds single process.
2. **Second bottleneck (RLS query performance):** Missing indexes on `client_id` columns become slow at ~10K leads per client. Index every foreign key column used in RLS policies from day one.

## Anti-Patterns

### Anti-Pattern 1: Service Role Key in Next.js Client Components

**What people do:** Import `lib/supabase/admin.ts` in a dashboard page or API route that isn't truly admin-only, or expose `SUPABASE_SERVICE_ROLE_KEY` as a `NEXT_PUBLIC_` variable.

**Why it's wrong:** Service role bypasses all RLS policies. Any client with the key can read every client's leads. One leaked key exposes all tenants.

**Do this instead:** Service role client lives exclusively in `(admin)/` route group and FastAPI. Next.js dashboard uses `createServerClient()` with the user's session cookie — RLS handles isolation automatically.

### Anti-Pattern 2: Blocking on Third-Party Calls Inside Webhook Handler

**What people do:** Call GHL API, send Resend email, and update Supabase all inside the webhook route handler before returning a response.

**Why it's wrong:** GHL API averages 200–800ms. Stripe and CallRail will retry on timeouts (> 5–10s). This creates duplicate lead creation and duplicate emails under load.

**Do this instead:** Persist the raw webhook payload to `webhook_events` immediately, return 200, and process in `BackgroundTasks`. Check `webhook_events` for duplicate `external_id` before processing to ensure idempotency.

### Anti-Pattern 3: Passing client_id from Frontend to Backend

**What people do:** Include `client_id` in the request body when a logged-in HVAC owner queries or updates leads, trusting the frontend to send the correct value.

**Why it's wrong:** Any user can fabricate a `client_id` and access another client's data if backend doesn't enforce ownership.

**Do this instead:** Derive `client_id` from the authenticated session server-side. For Next.js server components, use `(select auth.uid())` — RLS looks up `client_id` from `client_users` table automatically. For FastAPI writes, extract `client_id` from a verified JWT, never from the request payload.

### Anti-Pattern 4: One GHL Account for All Clients

**What people do:** Create all contacts in a single GHL account and use tags or custom fields to segregate by client.

**Why it's wrong:** SMS workflows, pipelines, and automations in GHL are account-scoped. One broken workflow or misconfigured automation affects all clients. No clean way to offboard a client without contaminating others.

**Do this instead:** One GHL sub-account per Tradeflow client. Store `ghl_location_id` on the `clients` row. GHL Agency API allows programmatic sub-account creation at onboarding time.

### Anti-Pattern 5: Rebuilding All Landing Pages on Every Client Update

**What people do:** Trigger a full `next build` whenever any client's information changes.

**Why it's wrong:** Build time grows linearly with client count. At 50 clients this is a 3-minute deploy cycle for a single phone number change.

**Do this instead:** Use Next.js on-demand revalidation (`revalidatePath('/[slug]')`) from the admin panel. Only the affected client's page is regenerated. Full rebuilds only needed for structural template changes.

## Sources

- [Supabase RLS official documentation](https://supabase.com/docs/guides/database/postgres/row-level-security) — HIGH confidence, official source
- [Supabase RLS production patterns (MakerKit)](https://makerkit.dev/blog/tutorials/supabase-rls-best-practices) — HIGH confidence, verified against official docs
- [FastAPI Background Tasks official docs](https://fastapi.tiangolo.com/tutorial/background-tasks/) — HIGH confidence, official source
- [FastAPI webhook handling patterns (Neon)](https://neon.com/guides/fastapi-webhooks) — MEDIUM confidence, verified against FastAPI docs
- [GoHighLevel API and Sub-Account docs](https://marketplace.gohighlevel.com/docs/ghl/locations/sub-account-formerly-location-api/index.html) — HIGH confidence, official GHL developer portal
- [Next.js ISR and on-demand revalidation](https://nextjs.org/docs/pages/guides/incremental-static-regeneration) — HIGH confidence, official Next.js docs
- [Multi-tenant static site engine with Next.js](https://dev.to/bobysf12/how-i-built-a-multi-tenant-static-site-engine-with-nextjs-nginx-and-coolify-10mm) — MEDIUM confidence, community source corroborating official patterns
- [GoHighLevel Webhook Integration Guide](https://marketplace.gohighlevel.com/docs/webhook/WebhookIntegrationGuide/index.html) — HIGH confidence, official GHL docs

---
*Architecture research for: Tradeflow — HVAC lead generation platform*
*Researched: 2026-03-25*
