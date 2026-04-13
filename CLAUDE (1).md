# CLAUDE.md — Tradeflow Platform

> This file is the single source of truth for every Claude Code session working on this project.
> Read it fully before writing any code, creating any file, or making any decision.

---

## What Is Tradeflow?

Tradeflow is an AI-powered lead generation platform for home service businesses,
starting with HVAC contractors in the Chicagoland area (Chicago city + suburbs).

**Business model:** Tradeflow is a managed service. HVAC companies pay a monthly
retainer ($500–$1,500/mo) and in return receive:
- Google Local Service Ads management
- Optimized landing pages that convert homeowners into leads
- Missed-call text-back automation (recovers lost leads)
- A private dashboard showing all their leads and performance
- Automated SMS follow-up sequences for cold leads
- Review request automation after completed jobs

**Who the users are:**
- `HVAC owner` — the paying client. Logs into the dashboard to see leads and manage pipeline.
- `Homeowner` — the end lead. Clicks an ad, lands on a page, fills a form or calls. Never logs in.
- `Admin (us)` — Camille + partner. Manages all client sub-accounts from one admin panel.

**The homeowner never creates an account.** They interact only with landing pages.

---

## Current Phase

**Phase 1 MVP — Build this first, nothing else.**

Phase 1 deliverables:
1. HVAC client landing page (Next.js, static, fast, mobile-first)
2. Lead capture form → Supabase `leads` table → GoHighLevel webhook
3. Missed-call text-back configured in GoHighLevel
4. Basic client dashboard (lead list + status pipeline)
5. Admin panel (view all clients and their leads)

Do NOT build Phase 2 features (AI voice agent, LLM scoring, analytics charts,
Facebook ads integration) until Phase 1 is complete and generating revenue.

---

## Tech Stack — Use Exactly This

### Frontend
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript — strict mode, no `any`
- **Styling:** Tailwind CSS — utility classes only, no custom CSS files unless unavoidable
- **Deployment:** Vercel
- **Auth:** Supabase Auth (email + password for HVAC owners, magic link for admin)

### Backend
- **Framework:** FastAPI (Python 3.11+)
- **Deployment:** Railway
- **Task scheduling:** APScheduler (for cron jobs, report emails)
- **HTTP client:** httpx (async)
- **Validation:** Pydantic v2

### Database
- **Provider:** Supabase (PostgreSQL)
- **ORM:** Supabase Python client + Supabase JS client
- **Multi-tenancy:** Row Level Security (RLS) — every client sees only their own data
- **Migrations:** SQL migration files in `/supabase/migrations/`

### External Services
- **CRM + Automation:** GoHighLevel (GHL) — sub-account per HVAC client
- **Call Tracking:** CallRail — unique number per ad campaign
- **Payments:** Stripe — subscription billing
- **Email:** Resend — transactional only (lead alerts, reports, invoices)
- **Ads:** Google Local Service Ads (managed externally, not via API in Phase 1)

### Phase 3 Only (do not install yet)
- Apify (web scraping)
- Vapi.ai (AI voice agent)
- LangGraph (LLM orchestration)

---

## Project Structure

