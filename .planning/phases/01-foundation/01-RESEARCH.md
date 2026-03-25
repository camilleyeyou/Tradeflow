# Phase 1: Foundation - Research

**Researched:** 2026-03-25
**Domain:** Supabase multi-tenant schema + RLS, Supabase Auth, Next.js 15 App Router scaffold, FastAPI scaffold on Railway, environment variable configuration
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Cloud-only Supabase for MVP — no local Supabase CLI / Docker setup. Connect directly to the Supabase cloud project for development.
- **D-02:** Migrations are SQL files in `/supabase/migrations/`, applied via Supabase dashboard or CLI push. Append-only — never modify existing migration files.
- **D-03:** TypeScript types generated via `supabase gen types typescript` after schema is deployed. Types live in `apps/web/lib/supabase/types.ts`.
- **D-04:** Simple directory structure as defined in PROJECT.md — `apps/web/` (Next.js) and `api/` (FastAPI) in one repo. No monorepo tooling (no Turborepo, no pnpm workspaces). Plain npm for the Next.js app, pip/venv for FastAPI.
- **D-05:** Three Next.js route groups scaffolded: `(landing)`, `(dashboard)`, `(admin)`. Each with its own layout.tsx. Marketing routes under `(marketing)`.
- **D-06:** Use `@supabase/ssr` package (not deprecated `auth-helpers-nextjs`). Cookie-based sessions. Never use `supabase.auth.getSession()` in Server Components — always use `supabase.auth.getUser()` to revalidate the token.
- **D-07:** Never initialize the Supabase client at module level — create per-request to avoid session leaks on Vercel's Fluid Compute.
- **D-08:** Admin access determined by checking authenticated user's email against `ADMIN_EMAIL` env var in middleware. Admin uses magic link login. HVAC owners use email/password.
- **D-09:** Next.js middleware checks for Supabase session on `(dashboard)` and `(admin)` route groups. No session → redirect to `/login`.
- **D-10:** Seed data: `seed.sql` creates one test client (Oak Park HVAC) and one test lead, plus a test user in `client_users` for RLS testing.
- **D-11:** RLS verification: after schema deploy, create a test user JWT and confirm cross-tenant queries return zero rows. This is the Phase 1 exit gate — multi-tenancy must be proven before any feature work.
- **D-12:** No unit test framework setup in Phase 1. The only required test is the RLS cross-tenant integration test.

### Claude's Discretion

- Exact folder structure within `apps/web/components/` and `apps/web/lib/`
- FastAPI project structure within `api/` (routers, services, models layout)
- Choice of Python virtual environment tool (venv, poetry, uv)
- Specific Tailwind v4 configuration approach

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FOUN-01 | Supabase schema deployed with all 7 tables (clients, leads, calls, sms_sequences, billing, client_users) and indexes | Full schema with indexes is defined verbatim in `CLAUDE (1).md` — copy-paste migration; `client_users` is the 6th table; indexes defined in same file |
| FOUN-02 | Row Level Security enabled on all tables with policies enforcing per-client data isolation | RLS policies and `ENABLE ROW LEVEL SECURITY` statements are in the schema; verification pattern via `pg_tables` documented in PITFALLS.md |
| FOUN-03 | Supabase Auth configured with email/password for HVAC owners and magic link for admin | Standard Supabase Auth config — email/password and magic link are native providers; admin identity checked via `ADMIN_EMAIL` env var in middleware |
| FOUN-04 | Next.js 15 App Router project scaffolded with TypeScript strict mode and Tailwind v4 | `create-next-app@15` with `--typescript --tailwind --app` flags; route group structure defined in ARCHITECTURE.md; strict mode is default in new Next.js 15 projects |
| FOUN-05 | FastAPI backend scaffolded with Pydantic v2, async handlers, and Supabase service role client | `fastapi[standard]` installs uvicorn + pydantic v2; health endpoint pattern from Railway docs; Supabase Python client v2 for service role connection |
| FOUN-06 | Environment variables configured for Supabase, Stripe, GHL, Resend across both apps | Full env var listing for both `apps/web/.env.local` and `api/.env` is defined in `CLAUDE (1).md` — both files have complete variable names |
</phase_requirements>

---

## Summary

