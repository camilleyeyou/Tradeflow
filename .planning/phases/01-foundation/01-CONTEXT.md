# Phase 1: Foundation - Context

**Gathered:** 2026-03-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Deploy the Supabase schema with all tables and RLS policies, configure Supabase Auth for HVAC owners (email/password) and admin (magic link), scaffold the Next.js 15 App Router frontend and FastAPI backend, and establish environment variable configuration across both apps. No features are built — this phase creates the secure, multi-tenant data layer and app skeletons that all subsequent phases build on.

</domain>

<decisions>
## Implementation Decisions

### Supabase Setup
- **D-01:** Cloud-only Supabase for MVP — no local Supabase CLI / Docker setup. Connect directly to the Supabase cloud project for development. Faster to start, avoids Docker dependency, sufficient for a 1-2 developer team.
- **D-02:** Migrations are SQL files in `/supabase/migrations/`, applied via Supabase dashboard or CLI push. Append-only — never modify existing migration files.
- **D-03:** TypeScript types generated via `supabase gen types typescript` after schema is deployed. Types live in `apps/web/lib/supabase/types.ts`.

### Project Structure
- **D-04:** Simple directory structure as defined in PROJECT.md — `apps/web/` (Next.js) and `api/` (FastAPI) in one repo. No monorepo tooling (no Turborepo, no pnpm workspaces). Plain npm for the Next.js app, pip/venv for FastAPI.
- **D-05:** Three Next.js route groups scaffolded: `(landing)`, `(dashboard)`, `(admin)`. Each with its own layout.tsx. Marketing routes under `(marketing)`.

### Auth Flow
- **D-06:** Use `@supabase/ssr` package (not deprecated `auth-helpers-nextjs`). Cookie-based sessions. Never use `supabase.auth.getSession()` in Server Components — always use `supabase.auth.getUser()` to revalidate the token.
- **D-07:** Never initialize the Supabase client at module level — create per-request to avoid session leaks on Vercel's Fluid Compute.
- **D-08:** Admin access determined by checking authenticated user's email against `ADMIN_EMAIL` env var in middleware. Admin uses magic link login. HVAC owners use email/password.
- **D-09:** Next.js middleware checks for Supabase session on `(dashboard)` and `(admin)` route groups. No session → redirect to `/login`.

### Dev Environment
- **D-10:** Seed data: `seed.sql` creates one test client (Oak Park HVAC) and one test lead, plus a test user in `client_users` for RLS testing.
- **D-11:** RLS verification: after schema deploy, create a test user JWT and confirm cross-tenant queries return zero rows. This is the Phase 1 exit gate — multi-tenancy must be proven before any feature work.
- **D-12:** No unit test framework setup in Phase 1. The only required test is the RLS cross-tenant integration test.

### Claude's Discretion
- Exact folder structure within `apps/web/components/` and `apps/web/lib/`
- FastAPI project structure within `api/` (routers, services, models layout)
- Choice of Python virtual environment tool (venv, poetry, uv)
- Specific Tailwind v4 configuration approach

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Specification
- `CLAUDE (1).md` — Full project spec including database schema, API contracts, project structure, env vars, code rules, naming conventions, and build order. This is the most detailed reference for Phase 1.

### Research
- `.planning/research/STACK.md` — Technology versions, gotchas (especially Supabase SSR patterns, Tailwind v4 config)
- `.planning/research/ARCHITECTURE.md` — Component boundaries, data flow, build order
- `.planning/research/PITFALLS.md` — RLS opt-in gotcha, Vercel Deployment Protection blocking webhooks, service role key boundary

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- None — greenfield project, no existing code

### Established Patterns
- None — patterns will be established in this phase

### Integration Points
- Supabase cloud project (to be created/connected)
- Vercel deployment (to be configured)
- Railway deployment (to be configured)

</code_context>

<specifics>
## Specific Ideas

- Database schema is fully defined in `CLAUDE (1).md` — use it as-is, do not redesign
- The `client_users` join table is the key to RLS — policies derive tenant from `auth.uid()` through this table
- Admin bypasses RLS via service role key, never via policy exceptions
- Project structure follows the exact layout in `CLAUDE (1).md` — this was a deliberate decision, not a suggestion

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-foundation*
*Context gathered: 2026-03-25*