```
tradeflow/
├── CLAUDE.md                        ← you are here
├── .env.local                       ← never commit, see env vars section
├── .env.example                     ← commit this, no real values
│
├── apps/
│   ├── web/                         ← Next.js app (all three sites)
│   │   ├── app/
│   │   │   ├── (marketing)/         ← public marketing site
│   │   │   │   ├── page.tsx         ← homepage
│   │   │   │   ├── pricing/
│   │   │   │   └── contact/
│   │   │   ├── (landing)/           ← HVAC client landing pages
│   │   │   │   └── [clientSlug]/
│   │   │   │       ├── page.tsx     ← static generated per client
│   │   │   │       └── [service]/   ← e.g. /oak-park-hvac/ac-repair
│   │   │   ├── (dashboard)/         ← HVAC owner private portal
│   │   │   │   ├── layout.tsx       ← auth guard
│   │   │   │   ├── leads/
│   │   │   │   ├── calls/
│   │   │   │   └── settings/
│   │   │   ├── (admin)/             ← Tradeflow internal panel
│   │   │   │   ├── layout.tsx       ← admin auth guard
│   │   │   │   ├── clients/
│   │   │   │   └── leads/
│   │   │   └── api/                 ← Next.js API routes (light use only)
│   │   │       ├── webhooks/
│   │   │       │   ├── callrail/    ← CallRail inbound webhook
│   │   │       │   ├── stripe/      ← Stripe billing webhook
│   │   │       │   └── ghl/         ← GoHighLevel webhook
│   │   │       └── leads/
│   │   │           └── submit/      ← landing page form submission
│   │   ├── components/
│   │   │   ├── ui/                  ← shared UI primitives
│   │   │   ├── landing/             ← landing page components
│   │   │   └── dashboard/           ← dashboard components
│   │   └── lib/
│   │       ├── supabase/
│   │       │   ├── client.ts        ← browser client
│   │       │   └── server.ts        ← server client (RSC)
│   │       ├── ghl.ts               ← GoHighLevel API wrapper
│   │       ├── callrail.ts          ← CallRail webhook handler
│   │       └── stripe.ts            ← Stripe client + helpers
│
├── api/                             ← FastAPI backend
│   ├── main.py
│   ├── routers/
│   │   ├── leads.py
│   │   ├── clients.py
│   │   ├── webhooks.py
│   │   └── reports.py
│   ├── services/
│   │   ├── supabase_client.py
│   │   ├── ghl_service.py
│   │   └── resend_service.py
│   ├── models/
│   │   └── schemas.py               ← Pydantic models
│   └── scheduler.py                 ← APScheduler cron jobs
│
└── supabase/
    ├── migrations/                  ← SQL migration files
    │   └── 001_initial_schema.sql
    └── seed.sql                     ← dev seed data
```

---

## Database Schema — Phase 1

Run these migrations in order. Never modify existing migrations — add new ones.

```sql
-- 001_initial_schema.sql

-- clients: one row per HVAC company we manage
create table public.clients (
  id                   uuid primary key default gen_random_uuid(),
  business_name        text not null,
  owner_name           text not null,
  email                text not null unique,
  phone                text not null,
  city                 text not null,
  state                text not null default 'IL',
  service_area_zips    text[] not null default '{}',
  ghl_sub_account_id   text,
  callrail_tracking_number text,
  stripe_customer_id   text,
  stripe_subscription_id text,
  plan                 text not null default 'starter',   -- starter | growth | pro
  is_active            boolean not null default true,
  trial_ends_at        timestamptz,
  created_at           timestamptz not null default now()
);

-- leads: one row per inbound lead for any client
create table public.leads (
  id               uuid primary key default gen_random_uuid(),
  client_id        uuid not null references public.clients(id) on delete cascade,
  homeowner_name   text,
  phone            text,
  email            text,
  zip_code         text,
  service_type     text,      -- ac_repair | furnace_repair | installation | maintenance | other
  source           text,      -- lsa | landing_page | ghl_form | direct_call
  status           text not null default 'new',  -- new | contacted | booked | completed | lost
  lead_score       int,       -- 1-10, set by LLM in Phase 2
  notes            text,
  ghl_contact_id   text,
  callrail_call_id text,
  created_at       timestamptz not null default now(),
  contacted_at     timestamptz,
  booked_at        timestamptz,
  completed_at     timestamptz
);

-- calls: every inbound call tracked via CallRail
create table public.calls (
  id                 uuid primary key default gen_random_uuid(),
  client_id          uuid not null references public.clients(id) on delete cascade,
  lead_id            uuid references public.leads(id),
  callrail_call_id   text unique,
  caller_number      text,
  tracking_number    text,
  duration_seconds   int,
  recording_url      text,
  transcript         text,
  outcome            text,    -- answered | missed | voicemail
  called_at          timestamptz not null default now()
);

-- sms_sequences: tracks each touch in the follow-up sequence
create table public.sms_sequences (
  id              uuid primary key default gen_random_uuid(),
  lead_id         uuid not null references public.leads(id) on delete cascade,
  touch_number    int not null,   -- 1 = immediate, 2 = +1hr, 3 = +24hr, etc
  message_body    text not null,
  ghl_message_id  text,
  status          text not null default 'pending',  -- pending | sent | delivered | failed
  scheduled_at    timestamptz not null,
  sent_at         timestamptz
);

-- billing: Stripe invoice records
create table public.billing (
  id                     uuid primary key default gen_random_uuid(),
  client_id              uuid not null references public.clients(id) on delete cascade,
  stripe_invoice_id      text unique,
  stripe_subscription_id text,
  amount_cents           int not null,
  currency               text not null default 'usd',
  status                 text not null,   -- paid | unpaid | void
  period_start           timestamptz,
  period_end             timestamptz,
  paid_at                timestamptz,
  created_at             timestamptz not null default now()
);

-- Row Level Security
alter table public.clients       enable row level security;
alter table public.leads         enable row level security;
alter table public.calls         enable row level security;
alter table public.sms_sequences enable row level security;
alter table public.billing       enable row level security;

-- RLS policies: HVAC owners see only their own client row + related data
-- The client's auth.uid() maps to clients.id via a join table (see below)

create table public.client_users (
  user_id   uuid not null references auth.users(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  role      text not null default 'owner',
  primary key (user_id, client_id)
);

create policy "clients: owner can read own record"
  on public.clients for select
  using (
    id in (
      select client_id from public.client_users
      where user_id = auth.uid()
    )
  );

create policy "leads: owner sees own leads"
  on public.leads for all
  using (
    client_id in (
      select client_id from public.client_users
      where user_id = auth.uid()
    )
  );

create policy "calls: owner sees own calls"
  on public.calls for all
  using (
    client_id in (
      select client_id from public.client_users
      where user_id = auth.uid()
    )
  );

create policy "billing: owner sees own billing"
  on public.billing for select
  using (
    client_id in (
      select client_id from public.client_users
      where user_id = auth.uid()
    )
  );

-- Admin bypass (service role key bypasses RLS — use only in FastAPI backend)
-- Never expose service role key to the browser.

-- Indexes for performance
create index leads_client_id_idx     on public.leads(client_id);
create index leads_status_idx        on public.leads(status);
create index leads_created_at_idx    on public.leads(created_at desc);
create index calls_client_id_idx     on public.calls(client_id);
create index sms_lead_id_idx         on public.sms_sequences(lead_id);
```

