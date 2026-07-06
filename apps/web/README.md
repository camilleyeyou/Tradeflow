# Tradeflow — Web App

AI-powered lead generation for home-service businesses, starting with **HVAC contractors in the Chicagoland area**.

HVAC companies pay a monthly retainer and get managed Google Local Services Ads, optimized landing pages, missed-call text-back, SMS follow-up sequences, and a private dashboard showing every lead and how their spend is performing. The core promise: **every inbound lead — ad click, form, or missed call — is captured instantly, routed to the right contractor, and followed up automatically so no lead is ever lost.**

This package (`apps/web`) is the **Next.js front end + lead-capture/notification API**. It is one of three parts of the platform — see [System Architecture](#system-architecture).

---

## Table of contents

- [System Architecture](#system-architecture)
- [Tech Stack](#tech-stack)
- [Surfaces & Routes](#surfaces--routes)
- [Next.js API Routes](#nextjs-api-routes)
- [Project Structure](#project-structure)
- [Auth & Multi-Tenancy](#auth--multi-tenancy)
- [Database](#database)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)
- [Build, Lint & Deploy](#build-lint--deploy)
- [Styling & Brand](#styling--brand)
- [Conventions](#conventions)

---

## System Architecture

Tradeflow is three cooperating services that share **one Supabase Postgres database**:

```
                        ┌──────────────────────────────────────────┐
   Homeowners ─────────▶│  apps/web  (Next.js 15 · Vercel)          │
   (ad clicks,          │  • Marketing site + /get-started form     │
    landing forms)      │  • Per-client HVAC landing pages          │
                        │  • Contractor & admin dashboards          │
                        │  • /api/leads/submit, /api/get-started    │
                        └───────────────┬──────────────────────────┘
                                        │ service-role writes
                                        ▼
                        ┌──────────────────────────────────────────┐
   GHL / Stripe /  ────▶│  api/  (FastAPI · Railway)                │
   CallRail webhooks    │  • /api/webhooks/ghl   (Ed25519)          │
                        │  • /api/webhooks/stripe                   │
                        │  • /api/webhooks/callrail (missed-call     │
                        │    text-back)                              │
                        │  • Syncs SMS replies, tags, billing       │
                        └───────────────┬──────────────────────────┘
                                        │
                                        ▼
                        ┌──────────────────────────────────────────┐
                        │  Supabase (Postgres + Auth + RLS)         │
                        │  clients · leads · calls · sms_sequences  │
                        │  billing · client_users                   │
                        └──────────────────────────────────────────┘

   Third-party: Google LSA · CallRail (call tracking) · GoHighLevel
   (CRM/SMS) · Stripe (billing) · Resend (transactional email)
```

| Service | Location | Runtime | Hosting | Responsibility |
|---|---|---|---|---|
| **Web** | `apps/web` | Next.js 15 (App Router) / React 19 | Vercel | All UI surfaces + inbound lead capture and email notification |
| **API** | `api` | FastAPI / Python 3.12 | Railway | Inbound **webhooks** from GoHighLevel, Stripe & CallRail (missed-call text-back); async sync to DB |
| **Database** | `supabase/` | Supabase (Postgres) | Supabase | Source of truth; Auth; Row-Level Security for multi-tenancy |

> Live site: **https://www.tradeflow-technologies.com** (the apex `tradeflow-technologies.com` redirects to `www`).

---

## Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Framework | **Next.js 15.5** (App Router, Turbopack) | SSG landing pages, dynamic dashboard/admin |
| UI runtime | **React 19** | |
| Styling | **Tailwind CSS v4** (`@tailwindcss/postcss`) | Zero-config; theme tokens in `globals.css`; `tw-animate-css` |
| Components | **shadcn/ui**-style primitives + `@base-ui/react` | Copied into `src/components/ui` |
| Forms | **react-hook-form** + **zod** (`@hookform/resolvers`) | Shared client/server schemas in `lib/validations` |
| Auth & DB | **Supabase** (`@supabase/supabase-js`, `@supabase/ssr`) | Cookie-based sessions, RLS |
| Email | **Resend** | Lead notifications + get-started inquiries |
| Icons | **lucide-react** | |
| Language | **TypeScript 5** (strict) | |

Backend (`api/`): **FastAPI 0.135**, **Pydantic v2**, `supabase` (Python), `stripe`, `cryptography` (Ed25519/RSA webhook verification), `resend`, served by `uvicorn`.

---

## Surfaces & Routes

Routes are organized with App Router **route groups** (the parenthesized folders don't appear in the URL):

### `(marketing)` — public

| Route | File | Description |
|---|---|---|
| `/` | `src/app/(marketing)/page.tsx` | Marketing homepage: hero, pain points, feature sections (Google LSA, missed-call text-back, SMS sequences, call tracking), pricing, CTAs. |
| `/get-started` | `src/app/(marketing)/get-started/page.tsx` | Onboarding inquiry form (name, company, phone, email, service area, how-they-heard). Client-side validation, loading state, on-page success. Submits to `POST /api/get-started`. Includes a "Prefer email?" `mailto:` fallback. |

### `(landing)` — public, one per HVAC client

| Route | File | Description |
|---|---|---|
| `/{clientSlug}` | `src/app/(landing)/[clientSlug]/page.tsx` | Redirects to the default service (`ac-repair`). |
| `/{clientSlug}/{service}` | `src/app/(landing)/[clientSlug]/[service]/page.tsx` | Per-client service landing page (`ac-repair`, `furnace-repair`, `installation`, `maintenance`). Click-to-call (`tel:`) + `LeadForm`. Client data fetched server-side; pages pre-rendered via `generateStaticParams`. |

### `(dashboard)` — protected (any authenticated contractor)

| Route | File | Description |
|---|---|---|
| `/dashboard` | `src/app/(dashboard)/dashboard/page.tsx` | Overview: status count cards (new/contacted/booked/completed) + 5 most recent leads. |
| `/dashboard/leads` | `.../dashboard/leads/page.tsx` | Full leads table with status dropdown and inline notes. |
| `/dashboard/calls` | `.../dashboard/calls/page.tsx` | Call log (CallRail) with duration, recording, outcome. |
| `/dashboard/settings` | `.../dashboard/settings/page.tsx` | Business details + notifications toggle. |

### `(admin)` — protected (admin email only)

| Route | File | Description |
|---|---|---|
| `/admin/clients` | `src/app/(admin)/admin/clients/page.tsx` | All clients with status/plan/Stripe badges. |
| `/admin/clients/new` | `.../clients/new/page.tsx` | Create a client (provisions a GHL sub-account via server action). |
| `/admin/clients/[id]` | `.../clients/[id]/page.tsx` | Client detail: info, recent leads & calls, GHL link, "Create Login" for the contractor. |

### Auth

| Route | File | Description |
|---|---|---|
| `/login` | `src/app/login/page.tsx` | Email/password sign-in. |
| `/auth/callback` | `src/app/auth/callback/route.ts` | Supabase PKCE code exchange / OTP verify; redirects to `next` or `/admin`. |

---

## Next.js API Routes

### `POST /api/get-started`
`src/app/api/get-started/route.ts`

Marketing inquiry handler. Validates with `getStartedSchema` (zod), then sends a formatted HTML+text email via **Resend** — **To** `hello@tradeflow-technologies.com`, **CC** `contact@tradeflow-technologies.com`, with `replyTo` set to the submitter.

- Reads: `RESEND_API_KEY`, `GET_STARTED_FROM_EMAIL` (default `no-reply@tradeflow-technologies.com`)
- Returns: `200 {success:true}` · `400 VALIDATION_ERROR` · `500 CONFIG_ERROR` (key missing) · `502 EMAIL_ERROR`

### `POST /api/leads/submit`
`src/app/api/leads/submit/route.ts`

Inbound lead capture from the per-client landing pages. Validates with `leadSchema`, then:

1. Inserts into Supabase `leads` (service-role client, bypasses RLS) with a **5-minute idempotency** check on `(client_id, phone)`.
2. Returns `200 {success, lead_id}` **immediately**, then runs the rest in `after()` (non-blocking, best-effort):
   - **GoHighLevel** — look up/create contact, store `ghl_contact_id`, enroll in the SMS workflow, write an `sms_sequences` row.
   - **Resend** — email the lead to the contractor's address.

- Reads: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GHL_PRIVATE_TOKEN`, `GHL_SMS_WORKFLOW_ID`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `NEXT_PUBLIC_APP_URL`

> Stripe, GoHighLevel, and CallRail **webhooks** are handled by the FastAPI service (`api/`), not here.

---

## Project Structure

```
apps/web/
├── src/
│   ├── app/
│   │   ├── (marketing)/        # / and /get-started (public)
│   │   ├── (landing)/          # /{clientSlug}/{service} (public, per client)
│   │   ├── (dashboard)/        # /dashboard/* (contractor, auth-gated)
│   │   ├── (admin)/            # /admin/* (admin-only)
│   │   ├── api/                # get-started, leads/submit route handlers
│   │   ├── auth/callback/      # Supabase auth callback
│   │   ├── login/
│   │   ├── layout.tsx          # root layout, fonts, metadata
│   │   └── globals.css         # Tailwind v4 theme tokens
│   ├── components/
│   │   ├── dashboard/          # count-cards, leads-table, calls-table,
│   │   │                       #   recent-leads, settings-form, sidebar-nav,
│   │   │                       #   status-select, notes-editor
│   │   ├── ui/                 # shadcn-style primitives (button, card,
│   │   │                       #   input, select, table, switch, badge, …)
│   │   └── lead-form.tsx       # landing-page lead capture → /api/leads/submit
│   ├── lib/
│   │   ├── supabase/           # client.ts, server.ts, admin.ts, types.ts
│   │   ├── actions/            # server actions: onboarding, create-client-login,
│   │   │                       #   lead-actions, settings-actions
│   │   ├── validations/        # zod: get-started, lead, onboarding, settings
│   │   ├── types/              # dashboard.ts, admin.ts
│   │   ├── utils/format.ts     # phone/date formatting helpers
│   │   ├── ghl.ts              # GoHighLevel API client
│   │   ├── admin.ts            # isAdmin(email) gate
│   │   └── utils.ts            # cn() etc.
│   └── middleware.ts           # refreshes Supabase session on every request
├── public/                     # logos, favicons, marketing SVGs
├── .env.example                # documented env template
└── package.json
```

### `lib/` reference

| File | Purpose |
|---|---|
| `supabase/client.ts` | Browser Supabase client (anon key, RLS enforced). |
| `supabase/server.ts` | Server client with cookie handling for Server Components/Actions. |
| `supabase/admin.ts` | Service-role client (bypasses RLS) — server-only. |
| `supabase/types.ts` | Generated DB types (stub until post-deploy generation). |
| `ghl.ts` | `createGHLContact`, `lookupContactByPhone`, `addContactToWorkflow`, `createSubAccount`. |
| `admin.ts` | `isAdmin(email)` — checks `ADMIN_EMAILS`/`ADMIN_EMAIL`. |
| `actions/onboarding-actions.ts` | Create client record + provision GHL sub-account. |
| `actions/create-client-login.ts` | Create auth user + `client_users` join row. |
| `actions/lead-actions.ts` | Update lead status/notes. |
| `actions/settings-actions.ts` | Update client settings / notifications toggle. |
| `validations/*` | Shared zod schemas (used on both client and server). |

---

## Auth & Multi-Tenancy

- **Sessions** — `middleware.ts` runs on every non-asset request and calls `supabase.auth.getUser()` to refresh the cookie-based session (`@supabase/ssr`).
- **Route protection** — the `(dashboard)` and `(admin)` route-group layouts guard access:
  - `(dashboard)` requires an authenticated user (else → `/login`).
  - `(admin)` additionally requires `isAdmin(user.email)`.
- **Multi-tenancy via RLS** — the `client_users` table maps `auth.users.id → client_id`. Tenant tables (`leads`, `calls`, `sms_sequences`, `billing`) carry RLS policies scoping rows to the caller's client(s):

  ```sql
  client_id IN (SELECT client_id FROM client_users WHERE user_id = auth.uid())
  ```

- **Service role** — server-side writes that must bypass RLS (e.g. inbound lead insert in `/api/leads/submit`, admin operations) use `SUPABASE_SERVICE_ROLE_KEY`. **Never expose this key to the browser.**

---

## Database

Migrations live in `supabase/migrations/` (plus `supabase/seed.sql`):

- `001_initial_schema.sql` — all tables + RLS policies
- `002_add_slug_to_clients.sql` — `slug` for landing-page routing
- `003_add_notifications_enabled.sql` — notifications toggle + UPDATE policy
- `004_enable_rls_client_users.sql` — enable RLS on `client_users` with a self-read-only policy
- `005_add_leads_callrail_call_id_unique.sql` — race-safe unique index for missed-call lead dedup
- `006_add_ghl_token_to_clients.sql` — per-client encrypted GHL Private Integration Token column
- `007_add_reviews_to_clients.sql` — per-client review rating/count for landing-page trust block
- `008_least_privilege_rls.sql` — least-privilege RLS: SELECT + scoped UPDATE only, column-scoped grants
- `009_schema_integrity.sql` — CHECK constraints, missing indexes, `updated_at` bookkeeping

| Table | Purpose |
|---|---|
| `clients` | One row per HVAC company: business/owner/contact, `service_area_zips`, `slug`, `ghl_sub_account_id`, `callrail_tracking_number`, Stripe IDs, `plan`, `trial_ends_at`, `notifications_enabled`. |
| `leads` | Inbound leads: homeowner contact, `service_type`, `source`, `status` (`new`/`contacted`/`booked`/`completed`/`lost`), `lead_score`, `notes`, `ghl_contact_id`, `callrail_call_id`, lifecycle timestamps. |
| `calls` | CallRail-tracked calls: caller/tracking numbers, `duration_seconds`, `recording_url`, `transcript`, `outcome`. |
| `sms_sequences` | SMS follow-up touches: `touch_number`, `message_body`, `ghl_message_id`, `status` (`pending`/`sent`/`stopped`). |
| `billing` | Stripe invoice records: amount, currency, status, period, `paid_at`. |
| `client_users` | Identity join (`user_id ↔ client_id`, `role`); no RLS — used by other tables' policies. |

---

## Environment Variables

Copy `.env.example` → `.env.local` and fill in values. **Never commit `.env.local`** (it's gitignored).

| Variable | Used by | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | web | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | web (browser) | RLS-enforced anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | web (server only) | Bypasses RLS — server-side only |
| `RESEND_API_KEY` | web | Required for live email send |
| `RESEND_FROM_EMAIL` | web | From-address for lead notifications (default `leads@tradeflow.io`) |
| `GET_STARTED_FROM_EMAIL` | web | From-address for `/get-started` (default `no-reply@tradeflow-technologies.com`, verified domain) |
| `GHL_PRIVATE_TOKEN` | web + api | Fallback-only GHL token — each client's own token is stored encrypted on `clients.ghl_private_token_encrypted` and captured at onboarding; this var is used only when a client has none set |
| `GHL_TOKEN_ENC_KEY` | web | 32-byte hex (64 chars) AES-256-GCM key used to encrypt/decrypt per-client GHL tokens |
| `GHL_AGENCY_API_KEY` | web | Agency token for sub-account creation |
| `GHL_SMS_WORKFLOW_ID` | web | Workflow enrolled on new leads |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | api | Billing + webhook verification |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | web | Stripe client key |
| `CALLRAIL_ACCOUNT_ID` / `CALLRAIL_API_KEY` | (call tracking) | CallRail integration |
| `CALLRAIL_WEBHOOK_SECRET` | api | Signing secret for CallRail webhook signature verification (missed-call text-back) |
| `ADMIN_EMAIL` / `ADMIN_EMAILS` | web | Comma-separated list gating `/admin` |
| `NEXT_PUBLIC_APP_URL` | web | Base URL used in email links (`http://localhost:3000` in dev) |

> **Production note:** `.env.local` is not deployed. Set these in the **Vercel** project's Environment Variables (and the FastAPI ones in **Railway**), then redeploy.

---

## Getting Started

Prerequisites: **Node 20+**, npm, and a Supabase project (or the hosted one).

```bash
cd apps/web
npm install
cp .env.example .env.local   # then fill in values
npm run dev                  # http://localhost:3000
```

Apply database migrations to your Supabase project (via the Supabase CLI or SQL editor) using the files in `supabase/migrations/`.

### Running the FastAPI backend (optional, for webhooks)

```bash
cd ../../api
python3.12 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn api.main:app --reload --port 8000
# endpoints: GET /health · POST /api/webhooks/ghl · POST /api/webhooks/stripe · POST /api/webhooks/callrail
```

---

## Build, Lint & Deploy

```bash
npm run dev     # next dev --turbopack
npm run build   # next build --turbopack
npm run start   # serve the production build
```

- **Web → Vercel.** Connected to `main`; pushes auto-deploy. Set all `web` env vars in the project settings.
- **API → Railway.** Uses `api/Procfile`: `web: uvicorn api.main:app --host 0.0.0.0 --port $PORT`.
- **DB → Supabase.** Apply migrations; generate types into `lib/supabase/types.ts` post-deploy.

---

## Styling & Brand

- **Tailwind v4**, configured entirely in `src/app/globals.css` via `@import "tailwindcss"` and an `@theme inline { … }` block of OKLCH tokens (background, foreground, primary, sidebar, chart colors, etc.). Dark mode via `@custom-variant dark`.
- **Brand color:** metallic gold **`#D4AF37`** on a near-black background.
- **Fonts** (loaded in `src/app/layout.tsx`):
  - **Poppins** (Google) — default sans (`--font-sans`)
  - **Geist Mono** (Google) — mono (`--font-geist-mono`)
  - **Gambetta** (Fontshare) — serif display for marketing/landing headings
  - **General Sans** (Fontshare) — marketing body
- Brand assets (`logo.svg`, `logo-icon.svg`, favicons, marketing SVGs) live in `public/`.

---

## Conventions

- **Validation is shared.** Define the zod schema once in `lib/validations/*` and use it on both the client (`@hookform/resolvers/zod`) and the server (`safeParse` in the route).
- **RLS first.** Trust RLS for tenant isolation; reach for the service-role client only in server code that genuinely must bypass it.
- **`getUser()`, not `getSession()`** in Server Components — it revalidates with the Auth server.
- **Auth-gated pages** are dynamic; never statically cache a response that depends on the session.
- **Webhooks verify signatures** and return `200` fast, processing asynchronously (`after()` in Next, `BackgroundTasks` in FastAPI).
- **Slow third-party work is best-effort** and runs after the response so lead capture never blocks on GHL/Resend.

---

*HVAC client landing pages have their own contractor-owned lead form (`/api/leads/submit`) and click-to-call — those route to the **contractor**, not to Tradeflow. The marketing CTAs and `/get-started` form route to Tradeflow.*
