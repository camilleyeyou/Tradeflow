---
phase: 01-foundation
verified: 2026-03-25T00:00:00Z
status: gaps_found
score: 8/12 must-haves verified
re_verification: false
gaps:
  - truth: "A cross-tenant query from client SDK with a HVAC owner JWT returns zero rows from another tenant's data"
    status: failed
    reason: "Supabase cloud has not been deployed with real credentials. Both apps/web/.env.local (NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co placeholder) and api/.env (SUPABASE_URL empty) contain placeholder/empty values. The migration SQL file is correct, but it has not been applied to a live Supabase project."
    artifacts:
      - path: "apps/web/.env.local"
        issue: "NEXT_PUBLIC_SUPABASE_URL is still the template placeholder 'https://<project-ref>.supabase.co' — not a real Supabase project URL"
      - path: "api/.env"
        issue: "SUPABASE_URL= is empty — no real Supabase project URL set"
    missing:
      - "Fill apps/web/.env.local with real NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY from Supabase dashboard"
      - "Fill api/.env with real SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from Supabase dashboard"
      - "Apply supabase/migrations/001_initial_schema.sql to the Supabase project via SQL Editor"
      - "Apply supabase/seed.sql to insert the Oak Park HVAC test client and test lead"
      - "Run SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' and confirm rowsecurity=true for clients, leads, calls, sms_sequences, billing"
      - "Create testowner@tradeflow.test user in Supabase Auth and insert their UUID into client_users"
      - "Run cross-tenant SDK test: sign in as testowner, query leads, confirm 1 row; sign in as second user not in client_users, confirm 0 rows"

  - truth: "ROADMAP Success Criterion 5: SELECT tablename, rowsecurity FROM pg_tables shows rowsecurity=true for every table"
    status: failed
    reason: "Cannot be verified without a live Supabase project. Dependent on the same deployment gap as the cross-tenant test."
    artifacts:
      - path: "supabase/migrations/001_initial_schema.sql"
        issue: "File is correct and ready to deploy — but deployment to Supabase cloud has not occurred"
    missing:
      - "Apply migration to Supabase cloud and run the pg_tables verification query"

  - truth: "FOUN-01/FOUN-06: Environment variables configured for Supabase across both apps"
    status: partial
    reason: "Both .env files exist with all required keys present, but Supabase-related values remain placeholder/empty. Other vars (Stripe, GHL, Resend, CallRail) are intentionally empty as they are not needed until Phase 2. The Supabase values must be filled in before any app can connect to the database."
    artifacts:
      - path: "apps/web/.env.local"
        issue: "NEXT_PUBLIC_SUPABASE_URL is template placeholder; NEXT_PUBLIC_SUPABASE_ANON_KEY likely also empty; SUPABASE_SERVICE_ROLE_KEY needs verification"
      - path: "api/.env"
        issue: "SUPABASE_URL= is empty"
    missing:
      - "Set NEXT_PUBLIC_SUPABASE_URL to the real Supabase project URL"
      - "Set NEXT_PUBLIC_SUPABASE_ANON_KEY from Supabase dashboard Settings > API"
      - "Set SUPABASE_SERVICE_ROLE_KEY in both apps/web/.env.local and api/.env"
      - "Set SUPABASE_URL in api/.env"

  - truth: "FOUN-01: Schema has 7 tables per REQUIREMENTS.md / ROADMAP Success Criterion 1"
    status: partial
    reason: "REQUIREMENTS.md FOUN-01 and ROADMAP Success Criterion 1 both state '7 tables', but the migration contains exactly 6 tables (clients, leads, calls, sms_sequences, billing, client_users). The plan spec (01-01-PLAN.md) consistently states 6 tables. This is a documentation inconsistency between REQUIREMENTS/ROADMAP and the plan. The 6 tables implemented match the complete data model described in the plan — there is no 7th table missing from the domain logic."
    artifacts:
      - path: "supabase/migrations/001_initial_schema.sql"
        issue: "Contains 6 tables: clients, leads, calls, sms_sequences, billing, client_users. REQUIREMENTS.md says 7 — there is no documented 7th table."
    missing:
      - "Reconcile the '7 tables' claim in REQUIREMENTS.md FOUN-01 and ROADMAP Success Criterion 1 with the actual 6-table schema. Either update the requirement text to '6 tables' or document the intended 7th table."