---

## Environment Variables

### apps/web/.env.local
```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=        # server-side only, never expose to browser

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# GoHighLevel
GHL_API_KEY=
GHL_LOCATION_ID=                  # your agency location ID

# CallRail
CALLRAIL_ACCOUNT_ID=
CALLRAIL_API_KEY=

# Resend
RESEND_API_KEY=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
ADMIN_EMAIL=                      # your admin email for auth guard
```

### api/.env
```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=        # backend always uses service role
GHL_API_KEY=
GHL_LOCATION_ID=
CALLRAIL_API_KEY=
RESEND_API_KEY=
RESEND_FROM_EMAIL=leads@tradeflow.io
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

---

## Key API Contracts

### POST /api/leads/submit
Called when a homeowner submits the landing page form.

**Request body:**
```typescript
{
  client_id: string        // uuid of the HVAC client
  homeowner_name: string
  phone: string
  email?: string
  zip_code: string
  service_type: string     // ac_repair | furnace_repair | installation | maintenance | other
  source: 'landing_page'
}
```

**What this endpoint does:**
1. Validates input with Zod
2. Inserts row into `public.leads` with status = `new`
3. Creates contact in GHL sub-account via GHL API
4. Triggers GHL workflow: sends confirmation SMS to homeowner
5. Sends push notification email to HVAC owner via Resend
6. Returns `{ success: true, lead_id: string }`

### POST /api/webhooks/callrail
Fired by CallRail when any tracked number receives a call.

**What this endpoint does:**
1. Verifies webhook signature
2. Looks up `client_id` from tracking number in `clients.callrail_tracking_number`
3. Inserts row into `public.calls`
4. If call was missed: creates lead row with source = `direct_call`, triggers GHL missed-call text-back
5. If call was answered: links call to existing lead if phone matches

### POST /api/webhooks/stripe
Fired by Stripe on subscription events.

**Events to handle:**
- `customer.subscription.created` → set `clients.plan` and `clients.is_active = true`
- `customer.subscription.deleted` → set `clients.is_active = false`
- `invoice.payment_succeeded` → insert row into `public.billing`
- `invoice.payment_failed` → send payment failed email via Resend

### POST /api/webhooks/ghl
Fired by GoHighLevel on contact/conversation events.

**Events to handle:**
- `InboundMessage` → log SMS reply from homeowner, update lead notes
- `ContactTagAdded` → sync GHL contact status back to Supabase lead status

---

## GoHighLevel Integration Rules

- Every HVAC client gets their own **GHL sub-account**. Never put two clients in the same sub-account.
- Create sub-accounts via the GHL Agency API, not manually.
- The missed-call text-back workflow is configured inside GHL, triggered by the webhook from CallRail landing on our `/api/webhooks/callrail` endpoint.
- SMS sequences are managed inside GHL workflows. We trigger them from our backend by adding a contact tag or firing a workflow trigger via the GHL API.
- Store `ghl_sub_account_id` and `ghl_contact_id` on every client and lead row.

**GHL API base URL:** `https://services.leadconnectorhq.com`

