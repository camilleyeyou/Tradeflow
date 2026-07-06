# Phase 9: Features - Context

**Gathered:** 2026-07-06
**Status:** Ready for planning
**Mode:** Auto-generated (discuss skipped via workflow.skip_discuss — autonomous run)

<domain>
## Phase Boundary

Ship the four requested differentiating features on top of the now-hardened platform: webhook durability + observability, ROI/speed-to-lead visibility, a two-way SMS inbox, and Claude-API urgency scoring. Scope = DUR-01, OBSV-01, OBSV-02, ROI-01, ROI-02, INBX-01, AI-01, AI-02.

</domain>

<decisions>
## Implementation Decisions

### DUR-01 — webhook durability + replay
- New migration (continue numbering — latest is 009, so 010): `webhook_events` table: id, provider (text: 'stripe'|'ghl'|'callrail'), provider_event_id (text), event_type, payload (jsonb), signature_verified (bool), status ('received'|'processed'|'failed'), error (text null), created_at, processed_at. UNIQUE(provider, provider_event_id) for dedup. RLS enabled, no client policies (service-role only).
- In each FastAPI webhook handler (stripe_webhooks.py, webhooks.py [GHL], callrail_webhooks.py): AFTER signature verification and BEFORE returning 200, synchronously insert the raw event into webhook_events (on unique conflict → treat as duplicate, skip reprocessing). Then process in BackgroundTasks, updating status to processed/failed. If the durable insert itself fails, return 5xx so the provider retries.
- Replay: add an admin-only mechanism to reprocess a stored event by id (e.g. a small function `reprocess_event(id)` + an internal endpoint guarded, or a documented script). Keep minimal. Acceptance: webhook_events migration exists with unique dedup; all 3 handlers insert before ACK; a replay path exists.

### OBSV-01 — Sentry both apps
- FastAPI: re-add `sentry-sdk` to api/requirements.txt (it was removed in Phase 7 cleanup — re-add pinned) and init `sentry_sdk.init(dsn=os.environ.get("SENTRY_DSN"), ...)` in api/main.py (no-op when DSN unset). 
- Next.js: add `@sentry/nextjs` and the standard instrumentation (sentry.server/edge config via instrumentation.ts already exists — extend it; add client config). Guard on SENTRY_DSN/NEXT_PUBLIC_SENTRY_DSN so unset = disabled. Document SENTRY_DSN in both .env.example. Acceptance: both apps init Sentry guarded by DSN env; sentry-sdk back in requirements.

### OBSV-02 — backups + uptime
- Document enabling Supabase automated backups / PITR in the DEPLOY-CHECKLIST.md (human step). Add an uptime check: keep /health but make it a readiness check that also confirms Supabase connectivity (lightweight), OR document an external uptime monitor pinging /health. Acceptance: DEPLOY-CHECKLIST documents backups + uptime; /health documented as the uptime target.

### ROI-01 — time-to-first-contact
- Migration (011): add `leads.first_contact_at timestamptz null`. Set it the first time a lead moves off status 'new' (in updateLeadStatus / lead-actions.ts) OR on first outbound touch (SMS reply logged / text-back). Use the earliest. Acceptance: column exists; lead-actions sets first_contact_at when transitioning from new and it's still null.

### ROI-02 — dashboard ROI summary
- Add a monthly summary to the client dashboard (overview page): lead count this month, estimated lead value, and average speed-to-lead (avg of first_contact_at - created_at). Estimated lead value: use a simple per-lead estimated value — a configurable constant (e.g. AVG_JOB_VALUE, default ~$400 booked-job value × a conservative close rate, or just "estimated pipeline = count × $X") clearly labeled "estimated". Keep it a server component reading the client's leads. Acceptance: overview shows month lead count, estimated value, and avg speed-to-lead computed from first_contact_at.