Phase 1 is a pure infrastructure and scaffolding phase — no product features are built, but every subsequent phase depends on correctness here. The scope is: deploy the Supabase schema with all six tables and RLS policies, configure authentication for two user types (HVAC owner via email/password, admin via magic link), scaffold the Next.js 15 app with four route groups, scaffold the FastAPI service with a health endpoint and Supabase service role client, and configure environment variables across both apps.

The most important work in this phase is the Supabase schema and RLS policies. The complete schema is defined verbatim in `CLAUDE (1).md` including all table DDL, RLS `ENABLE ROW LEVEL SECURITY` statements, policies, and indexes. No schema design decisions remain — execution is the only work. The single exit gate for the phase (D-11) requires proving multi-tenancy works before any feature code is written: create a second test user and confirm that cross-tenant queries return zero rows from the dashboard client SDK (not the SQL Editor, which bypasses RLS as superuser).

The supporting stack patterns are well-documented across the existing research files. The key discipline items are: never initialize Supabase client at module level, always use `getUser()` not `getSession()`, keep the service role key out of any `NEXT_PUBLIC_` env var, and use `@supabase/ssr` not the deprecated `auth-helpers-nextjs`. FastAPI scaffold requires `fastapi[standard]` (includes uvicorn + pydantic v2), `httpx`, `supabase` Python client, and `python-dotenv`.

**Primary recommendation:** Execute the schema migration first, run the RLS cross-tenant verification test immediately after, then scaffold both apps in parallel. Do not proceed to Phase 2 until the RLS test passes with a real client SDK JWT — the SQL Editor cannot be used for this test as it runs as superuser and bypasses all policies.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 15.5.x | Frontend — landing pages, dashboard, admin | App Router, route groups, static generation; single Vercel deployment |
| React | 19.x | UI runtime | Bundled with Next.js 15; required by shadcn/ui |
| Tailwind CSS | 4.x | Styling | Zero-config with Next.js 15.3+; `@tailwindcss/postcss` plugin; no `tailwind.config.js` needed |
| TypeScript | 5.x | Type safety | Strict mode required per CLAUDE.md; no `any`, no `@ts-ignore` |
| `@supabase/supabase-js` | 2.99.x | Supabase client (browser + server) | All database queries from Next.js |
| `@supabase/ssr` | latest | SSR-safe Supabase client for App Router | Cookie-based auth; replaces deprecated `auth-helpers-nextjs` |
| FastAPI | 0.135.x | Backend API service | Async webhook processing; Railway deployment first-class |
| Python | 3.12 | FastAPI runtime | Widest package compatibility on Railway |
| Pydantic | 2.x | Request/response validation | Ships with `fastapi[standard]`; v1 syntax deprecated |
| uvicorn | 0.30.x | ASGI server | Included via `fastapi[standard]` install |
| `supabase` (Python) | 2.x | Supabase client for FastAPI | Service role key; bypasses RLS for server-side writes |
| `httpx` | 0.27.x | Async HTTP client | FastAPI outbound calls to GHL/Resend; never use `requests` |
| `python-dotenv` | 1.x | `.env` loading for dev | Dev only; Railway injects env vars directly in production |

### Supporting (Phase 1 scaffold only)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| shadcn/ui | latest (CLI) | Component library | CLI init only in Phase 1; components added in later phases |
| `prettier` | 3.x | Code formatting | Dev dependency; install with `prettier-plugin-tailwindcss` |
| `@types/node` | 22.x | Node type definitions | Match Vercel Node.js 20 runtime |

### Installation

```bash
# Next.js app — create from apps/ directory
npx create-next-app@15 web --typescript --tailwind --app --src-dir
cd web

# Core Supabase dependencies
npm install @supabase/supabase-js @supabase/ssr

# Dev tooling
npm install -D prettier prettier-plugin-tailwindcss

# shadcn/ui init (interactive — run after project creation)
npx shadcn@latest init
```

```bash
# FastAPI service — from api/ directory
python3 -m venv .venv
source .venv/bin/activate

pip install "fastapi[standard]"   # includes uvicorn, pydantic v2
pip install httpx
pip install "supabase>=2.0"
pip install python-dotenv
pip install stripe                 # Python SDK v10.x — for later webhook verification

# Save dependencies
pip freeze > requirements.txt
```