---

## Landing Page Rules

Every HVAC client landing page must:
- Be statically generated at build time (`generateStaticParams`)
- Load in under 2 seconds on mobile (check with Lighthouse)
- Have NO navigation menu — one page, one goal
- Have ONE primary CTA above the fold (phone number + form)
- Match the ad headline exactly (no bait-and-switch)
- Have the client's phone number in `tel:` format for one-tap mobile calling
- Include: review stars, license badge, service area neighborhoods
- Form fields: name, phone, service type (dropdown), zip code — nothing else

**URL structure:** `/[clientSlug]/[service]`
Example: `/oak-park-hvac/ac-repair`, `/naperville-hvac/furnace-repair`

**Page generation:** Each page is generated from the `clients` table.
`clientSlug` = slugified `business_name`. `service` = one of the service types.

---

## Dashboard Rules

The dashboard at `/dashboard` is only accessible to authenticated HVAC owners.

**Auth flow:**
1. HVAC owner visits `/dashboard`
2. Next.js middleware checks for Supabase session
3. No session → redirect to `/login`
4. Valid session → check `client_users` table to get `client_id`
5. All subsequent data fetches are scoped to that `client_id`

**Dashboard pages (Phase 1):**
- `/dashboard` → lead overview (count cards: new, contacted, booked, completed)
- `/dashboard/leads` → lead list with status column and notes field
- `/dashboard/calls` → call log with recording links
- `/dashboard/settings` → business info, notification preferences

**Do NOT build in Phase 1:** analytics charts, billing management, review management.
These are Phase 2 features.

---

## Admin Panel Rules

The admin panel at `/admin` is only accessible to users whose email matches
`process.env.ADMIN_EMAIL` (i.e. Camille + partner).

**Admin pages (Phase 1):**
- `/admin` → list of all clients with status (active/trial/inactive)
- `/admin/clients/[id]` → single client detail: their leads, calls, GHL sub-account link
- `/admin/clients/new` → form to onboard a new HVAC client

**Admin can do everything.** The admin Supabase client uses the service role key
which bypasses RLS. Never use the service role key anywhere except admin routes
and the FastAPI backend.

---

## Code Rules — Follow These Always

### TypeScript
- Strict mode on. No `any`. No `// @ts-ignore`.
- Define types for all Supabase table rows in `/lib/supabase/types.ts`
- Use `Database` type generated by Supabase CLI: `supabase gen types typescript`
- All API response types must be explicitly typed

### Next.js
- Use App Router. No Pages Router.
- Server Components by default. Add `'use client'` only when needed (interactivity, hooks).
- Use Server Actions for form mutations — not API routes for dashboard forms.
- Use Next.js API routes only for webhooks and external service callbacks.
- Never expose service role key in client components.

### FastAPI
- All routes must have Pydantic request/response models.
- Use `async` handlers everywhere — no blocking I/O.
- Webhooks must verify signatures before processing.
- Log every webhook received with timestamp and payload summary.

### Database
- Never do raw SQL in application code — use Supabase client methods.
- Exception: complex queries can use `.rpc()` with a named Postgres function.
- All migrations are append-only. Never modify an existing migration file.
- Always test RLS policies with a test user before shipping.

### Error handling
- All API routes return consistent error shape: `{ error: string, code?: string }`
- Log errors with enough context to debug (client_id, lead_id, webhook event type)
- Failed webhook processing must not return 500 — return 200 and log the failure.
  (Stripe/CallRail/GHL will retry on 5xx, causing duplicate processing.)

### Security
- Validate all webhook signatures (Stripe: `stripe.webhooks.constructEvent`, CallRail: HMAC)
- Never log full phone numbers or emails — truncate: `+1312****1234`
- Service role key only in server-side code and FastAPI. Never in browser.
- All environment variables prefixed with `NEXT_PUBLIC_` are visible to the browser.
  Do not put secrets in `NEXT_PUBLIC_` variables.