### INBX-01 — two-way SMS inbox
- Extend api/services/ghl_api.py (or a new ghl_conversations.py) with: fetch conversation/messages for a contact, and send an SMS message via GHL (using the per-client token from FIX-01). Expose to the dashboard via a Next.js route handler (server-side, auth-checked, RLS-scoped to the owner's lead) that (a) GETs the message thread for a lead's ghl_contact_id and (b) POSTs a reply. Add a dashboard UI (client component) on the lead detail / leads page: shows the conversation and a reply box. Never expose GHL tokens to the browser. Acceptance: a dashboard route can fetch a lead's SMS thread and send a reply through GHL; UI renders thread + reply box; auth + ownership enforced.
- NOTE: GHL Conversations API specifics (endpoints, scopes) need confirmation at implementation — the plan should isolate the GHL calls behind a service module and document the exact endpoints used, and degrade gracefully if the conversations scope isn't available yet.

### AI-01 — Claude urgency scoring
- Use the Anthropic SDK server-side. Add `@anthropic-ai/sdk` to apps/web. Model id: **claude-fable-5** (latest). Add env `ANTHROPIC_API_KEY` (document in .env.example; feature no-ops/skips scoring gracefully when unset). 
- Migration (012): add `leads.urgency_score int null` and `leads.urgency_reason text null`.
- Scoring: after a lead is created (in the lead-submit `after()` background work, and for missed calls in the CallRail path if feasible — at minimum for form leads), call the Claude API with the lead's data (service type, message/notes, source, time) and a strict prompt that returns a JSON object {score: 1-10, reason: string}. Parse and store urgency_score + urgency_reason. Keep the call resilient (timeout, try/catch, never block the homeowner's 200 response). Follow the claude-api skill guidance for SDK usage (messages.create, system prompt, max_tokens small, temperature low). Acceptance: leads get a urgency_score written via a claude-fable-5 call; failures don't break lead capture.

### AI-02 — hot leads surfaced
- In the dashboard leads list, sort/flag high-urgency leads first (e.g. urgency_score >= 8 shown with a "Hot" badge at the top). Preserve existing status filters. Acceptance: leads list orders by urgency_score desc (nulls last) or shows a Hot section; a Hot badge renders for high scores.

### Claude's Discretion
- Migration numbers (010–012 or combined), estimated-value constant, exact GHL/Anthropic module structure, and dashboard placement are at Claude's discretion. Keep the homeowner-facing lead POST fast (AI scoring must be background, never blocking the 200). Keep dashboard mobile-responsive and on-brand (black+gold).

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- FastAPI webhooks: api/routers/{webhooks.py (GHL), stripe_webhooks.py, callrail_webhooks.py}; service-role Supabase client api/services/supabase_client.py; outbound GHL client api/services/ghl_api.py (per-client token). Env validation api/config.py; Sentry re-add point api/main.py lifespan.
- Next.js: lead-submit apps/web/src/app/api/leads/submit/route.ts (after() background work — good place for AI scoring). Dashboard overview apps/web/src/app/(dashboard)/dashboard/page.tsx; leads list + LeadsTable (client component) under apps/web/src/components/dashboard/. lead-actions.ts (updateLeadStatus — first_contact_at hook). Generated types apps/web/src/lib/supabase/types.ts (update for new columns). instrumentation.ts exists (extend for Sentry).
- Migrations supabase/migrations — latest is 009. New: 010+.
- DEPLOY-CHECKLIST.md at .planning/phases/05-critical-security-launch-blockers/DEPLOY-CHECKLIST.md (append OBSV-02 + new env vars).

### Established Patterns
- FastAPI: verify → durably record → 200 → BackgroundTasks (DUR-01 formalizes this). httpx.AsyncClient, Pydantic v2. Next.js 15 async APIs, server-only secrets, RLS + getUser() ownership checks, force-dynamic on authed routes.

### Integration Points
- New leads columns (first_contact_at, urgency_score, urgency_reason) → types.ts + dashboard render.
- New env vars: SENTRY_DSN / NEXT_PUBLIC_SENTRY_DSN, ANTHROPIC_API_KEY → both .env.example + Next env.ts validation (optional, not required-fail).

</code_context>

<specifics>
## Specific Ideas

Authoritative: .planning/REQUIREMENTS.md (v1.1 Features). For AI-01 consult the claude-api skill; use model id claude-fable-5. Keep all external calls (Claude, GHL) resilient and non-blocking on the homeowner path.

</specifics>

<deferred>
## Deferred Ideas

- AI voice agent (Vapi) — remains v2/out of scope.
- Analytics charts beyond the simple ROI summary — v2.

</deferred>