**Version notes:**
- shadcn/ui has peer dep warnings with React 19 — use `--legacy-peer-deps` flag if prompted during `npm install`
- Tailwind v4 requires `postcss.config.mjs` to use `@tailwindcss/postcss`, not `tailwindcss` (auto-configured by `create-next-app@15`)
- Do not pin `@supabase/ssr` to a version — it uses `latest` intentionally to pick up auth token refresh fixes

---

## Architecture Patterns

### Project Directory Structure

```
tradeflow/                         (repo root)
├── CLAUDE.md
├── CLAUDE (1).md                  (full project spec — read-only reference)
├── .env.example                   (commit this)
├── apps/
│   └── web/                       (Next.js 15 app)
│       ├── app/
│       │   ├── (marketing)/
│       │   │   └── page.tsx
│       │   ├── (landing)/
│       │   │   └── [clientSlug]/
│       │   │       └── page.tsx
│       │   ├── (dashboard)/
│       │   │   ├── layout.tsx     (auth guard — supabase.auth.getUser())
│       │   │   └── leads/
│       │   ├── (admin)/
│       │   │   ├── layout.tsx     (admin guard — email === ADMIN_EMAIL)
│       │   │   └── clients/
│       │   └── api/
│       │       └── leads/submit/route.ts
│       ├── components/
│       │   ├── ui/
│       │   ├── landing/
│       │   └── dashboard/
│       ├── lib/
│       │   └── supabase/
│       │       ├── client.ts      (browser client — anon key)
│       │       ├── server.ts      (server component client — cookie-based)
│       │       └── admin.ts       (service role client — admin routes only)
│       └── middleware.ts          (session check, route protection)
├── api/                           (FastAPI service)
│   ├── main.py
│   ├── routers/
│   │   ├── health.py
│   │   ├── leads.py
│   │   └── webhooks.py
│   ├── services/
│   │   └── supabase_client.py
│   ├── models/
│   │   └── schemas.py
│   ├── requirements.txt
│   └── .env
└── supabase/
    ├── migrations/
    │   └── 001_initial_schema.sql
    └── seed.sql
```

### Pattern 1: Supabase Client Separation (Three Clients)

**What:** Three distinct Supabase client files with strict import discipline — browser client (anon key), server component client (cookie-based session), admin client (service role key).

**When to use:** Every file that queries Supabase must import from exactly one of these three. The admin client must never be imported outside of `(admin)/` route group files.

