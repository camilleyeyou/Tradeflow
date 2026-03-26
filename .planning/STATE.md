---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: Ready to plan
stopped_at: Phase 4 context gathered
last_updated: "2026-03-26T10:53:26.243Z"
progress:
  total_phases: 4
  completed_phases: 3
  total_plans: 12
  completed_plans: 12
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-25)

**Core value:** Every inbound lead is captured instantly, routed to the right HVAC contractor, and followed up automatically so no lead is ever lost.
**Current focus:** Phase 03 — client-dashboard

## Current Position

Phase: 4
Plan: Not started

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

### Pending Todos

None yet.

### Blockers/Concerns

- Phase 2: CallRail-to-GHL trigger integration — exact API call sequence for missed-call workflow needs verification at implementation time (research flag from SUMMARY.md)
- Phase 4: GHL Agency API for programmatic sub-account creation — endpoint and required OAuth scopes need verification; highest-complexity external API call in product

## Session Continuity

Last session: 2026-03-26T10:53:26.225Z
Stopped at: Phase 4 context gathered
Resume file: .planning/phases/04-operations/04-CONTEXT.md