human_verification:
  - test: "Supabase cross-tenant RLS isolation"
    expected: "testowner@tradeflow.test (linked in client_users) sees 1 lead; a second user not in client_users sees 0 leads when querying supabase.from('leads').select('*') via the JS SDK"
    why_human: "Requires a live Supabase Auth session using a real JWT — SQL Editor runs as superuser and bypasses RLS; only the anon key + real JWT path tests actual RLS enforcement"
  - test: "Next.js app boots and auth redirects work"
    expected: "localhost:3000 shows the marketing page; localhost:3000/dashboard redirects to /login; localhost:3000/admin redirects to /login"
    why_human: "Requires filling in real Supabase credentials in .env.local and running npm run dev — cannot be verified without a running server"
  - test: "FastAPI Supabase client connects to real database"
    expected: "uvicorn startup logs show no connection errors when SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are filled in with real credentials"
    why_human: "Currently tested with placeholder credentials only; real connectivity requires the Supabase project to be deployed and credentials filled in api/.env"
---

# Phase 1: Foundation Verification Report

**Phase Goal:** The data layer and both apps are running, multi-tenancy is enforced at the database level, and every subsequent phase can write to Supabase safely
**Verified:** 2026-03-25
**Status:** gaps_found
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| #  | Truth | Status | Evidence |
|----|-------|--------|----------|
| 1  | All 6 tables exist in public schema | VERIFIED | migration has 6 CREATE TABLE statements confirmed by grep |
| 2  | Every RLS-eligible table has enable row level security | VERIFIED | 5 ALTER TABLE statements (client_users intentionally excluded) |
| 3  | RLS policies exist for all 5 tables including sms_sequences | VERIFIED | 5 CREATE POLICY statements; sms_sequences uses correct 2-hop join |
| 4  | Cross-tenant query returns zero rows from another tenant's data | FAILED | Supabase cloud not deployed; both env files have placeholder/empty URLs |
| 5  | Seed data includes Oak Park HVAC client and one test lead | VERIFIED | seed.sql contains both; fixed UUID a0000000-0000-0000-0000-000000000001 |
| 6  | Next.js app boots with no TypeScript errors in strict mode | VERIFIED | npx tsc --noEmit exits 0; tsconfig.json has "strict": true |
| 7  | Route groups (marketing), (landing), (dashboard), (admin) exist | VERIFIED | All 4 directories and required files confirmed |
| 8  | Supabase browser client uses createBrowserClient from @supabase/ssr | VERIFIED | client.ts confirmed; no auth-helpers-nextjs import anywhere |
| 9  | Supabase server client uses createServerClient with awaited cookies() | VERIFIED | server.ts has async createClient() and const cookieStore = await cookies() |
| 10 | Middleware uses getUser() not getSession() | VERIFIED | middleware.ts confirmed; supabase.auth.getUser() on line 25 |
| 11 | FastAPI GET /health returns {"status":"ok"} with HTTP 200 | VERIFIED | Live spot-check confirmed 200 response with {"status":"ok"} |
| 12 | Environment variables configured for both apps | PARTIAL | Keys all present; Supabase values are placeholder/empty in both apps |

**Score:** 8/12 truths verified (4 partial/failed)