---

## What To Build First — Ordered Task List

Start here. Do not jump ahead.

**Step 1 — Supabase setup**
- [ ] Create Supabase project
- [ ] Run `001_initial_schema.sql`
- [ ] Generate TypeScript types with Supabase CLI
- [ ] Create one test client row and one test lead row
- [ ] Verify RLS: create a test user, confirm they can only see their client's leads

**Step 2 — Landing page**
- [ ] Create Next.js app with App Router + Tailwind
- [ ] Build `/[clientSlug]/[service]/page.tsx` with static generation
- [ ] Lead form with 4 fields: name, phone, service, zip
- [ ] On submit: POST to `/api/leads/submit`
- [ ] Success state: "We'll call you within 5 minutes"
- [ ] Mobile-first, loads under 2 seconds on 3G

**Step 3 — Lead capture API**
- [ ] `/api/leads/submit` — validates, inserts to Supabase, calls GHL
- [ ] GoHighLevel contact creation on new lead
- [ ] Email notification to HVAC owner via Resend

**Step 4 — Missed-call text-back**
- [ ] `/api/webhooks/callrail` — receives missed call events
- [ ] Creates lead row with source = `direct_call`
- [ ] Triggers GHL text-back workflow

**Step 5 — Basic dashboard**
- [ ] Supabase Auth login page at `/login`
- [ ] Route protection middleware
- [ ] `/dashboard/leads` — table of leads for the authenticated client
- [ ] Status update (dropdown: new → contacted → booked → completed → lost)
- [ ] Notes field (editable inline)

**Step 6 — Admin panel**
- [ ] `/admin` — list all clients
- [ ] `/admin/clients/new` — form to create a new HVAC client + GHL sub-account
- [ ] `/admin/clients/[id]` — view a client's leads and calls

---

## Naming Conventions

| Thing | Convention | Example |
|---|---|---|
| Database tables | snake_case plural | `public.leads` |
| TypeScript types | PascalCase | `Lead`, `Client`, `Call` |
| Next.js components | PascalCase | `LeadCard`, `StatusBadge` |
| Next.js pages | lowercase | `page.tsx`, `layout.tsx` |
| API route files | lowercase | `route.ts` |
| FastAPI routers | snake_case | `leads.py`, `webhooks.py` |
| Environment variables | SCREAMING_SNAKE_CASE | `GHL_API_KEY` |
| URL slugs | kebab-case | `oak-park-hvac` |
| GHL workflow names | Title Case | `Missed Call Text-Back` |

---

## Do Not Build (Phase 1 Scope Limits)

These are real features planned for Phase 2 and 3. Do not build them now.

- AI voice agent (Vapi.ai) — Phase 2
- LLM lead scoring (Claude API) — Phase 2
- Analytics charts and revenue dashboards — Phase 2
- Facebook/Meta ads integration — Phase 2
- Review request automation — Phase 2
- Automated weekly report emails — Phase 2
- Web scraping pipeline (Apify) — Phase 3
- Outbound LLM prospect scoring — Phase 3
- Multi-client SaaS admin billing portal — Phase 3
- Plumbing / roofing vertical expansion — Phase 3

If you find yourself reaching for any of these while building Phase 1, stop.
Finish Phase 1 first. Revenue funds Phase 2.

---

## Useful Context for Claude Code

- The business partner (sales) is based in Chicago, IL and will physically visit HVAC companies.
- The first HVAC client will be in the inner suburbs: Oak Park, Berwyn, Evanston area.
- The pilot offer is: 2-week free trial, $200 in ad spend covered by Tradeflow.
- After the pilot, clients pay $500–$1,500/month depending on the plan.
- The HVAC market is seasonal: winter surge (Oct–Feb) and summer surge (May–Aug).
- Chicago LSA cost per lead: $25–$55 in suburbs, $45–$85 in the city.
- Target HVAC client profile: 2–5 technicians, 5–25 Google reviews, outdated website.
- Tradeflow's competitive advantage: exclusive leads (not shared like Angi), AI automation.
- The name "Tradeflow" is confirmed. Domain TBD (check tradeflow.io, gettradeflow.com).
- Partnership: 50/50 revenue split. Technical partner = Camille. Business partner = client.

---

*Last updated: March 2026 — Phase 1 MVP*