**Example:**
```typescript
// apps/web/lib/supabase/client.ts — browser safe, anon key only
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

```typescript
// apps/web/lib/supabase/server.ts — Server Components, cookie-based
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()  // MUST be awaited — Next.js 15 async API
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}
```

```typescript
// apps/web/lib/supabase/admin.ts — service role, NEVER import outside (admin)/
import { createClient } from '@supabase/supabase-js'

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}
```

### Pattern 2: Next.js Middleware for Auth Route Protection

**What:** Middleware intercepts every request to `(dashboard)` and `(admin)` routes, calls `supabase.auth.getUser()` to validate the session, and redirects to `/login` if unauthenticated. Uses `@supabase/ssr` middleware helper to refresh tokens in cookies.

**When to use:** Required for cookie-based auth in App Router. Without it, session cookies expire and users are silently logged out mid-session.

**Example:**
```typescript
// apps/web/middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // CRITICAL: getUser() not getSession() — revalidates the token
  const { data: { user } } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname
  const isDashboard = path.startsWith('/dashboard') || path.includes('/(dashboard)')
  const isAdmin = path.startsWith('/admin') || path.includes('/(admin)')

  if ((isDashboard || isAdmin) && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Admin gate: email must match ADMIN_EMAIL env var
  if (isAdmin && user?.email !== process.env.ADMIN_EMAIL) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
```

### Pattern 3: FastAPI Scaffold with Health Endpoint

**What:** Minimal FastAPI entry point with lifespan hooks for initializing the Supabase service role client, and a `/health` endpoint that Railway uses for health checks.

**When to use:** Phase 1 scaffold — subsequent phases add routers to this file.

**Example:**
```python
# api/main.py
from contextlib import asynccontextmanager
from fastapi import FastAPI
from .routers import health
from .services.supabase_client import init_supabase

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_supabase()
    yield

app = FastAPI(title="Tradeflow API", lifespan=lifespan)
app.include_router(health.router)
```

```python
# api/routers/health.py
from fastapi import APIRouter

router = APIRouter()

@router.get("/health")
async def health_check():
    return {"status": "ok"}
```

```python
# api/services/supabase_client.py
import os
from supabase import create_client, Client

_supabase: Client | None = None

def init_supabase() -> None:
    global _supabase
    _supabase = create_client(
        os.environ["SUPABASE_URL"],
        os.environ["SUPABASE_SERVICE_ROLE_KEY"],
    )

def get_supabase() -> Client:
    if _supabase is None:
        raise RuntimeError("Supabase client not initialized")
    return _supabase
```

### Pattern 4: RLS Policy Structure

**What:** Every table gets `ENABLE ROW LEVEL SECURITY` in the same migration file as `CREATE TABLE`. Policies derive tenant identity from `auth.uid()` through the `client_users` join table — never from `user_metadata` (user-modifiable) or from a request body parameter.

**When to use:** Every table with a `client_id` foreign key. The `client_users` table itself has no RLS (it is the identity mapping source).

**Example:**
```sql
-- In 001_initial_schema.sql (already defined in CLAUDE (1).md — use verbatim)
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leads: owner sees own leads"
  ON public.leads FOR ALL
  USING (
    client_id IN (
      SELECT client_id FROM public.client_users
      WHERE user_id = auth.uid()
    )
  );

-- Required: index on every client_id column used in RLS USING clauses
CREATE INDEX leads_client_id_idx ON public.leads(client_id);
```

### Anti-Patterns to Avoid

- **Module-level Supabase client in Next.js:** Vercel Fluid Compute reuses warm instances across requests; module-level clients leak sessions between users. Always initialize inside the request handler.
- **`getSession()` in Server Components:** Does not revalidate the auth token; can serve stale or expired sessions. Always use `getUser()`.
- **Synchronous `cookies()` / `headers()` in Next.js 15:** These APIs are async in Next.js 15. Synchronous access throws a deprecation warning today and will throw in Next.js 16. Always `await cookies()`.
- **Service role key with `NEXT_PUBLIC_` prefix:** `NEXT_PUBLIC_` variables are bundled into the browser bundle. The service role key bypasses all RLS. Never put it in a public env var.
- **Testing RLS in the Supabase SQL Editor:** The SQL Editor runs as superuser and bypasses all RLS policies. Always test from the JS client SDK with a real user JWT.
- **`@supabase/auth-helpers-nextjs`:** Officially deprecated. Causes session refresh bugs in App Router. Use `@supabase/ssr` exclusively.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Auth session management in Next.js App Router | Custom JWT handling, cookie parsing | `@supabase/ssr` `createServerClient` with cookie helpers | Token refresh, PKCE, cookie rotation all handled; getting this wrong causes session leaks |
| Multi-tenancy enforcement | Per-route `client_id` checks in application code | Supabase RLS policies on every table | Application-level checks can be bypassed by passing a fabricated `client_id`; RLS cannot |
| Password hashing and magic link | Custom auth flows | Supabase Auth email/password + magic link providers | Secure implementation details (rate limiting, token expiry) are handled by Supabase |
| ASGI server for FastAPI | Custom server setup | `uvicorn[standard]` via `fastapi[standard]` | Production extras (WebSocket support, reload, graceful shutdown) included |
| Async HTTP client for FastAPI | `requests` library or `urllib` | `httpx.AsyncClient` | `requests` is synchronous — blocks the FastAPI event loop under concurrent webhook load |

**Key insight:** Multi-tenancy in Supabase is enforced at the database layer. There is no need to write `WHERE client_id = $current_user_client_id` in application queries — the RLS policy adds this filter automatically for every authenticated request using the anon/user JWT.

---

## Common Pitfalls

### Pitfall 1: RLS Disabled by Default on New Tables

**What goes wrong:** Tables created without an explicit `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` statement are fully readable by any authenticated user. Supabase returns all rows silently — no error is raised.

**Why it happens:** Developers apply migrations piecemeal and forget the RLS enable statement, or assume it inherits from the schema.

**How to avoid:** In `001_initial_schema.sql`, every `CREATE TABLE` is immediately followed by `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` and its policy in the same migration file. The schema in `CLAUDE (1).md` already contains these statements — use it verbatim without modification.

**Warning signs:**
- `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public'` shows `rowsecurity = false` for any table
- A user querying from the client SDK gets rows belonging to other tenants (no error, just wrong data)

**Verification (Phase 1 exit gate):** Run `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public'` — every table must show `rowsecurity = true`.

---

### Pitfall 2: getSession() Instead of getUser() in Server Components

**What goes wrong:** `supabase.auth.getSession()` reads the session from the cookie without revalidating it against the auth server. An expired or revoked token passes the check and the user sees protected content they should not.

**Why it happens:** The Supabase quickstart docs historically showed `getSession()`. Many tutorials still use it.

**How to avoid:** Use `supabase.auth.getUser()` in every Server Component and middleware. It sends a request to the Supabase Auth server to validate the token on every call. The performance overhead is acceptable because server components do not run in a hot loop.

---

### Pitfall 3: Synchronous cookies() / headers() in Next.js 15

**What goes wrong:** `cookies()` and `headers()` became async APIs in Next.js 15. Code that calls them synchronously (the v14 pattern) triggers deprecation warnings today and will throw in Next.js 16.

**Why it happens:** Most tutorials and blog posts were written for Next.js 14.

**How to avoid:** Always `await cookies()` and `await headers()` in Server Components and Route Handlers. The `createClient()` function in `lib/supabase/server.ts` must be `async` and must `await cookies()`.

---

### Pitfall 4: Vercel Deployment Protection Blocking External Webhooks

**What goes wrong:** Vercel's Deployment Protection (enabled by default on preview deployments) intercepts unauthenticated POST requests from external services with a 401. Stripe, CallRail, and GHL webhooks are silently dropped.

**Why it happens:** Deployment Protection is enabled without realizing it intercepts API routes. Local testing (where protection is off) passes while production receives nothing.

**How to avoid:** All inbound webhooks route to the FastAPI service on Railway — not to Next.js API routes on Vercel. This is the architectural decision already locked in CONTEXT.md and ARCHITECTURE.md. The `apps/web/api/` directory in Phase 1 only contains the `/leads/submit` route, which is called by the Next.js frontend (not an external webhook).

---

### Pitfall 5: Service Role Key Exposed in Browser Bundle

**What goes wrong:** `SUPABASE_SERVICE_ROLE_KEY` (or any secret) prefixed with `NEXT_PUBLIC_` appears in every browser bundle. Any user can extract it from the page source and use it to bypass all RLS policies.

**Why it happens:** `NEXT_PUBLIC_` is the pattern for making env vars available to client components. Developers unfamiliar with the distinction apply it to all Supabase variables.

**How to avoid:**
- Only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` get the `NEXT_PUBLIC_` prefix.
- `SUPABASE_SERVICE_ROLE_KEY` never gets a `NEXT_PUBLIC_` prefix.
- Import `lib/supabase/admin.ts` only inside `(admin)/` route group files.

---

### Pitfall 6: sms_sequences RLS Policy Missing

**What goes wrong:** The `sms_sequences` table has `ENABLE ROW LEVEL SECURITY` in the schema but the `CLAUDE (1).md` spec does not include an explicit RLS policy for it. Without a policy, RLS-enabled tables default to denying all access — the HVAC owner cannot read their SMS sequence records.

**Why it happens:** The schema DDL in `CLAUDE (1).md` defines RLS policies for `clients`, `leads`, `calls`, and `billing` but not for `sms_sequences`. This is likely a documentation gap rather than an intentional omission.

**How to avoid:** Add an explicit policy for `sms_sequences` in the migration that mirrors the `leads` policy — `sms_sequences` belongs to a lead which belongs to a client, so ownership must be resolved through the join:

```sql
ALTER TABLE public.sms_sequences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sms_sequences: owner sees own sequences"
  ON public.sms_sequences FOR ALL
  USING (
    lead_id IN (
      SELECT id FROM public.leads
      WHERE client_id IN (
        SELECT client_id FROM public.client_users
        WHERE user_id = auth.uid()
      )
    )
  );
```

**Warning signs:** Dashboard queries to `sms_sequences` return zero rows even when records exist for the authenticated client.

---

## Code Examples

Verified patterns from official sources and existing research:

### Supabase Schema Migration (verbatim from CLAUDE (1).md)

```sql
-- supabase/migrations/001_initial_schema.sql
-- Use this file verbatim — it is the canonical schema for Phase 1

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
  plan                 text not null default 'starter',
  is_active            boolean not null default true,
  trial_ends_at        timestamptz,
  created_at           timestamptz not null default now()
);