Note on table count: REQUIREMENTS.md FOUN-01 and ROADMAP Success Criterion 1 both say "7 tables." The migration contains 6 tables, consistent with the plan spec (01-01-PLAN.md). There is no documented 7th table in the domain model. This is a requirements documentation inconsistency, not a missing implementation.

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `supabase/migrations/001_initial_schema.sql` | 6 tables, 5 RLS enables, 5 policies, 5 indexes | VERIFIED | 6 tables, 5 RLS, 5 policies, 5 indexes confirmed |
| `supabase/seed.sql` | Oak Park HVAC client + 1 test lead | VERIFIED | Both rows present; UUID matches plan spec |
| `apps/web/src/lib/supabase/client.ts` | createBrowserClient (anon key) | VERIFIED | Matches plan interface verbatim |
| `apps/web/src/lib/supabase/server.ts` | createServerClient, async, await cookies() | VERIFIED | Matches plan interface verbatim |
| `apps/web/src/lib/supabase/admin.ts` | createAdminClient (service role, persistSession: false) | VERIFIED | Matches plan interface verbatim |
| `apps/web/middleware.ts` | Route protection using getUser(), ADMIN_EMAIL check | VERIFIED | Both checks confirmed on lines 25 and 37 |
| `apps/web/src/app/(dashboard)/layout.tsx` | Auth guard with getUser() | VERIFIED | Imports server client; calls getUser(); redirects to /login |
| `apps/web/src/app/(admin)/layout.tsx` | Auth guard + ADMIN_EMAIL email check | VERIFIED | Checks user.email !== process.env.ADMIN_EMAIL |
| `apps/web/src/app/login/page.tsx` | signInWithPassword + signInWithOtp | VERIFIED | Both auth modes present and wired to Supabase client |
| `apps/web/src/lib/supabase/types.ts` | TypeScript Database types | STUB | Placeholder with Record<string,unknown> — awaiting supabase gen types after deployment |
| `api/main.py` | lifespan hook calling init_supabase, include_router(health.router) | VERIFIED | Matches plan interface verbatim |
| `api/routers/health.py` | async def health_check returning {"status":"ok"} | VERIFIED | Confirmed; spot-check returned HTTP 200 |
| `api/services/supabase_client.py` | SUPABASE_SERVICE_ROLE_KEY, init_supabase(), get_supabase() | VERIFIED | All three present; singleton pattern correct |
| `api/requirements.txt` | fastapi, uvicorn, pydantic, httpx, supabase, python-dotenv, stripe | VERIFIED | All 7 packages confirmed; pydantic==2.12.5 (v2) |
| `api/Procfile` | uvicorn api.main:app --host 0.0.0.0 --port $PORT | VERIFIED | Exact command confirmed |
| `api/.env.example` | All keys, empty values | VERIFIED | 9 keys present; all values empty |
| `apps/web/.env.example` | All keys, empty values | VERIFIED | 14 keys present; all values empty; SUPABASE_SERVICE_ROLE_KEY has no NEXT_PUBLIC_ prefix |
| `apps/web/.env.local` | Real Supabase URL populated | FAILED | NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co (placeholder) |
| `api/.env` | Real SUPABASE_URL populated | FAILED | SUPABASE_URL= (empty) |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `client_users.user_id` | `auth.users.id` | RLS USING: auth.uid() in client_users subquery | VERIFIED | Pattern found in all 4 policies that reference client_users |
| `leads.client_id` | `clients.id` | RLS policy on leads table using client_id in subquery | VERIFIED | "leads: owner sees own leads" policy confirmed |
| `sms_sequences.lead_id` | `leads.client_id` via `client_users` | 2-hop policy: lead_id → leads → client_users → auth.uid() | VERIFIED | sms_sequences policy uses correct 2-hop join |
| `apps/web/middleware.ts` | `@supabase/ssr` | createServerClient inline (not imported from server.ts) | VERIFIED | middleware.ts imports createServerClient from @supabase/ssr directly |
| `apps/web/(dashboard)/layout.tsx` | `apps/web/src/lib/supabase/server.ts` | import createClient from @/lib/supabase/server | VERIFIED | Import confirmed on line 2 |
| `api/main.py lifespan` | `api/services/supabase_client.py init_supabase()` | called once on app startup | VERIFIED | lifespan hook calls init_supabase() on line 9 |
| `api/routers/health.py` | `api/main.py` | app.include_router(health.router) | VERIFIED | include_router(health.router) confirmed on line 14 |

