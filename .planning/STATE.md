---
gsd_state_version: 1.0
milestone: v1.1
milestone_name: Pre-launch hardening + core features
status: Defining requirements
stopped_at: Milestone v1.1 started
last_updated: "2026-07-06T09:48:00.000Z"
progress:
  total_phases: 0
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-25)

**Core value:** Every inbound lead is captured instantly, routed to the right HVAC contractor, and followed up automatically so no lead is ever lost.
**Current focus:** Milestone v1.1 — pre-launch hardening + core features

## Current Position

Phase: Not started (defining requirements)
Plan: —
Status: Defining requirements
Last activity: 2026-07-06 — Milestone v1.1 started

## Performance Metrics

**Velocity:**

- Total plans completed: 0
- Average duration: —
- Total execution time: 0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | - | - | - |

**Recent Trend:**

- Last 5 plans: —
- Trend: —

*Updated after each plan completion*
| Phase 01-foundation P01 | 2 | 2 tasks | 2 files |
| Phase 01-foundation P03 | 12 | 2 tasks | 12 files |
| Phase 01-foundation P02 | 15 | 2 tasks | 16 files |
| Phase 02-lead-pipeline P01 | 155 | 2 tasks | 3 files |
| Phase 02-lead-pipeline P03 | 4 | 1 tasks | 2 files |
| Phase 02-lead-pipeline P02 | 2 | 2 tasks | 3 files |
| Phase 02-lead-pipeline P04 | 4 | 2 tasks | 3 files |
| Phase 02-lead-pipeline P05 | 6 | 2 tasks | 2 files |
| Phase 03-client-dashboard P01 | 21 | 2 tasks | 22 files |
| Phase 03-client-dashboard P03 | 7 | 2 tasks | 4 files |
| Phase 03-client-dashboard P02 | 4 | 2 tasks | 7 files |
| Phase 03-client-dashboard P04 | 8 | 2 tasks | 6 files |
| Phase 04-operations P02 | 5 | 2 tasks | 5 files |
| Phase 04-operations P01 | 516 | 2 tasks | 3 files |
| Phase 04-operations P03 | 20 | 2 tasks | 6 files |
| Phase 04-operations P04 | 2 | 1 tasks | 0 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- All stack choices locked: Next.js 15 + FastAPI + Supabase + GHL + CallRail + Stripe + Resend
- Webhooks route to FastAPI on Railway only — never to Next.js (Vercel Deployment Protection blocks them)
- GHL sub-account per client — never shared; created programmatically during admin onboarding
- GHL webhook: verify both `X-WH-Signature` (RSA) and `X-GHL-Signature` (Ed25519); X-WH-Signature deprecated July 1, 2026
- [Phase 01-foundation]: Added sms_sequences RLS policy missing from CLAUDE (1).md — deny-all default would silently break dashboard; policy uses 2-hop join: lead_id → leads.client_id → client_users
- [Phase 01-foundation]: client_users table has no RLS enabled by design — it is the identity source used by all other RLS policies; enabling RLS on it would create circular dependency
- [Milestone v1.1 CORRECTION]: The above is WRONG and a critical vulnerability. A table in the public schema with RLS disabled is fully readable AND writable by anon/authenticated via PostgREST — any user can insert a (auth.uid(), victim_client_id) row and defeat every other policy. There is no circular dependency: a `USING (user_id = (select auth.uid()))` SELECT policy lets a user read only their own mapping, which is exactly what the other policies' subqueries need. Fix is to ENABLE RLS on client_users with that self-read policy (admin writes use the service role, which bypasses RLS).
- [Phase 01-foundation]: FastAPI Procfile uses api.main:app dotted module path — uvicorn runs from repo root where api/ package lives
- [Phase 01-foundation]: Supabase service role client uses global singleton initialized in lifespan hook — safe to reuse, not per-request
- [Phase 01-foundation]: create-next-app@15 creates src/ directory regardless of --src-dir no flag; all files live under apps/web/src/ with @/* alias pointing to ./src/*
- [Phase 01-foundation]: types.ts is a placeholder stub until supabase gen types typescript is run after Phase 1 Supabase deployment verification
- [Phase 01-foundation]: middleware.ts lives at apps/web/ root (not src/) — Next.js requires middleware at the app root directory
- [Phase 02-lead-pipeline]: GHL client uses per-request token (not module-level singleton) to support per-client sub-account tokens
- [Phase 02-lead-pipeline]: Lead submit handler uses inline createClient (not createAdminClient) — admin.ts is restricted to (admin)/ route group per code comment
- [Phase 02-lead-pipeline]: GHL and Resend calls run in next/server after() — 200 returned to homeowner before any external API calls
- [Phase 02-lead-pipeline]: Used createClient from @supabase/supabase-js (not createServerClient) in generateStaticParams to avoid dynamic rendering — no cookies needed at build time
- [Phase 02-lead-pipeline]: service_area_zips handled as both string[] and string to be safe until Database types are generated post-Phase-1-deployment
- [Phase 02-lead-pipeline]: GHL legacy RSA signature (X-WH-Signature) accepted permissively during transition — hard removal deadline July 1, 2026 documented in code
- [Phase 02-lead-pipeline]: GHL webhook: single POST /api/webhooks/ghl endpoint routes all events by event_type field
- [Phase 02-lead-pipeline]: GHL Ed25519 public key stays hardcoded in ghl_service.py — no env var needed for webhook verification
- [Phase 03-client-dashboard]: shadcn CLI 4.x defaulted to base-nova style (not new-york) — accepted as equivalent for this project
- [Phase 03-client-dashboard]: Server Actions use @ts-expect-error on .update() calls due to Database types stub — auto-resolves when supabase gen types runs post-deployment
- [Phase 03-client-dashboard]: base-ui Switch onCheckedChange receives (checked, eventDetails) — Controller render extracts boolean before passing to react-hook-form field
- [Phase 03-client-dashboard]: settings page uses supabase as any cast for stub database types — auto-resolves when supabase gen types runs post-deployment
- [Phase 03-client-dashboard]: LeadsTable is a Client Component because it renders StatusSelect and NotesEditor — cleaner boundary than Server Component with deeply nested client children
- [Phase 03-client-dashboard]: StatusSelect wraps setOptimisticStatus inside startTransition — required for correct optimistic update in React 19 concurrent mode; calling outside startTransition resets immediately
- [Phase 03-client-dashboard]: base-ui Select onValueChange signature is (value, eventDetails) — adapted StatusSelect handler to match base-ui API
- [Phase 03-client-dashboard]: Dashboard pages relocated under (dashboard)/dashboard/ to resolve route group URL collision between (dashboard) and (marketing)
- [Phase 03-client-dashboard]: generateStaticParams returns empty array when Supabase URL is a placeholder — prevents build crash in local/CI without real credentials
- [Phase 03-client-dashboard]: Login page createClient() moved into submit handler body to prevent SSR prerender from calling createBrowserClient with malformed URL
- [Phase 04-operations]: stripe.errors.SignatureVerificationError used (v14.x namespace) — not stripe.error which is v13.x and below
- [Phase 04-operations]: stripe-signature header alias is lowercase — FastAPI normalizes all HTTP headers to lowercase
- [Phase 04-operations]: resend[async] extra required for send_async() in FastAPI async background tasks — bare resend lacks anyio
- [Phase 04-operations]: base-ui Button has no asChild support — use buttonVariants() className on Link directly
- [Phase 04-operations]: @ts-expect-error not needed on admin createAdminClient query — types.ts stub types query as any, directive causes compile error
- [Phase 04-operations]: supabase as any cast required for insert/update in admin actions — types.ts stub maps Record<string,unknown> Insert to never in write paths; reads work without cast
- [Phase 04-operations]: state field in onboardingSchema uses z.string().min(1) without .default() — .default() makes input type optional, breaking react-hook-form Resolver type; IL default set in form defaultValues instead
- [Phase 04-operations]: Admin (admin) route group compiles correctly but does not appear in Next.js build summary output — routes confirmed in .next/server/app/(admin)/ after build

### Pending Todos

None yet.

### Blockers/Concerns

- Milestone v1.1 sourced from a full pre-launch audit (frontend, backend, database, launch-readiness). Full findings live in the git history of this session; the milestone requirements encode them.
- Nothing is confirmed deployed: all cloud env vars (RESEND/GHL/STRIPE/CALLRAIL) are empty locally, Supabase migrations may not be applied, and `apps/web/src/lib/supabase/types.ts` is still the placeholder stub. Deploy + `supabase gen types` + populating Vercel/Railway env vars are launch prerequisites the human must perform.
- CallRail integration does not exist yet (no webhook, no writer to `calls`) — v1.1 builds it.
- Per-client GHL token model: a single global `GHL_PRIVATE_TOKEN` cannot serve multiple sub-accounts; v1.1 moves to a per-client stored token.
- Phase 4 (prior): GHL Agency API for programmatic sub-account creation — endpoint and required OAuth scopes still need verification at implementation time.

## Session Continuity

Last session: 2026-07-06T09:48:00.000Z
Stopped at: Milestone v1.1 started (defining requirements)
Resume file: None