-- (leads, calls, sms_sequences, billing tables follow — see CLAUDE (1).md)

-- client_users join table: maps auth.uid() → client_id for RLS
create table public.client_users (
  user_id   uuid not null references auth.users(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  role      text not null default 'owner',
  primary key (user_id, client_id)
);

-- Enable RLS on all tables
alter table public.clients       enable row level security;
alter table public.leads         enable row level security;
alter table public.calls         enable row level security;
alter table public.sms_sequences enable row level security;
alter table public.billing       enable row level security;

-- Indexes on all client_id columns used in RLS policies
create index leads_client_id_idx     on public.leads(client_id);
create index leads_status_idx        on public.leads(status);
create index leads_created_at_idx    on public.leads(created_at desc);
create index calls_client_id_idx     on public.calls(client_id);
create index sms_lead_id_idx         on public.sms_sequences(lead_id);
```

### RLS Cross-Tenant Verification (Phase 1 Exit Gate)

```sql
-- Run after schema deploy from Supabase SQL Editor (as superuser — for admin check only)
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
-- Every table must show rowsecurity = true

-- Then verify from JS client SDK with a real JWT (NOT from SQL Editor)
-- Create two test users (user_a, user_b), each linked to different clients in client_users
-- Log in as user_a and query leads — should return only user_a's client's leads
-- Any row from user_b's client = RLS misconfiguration
```

### Seed Data Pattern

```sql
-- supabase/seed.sql
-- Creates test data for RLS verification

-- Test client 1 (Oak Park HVAC)
INSERT INTO public.clients (id, business_name, owner_name, email, phone, city)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Oak Park HVAC',
  'Test Owner A',
  'ownerA@test.com',
  '7085550001',
  'Oak Park'
);