---

### Data-Flow Trace (Level 4)

Not applicable. Phase 1 produces infrastructure (SQL migrations, auth scaffolding, API skeleton) — no components render dynamic data from the database. The login page renders user-entered form data only. Dashboard and admin pages are intentional stubs awaiting Phase 3 and Phase 4 respectively.

---

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| FastAPI /health returns 200 | `SUPABASE_URL=placeholder SUPABASE_SERVICE_ROLE_KEY=placeholder uvicorn api.main:app --port 8099; curl http://127.0.0.1:8099/health` | `{"status":"ok"}` HTTP 200 | PASS |
| FastAPI startup completes without error | uvicorn stdout | "Application startup complete." | PASS |
| TypeScript strict mode passes | `cd apps/web && npx tsc --noEmit` | no output (exit 0) | PASS |
| Supabase browser client uses correct import | grep createBrowserClient in client.ts | Found on line 1 | PASS |
| Middleware uses getUser() not getSession() | grep getUser in middleware.ts | Found on line 25 | PASS |
| Next.js boots with real Supabase credentials | requires running server with filled .env.local | Cannot test — placeholder URL | SKIP |
| Cross-tenant RLS isolation | requires live Supabase + real JWT | Cannot test without deployment | SKIP |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| FOUN-01 | 01-01-PLAN.md | Supabase schema deployed with all tables and indexes | PARTIAL | Migration file has 6 correct tables with 5 indexes; REQUIREMENTS.md says "7 tables" (discrepancy); not yet deployed to live Supabase |
| FOUN-02 | 01-01-PLAN.md | Row Level Security enabled with per-client isolation policies | VERIFIED (code) / BLOCKED (live) | SQL is correct; 5 tables have RLS + policies; live deployment and JS SDK verification pending |
| FOUN-03 | 01-02-PLAN.md | Supabase Auth configured: email/password for HVAC, magic link for admin | VERIFIED | login/page.tsx has signInWithPassword and signInWithOtp; both wired to Supabase client |
| FOUN-04 | 01-02-PLAN.md | Next.js 15 App Router with TypeScript strict mode and Tailwind v4 | VERIFIED | tsc --noEmit exits 0; strict:true in tsconfig; Next.js 15.5.14 + @supabase/ssr 0.9.0 |
| FOUN-05 | 01-03-PLAN.md | FastAPI with Pydantic v2, async handlers, Supabase service role client | VERIFIED | pydantic==2.12.5; health_check is async def; supabase_client.py uses service role key |
| FOUN-06 | 01-03-PLAN.md | Environment variables configured for Supabase, Stripe, GHL, Resend | PARTIAL | All keys present in both .env files; Supabase values are placeholder/empty; other Phase 2 keys intentionally empty |

**Orphaned requirements:** None. All 6 FOUN requirements are covered by the 3 plans.

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `apps/web/src/lib/supabase/types.ts` | 1-15 | Placeholder Database type using `Record<string,unknown>` | INFO | TypeScript autocomplete and type safety on Supabase queries will not work until real types are generated. Does not block compilation. Intentional stub per plan spec — replace with `supabase gen types typescript` output after deployment. |
| `apps/web/.env.local` | 1 | `NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co` | BLOCKER | App cannot connect to Supabase with a template placeholder URL. Must be replaced with real project URL before the app can function. |
| `api/.env` | 1 | `SUPABASE_URL=` (empty) | BLOCKER | FastAPI will crash on startup with KeyError when SUPABASE_URL is accessed by init_supabase(). Verified that placeholder credentials work for startup — but the empty string causes os.environ["SUPABASE_URL"] to return an empty string, and create_client will attempt to connect to an invalid URL on first database operation. |
| `apps/web/src/app/(dashboard)/leads/page.tsx` | all | `<p>Lead list — Phase 3</p>` stub | INFO | Intentional. Phase 1 goal is scaffolding only; real dashboard is Phase 3. Does not block phase goal. |
| `apps/web/src/app/(dashboard)/calls/page.tsx` | all | `<p>Call log — Phase 3</p>` stub | INFO | Intentional Phase 3 stub. |
| `apps/web/src/app/(admin)/clients/page.tsx` | all | `<p>Client list — Phase 4</p>` stub | INFO | Intentional Phase 4 stub. |

---

### Human Verification Required

#### 1. Supabase Cloud Deployment and RLS Cross-Tenant Test

**Test:** Apply supabase/migrations/001_initial_schema.sql to a real Supabase project, run seed.sql, create testowner@tradeflow.test in Supabase Auth, link them to client_users, then sign in as that user and query `supabase.from('leads').select('*')` via the JS SDK. Then create a second user not in client_users and run the same query.

**Expected:** First user sees 1 lead. Second user sees 0 rows. SQL Editor query `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public'` shows rowsecurity=true for clients, leads, calls, sms_sequences, billing.

**Why human:** SQL Editor bypasses RLS (runs as superuser). Only the anon key + real user JWT path exercises the RLS policies. No way to emulate this without a live Supabase project and a real auth token.

#### 2. Next.js App Dev Server with Real Credentials

**Test:** Fill in apps/web/.env.local with real NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, and ADMIN_EMAIL. Run `cd apps/web && npm run dev`. Visit localhost:3000, localhost:3000/dashboard, localhost:3000/admin.

**Expected:** localhost:3000 shows "Tradeflow" marketing page. localhost:3000/dashboard redirects to /login. localhost:3000/admin redirects to /login.

**Why human:** Cannot run a dev server during automated verification; redirect behavior requires a browser request through Next.js middleware.

#### 3. FastAPI Supabase Connectivity with Real Credentials

**Test:** Fill api/.env with real SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY. Run `uvicorn api.main:app --port 8000 --reload` and check startup logs.

**Expected:** "Application startup complete." with no errors. GET /health returns {"status":"ok"}.

**Why human:** The Supabase Python client does not validate credentials at init time — only on first database operation. Connectivity can only be confirmed by running an actual query in Phase 2.

---

### Gaps Summary

Three root causes account for all gaps:

**Root cause 1 — Supabase cloud deployment not executed (most critical).**
The migration SQL is correct and complete. The seed data is correct. But neither has been applied to a real Supabase project. Both apps have placeholder/empty Supabase connection values (`apps/web/.env.local` has template placeholder URL; `api/.env` has empty SUPABASE_URL). This single gap blocks: RLS cross-tenant verification (ROADMAP Success Criterion 1, 5), real Supabase connectivity from both apps (FOUN-01, FOUN-02 live confirmation), and the phase's core goal of "multi-tenancy enforced at the database level."

**Root cause 2 — Documentation discrepancy: 7 tables vs 6 tables.**
REQUIREMENTS.md FOUN-01 and ROADMAP Success Criterion 1 both state "7 tables." The 01-01-PLAN.md consistently specifies 6 tables and the migration implements exactly 6. There is no documented 7th table in the project. The REQUIREMENTS/ROADMAP text needs to be corrected from "7" to "6" or the intended 7th table must be identified and added.

**Root cause 3 — types.ts is a placeholder stub.**
This is explicitly documented as intentional and does not block any phase goal. It should be replaced with `supabase gen types typescript` output once Supabase is deployed (Root Cause 1).

The code is production-ready. The gap is purely operational: Supabase has not been provisioned yet.

---

_Verified: 2026-03-25_
_Verifier: Claude (gsd-verifier)_