-- Test client 2 (for cross-tenant isolation test)
INSERT INTO public.clients (id, business_name, owner_name, email, phone, city)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  'Berwyn HVAC',
  'Test Owner B',
  'ownerB@test.com',
  '7085550002',
  'Berwyn'
);

-- Test lead for client 1
INSERT INTO public.leads (client_id, homeowner_name, phone, service_type, source)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Jane Homeowner',
  '7085559999',
  'ac_repair',
  'landing_page'
);

-- After seeding, create auth users via Supabase dashboard or Auth API
-- Link them to clients via client_users table
-- INSERT INTO public.client_users (user_id, client_id) VALUES ('<auth_user_uuid>', '<client_uuid>');
```

### Environment Variables (.env.example)

```bash
# apps/web/.env.local (local development only — never commit real values)

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://yourproject.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...  # anon key — browser safe
SUPABASE_SERVICE_ROLE_KEY=eyJ...      # service role — SERVER SIDE ONLY, never NEXT_PUBLIC_

# Stripe (Phase 4 webhooks — configure now, use in Phase 4)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# GoHighLevel
GHL_API_KEY=
GHL_LOCATION_ID=

# CallRail
CALLRAIL_ACCOUNT_ID=
CALLRAIL_API_KEY=

# Resend
RESEND_API_KEY=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
ADMIN_EMAIL=camille@example.com       # admin magic link email
```

```bash
# api/.env (FastAPI — Railway injects these directly in production)
SUPABASE_URL=https://yourproject.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...      # backend always uses service role
GHL_API_KEY=
GHL_LOCATION_ID=
CALLRAIL_API_KEY=
RESEND_API_KEY=
RESEND_FROM_EMAIL=leads@tradeflow.io
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Railway Deployment Config for FastAPI

```
# api/Procfile (Railway auto-detects this)
web: uvicorn main:app --host 0.0.0.0 --port $PORT
```

```python
# api/main.py — Railway health check at /health
# Railway polls /health every 30 seconds; non-200 triggers restart
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `@supabase/auth-helpers-nextjs` | `@supabase/ssr` with `createServerClient` | 2023-2024 | auth-helpers is deprecated; causes session refresh bugs in App Router |
| `supabase.auth.getSession()` | `supabase.auth.getUser()` | 2024 | getSession reads from cookie without revalidation; getUser calls auth server |
| `cookies()` synchronous | `await cookies()` | Next.js 15 (Oct 2024) | Deprecation warning today; throws in Next.js 16 |
| `tailwind.config.js` | Zero-config (auto-scans) | Tailwind v4 (2025) | postcss.config.mjs uses `@tailwindcss/postcss`; no config file needed |
| Pydantic v1 `class Config` | Pydantic v2 `model_config = ConfigDict(...)` | FastAPI 0.100+ | v1 syntax deprecated; v2 is 5-50x faster |

**Deprecated/outdated:**
- `@supabase/auth-helpers-nextjs`: Replaced by `@supabase/ssr`. Do not install.
- `next lint` CLI command: Deprecated in Next.js 15.5. Use standalone `eslint` instead.
- GHL `X-WH-Signature` header: Deprecated July 1, 2026. Not relevant to Phase 1 (no GHL webhooks in this phase) but build the Phase 2 handler with both headers.
- GHL API v1: End-of-support. Use GHL API v2 (`services.leadconnectorhq.com`).

---

## Open Questions

1. **sms_sequences RLS policy**
   - What we know: The schema enables RLS on `sms_sequences` but the policy is missing from `CLAUDE (1).md`
   - What's unclear: Whether this is intentional (sms_sequences accessed only via FastAPI service role) or a documentation gap
   - Recommendation: Add the policy in the migration as described in Pitfall 6 — a deny-all with RLS enabled will silently return zero rows to the dashboard in Phase 3/5 when SMS sequence status is shown; better to add the policy now

2. **Supabase CLI availability for type generation**
   - What we know: D-03 requires `supabase gen types typescript` but the Supabase CLI is not installed on this machine (verified: `supabase CLI: not found`)
   - What's unclear: Whether the developer will install the CLI or use the Supabase dashboard's type download feature instead
   - Recommendation: Plan should include a task to install the Supabase CLI (`brew install supabase/tap/supabase`) or document the alternative (Supabase dashboard → Settings → API → "Download types")

3. **`client_users` RLS policy**
   - What we know: `client_users` is the join table that all other RLS policies depend on. The schema in `CLAUDE (1).md` does not enable RLS on `client_users` itself or add a policy
   - What's unclear: Whether this is intentional (the table should be readable by authenticated users to resolve their own tenant) or a gap
   - Recommendation: Leave `client_users` without RLS (accessible to authenticated users via the anon key) since RLS policies on other tables query it directly using `auth.uid()`. Authenticated users can only read their own mapping via the policy chain. However, verify in the Supabase dashboard after deploy that a user cannot enumerate other users' `client_users` rows.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| Node.js | Next.js app build + npm | Yes | v24.13.0 | — |
| npm | Package installation | Yes | 11.6.2 | — |
| Python 3 | FastAPI service | Yes | 3.13.11 | — |
| pip | Python package installation | Yes | 25.0.1 | — |
| Vercel CLI | Optional deployment | Yes | 48.2.9 | Deploy via Vercel dashboard |
| Supabase CLI | Type generation (D-03) | No | — | Download types from Supabase dashboard |
| Railway CLI | Optional deployment | No | — | Deploy via Railway dashboard or GitHub integration |
| Docker | Not required (D-01: cloud-only) | Not checked | — | N/A — intentionally excluded |

**Missing dependencies with no fallback:**
- None that block execution.

**Missing dependencies with fallback:**
- **Supabase CLI:** Required for `supabase gen types typescript` (D-03). Fallback: Supabase dashboard → Settings → API → "Download TypeScript types". The plan should include a task to either install the CLI (`brew install supabase/tap/supabase`) or use the dashboard download.
- **Railway CLI:** Deployment can be done via Railway dashboard or GitHub push. No blocker.

**Note on Python version:** The project spec recommends Python 3.12 but Python 3.13.11 is installed. FastAPI 0.135.x supports Python up to 3.14, so 3.13 is compatible. However, Railway will run whatever Python version is configured in `runtime.txt` or `nixpacks.toml` — the local version discrepancy does not affect production.

---

## Project Constraints (from CLAUDE.md)

Extracted from `CLAUDE.md` (the GSD project instructions file) and `CLAUDE (1).md` (the full project specification):

### Mandatory Directives

- **TypeScript:** Strict mode on. No `any`. No `// @ts-ignore`. All types defined.
- **Next.js:** App Router only. No Pages Router. Server Components by default. `'use client'` only for interactivity/hooks.
- **Forms:** Use Server Actions for form mutations — not API routes for dashboard forms.
- **API routes:** Use Next.js API routes only for webhooks and external service callbacks.
- **Supabase:** Never use raw SQL in application code — use Supabase client methods (exception: complex queries via `.rpc()`).
- **Migrations:** Append-only. Never modify an existing migration file.
- **FastAPI:** All routes must have Pydantic request/response models. All handlers must be `async`. Webhooks must verify signatures before processing.
- **Error handling:** Webhooks must return 200 on processing errors (not 500) — Stripe/CallRail/GHL retry on 5xx causing duplicate processing. Failed processing must be logged.
- **Logging:** Never log full phone numbers or emails. Truncate: `+1312****1234`.
- **Security:** Service role key server-side only. No `NEXT_PUBLIC_` prefix on secrets. Validate all webhook signatures.
- **Naming:** snake_case for DB tables (plural), PascalCase for TypeScript types, kebab-case for URL slugs, SCREAMING_SNAKE_CASE for env vars.
- **GSD workflow:** All file changes must go through a GSD command (`/gsd:execute-phase`). No direct repo edits outside GSD workflow unless user explicitly bypasses.

### Forbidden Patterns

- `@supabase/auth-helpers-nextjs` — use `@supabase/ssr`
- `supabase.auth.getSession()` in Server Components — use `supabase.auth.getUser()`
- Module-level Supabase client initialization in Next.js
- `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` or any secret in `NEXT_PUBLIC_` prefix
- `requests` library in FastAPI async routes — use `httpx.AsyncClient`
- Pydantic v1 syntax (`class Config`) — use `model_config = ConfigDict(...)`
- `export const dynamic = 'force-static'` on auth-gated pages
- Synchronous `cookies()` / `headers()` — always `await`
- Phase 2/3/4 features in Phase 1 scope

---

## Sources

### Primary (HIGH confidence)

- `CLAUDE (1).md` (local file) — Full project spec, canonical database schema, env var definitions, API contracts, naming conventions, code rules
- `01-CONTEXT.md` (local file) — Phase 1 locked decisions D-01 through D-12
- `.planning/research/STACK.md` (local file) — Technology versions verified against official npm/PyPI, compatibility matrix
- `.planning/research/ARCHITECTURE.md` (local file) — Component structure, data flow, build order from official Supabase + FastAPI + Next.js docs
- `.planning/research/PITFALLS.md` (local file) — Pitfalls from official Supabase, Stripe, GHL, CallRail docs
- [Supabase SSR Next.js Guide](https://supabase.com/docs/guides/auth/server-side/nextjs) — `@supabase/ssr` patterns, `getUser()` vs `getSession()`
- [Supabase RLS official documentation](https://supabase.com/docs/guides/database/postgres/row-level-security) — RLS enable, policies, `pg_tables` verification
- [Next.js Upgrading to v15 Guide](https://nextjs.org/docs/app/guides/upgrading/version-15) — async cookies/headers, caching changes
- [FastAPI official docs](https://fastapi.tiangolo.com/tutorial/background-tasks/) — BackgroundTasks, async handlers
- [Railway FastAPI Deployment Guide](https://docs.railway.com/guides/fastapi) — Procfile, health check, env vars

### Secondary (MEDIUM confidence)

- `.planning/research/SUMMARY.md` (local file) — Cross-validated summary of stack, features, architecture, pitfalls
- [Supabase RLS best practices (MakerKit)](https://makerkit.dev/blog/tutorials/supabase-rls-best-practices) — Production multi-tenant patterns, verified against official docs

### Tertiary (LOW confidence)

- Environment availability probed via local `command -v` — valid for local dev machine; Railway environment is separate

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all library versions verified in STACK.md against official npm/PyPI sources; no new research required
- Architecture: HIGH — project structure defined verbatim in CLAUDE (1).md; patterns verified against official Supabase + Next.js docs
- Pitfalls: HIGH — critical pitfalls from official docs; one new pitfall identified (missing sms_sequences RLS policy, documented as Pitfall 6)
- Environment: MEDIUM — local machine checked; Railway/Vercel/Supabase cloud environments not probed (expected, they are configured at setup time)

**Research date:** 2026-03-25
**Valid until:** 2026-05-25 (60 days — stable foundational stack; `@supabase/ssr` and Next.js 15 patterns are stable)
