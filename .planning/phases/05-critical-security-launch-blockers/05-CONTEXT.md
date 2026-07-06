# Phase 5: Critical Security & Launch Blockers - Context

**Gathered:** 2026-07-06
**Status:** Ready for planning
**Mode:** Auto-generated (discuss skipped via workflow.skip_discuss — autonomous run)

<domain>
## Phase Boundary

Close every remotely exploitable security gap found in the pre-launch audit and ship the missing missed-call text-back integration, so Tradeflow can safely onboard paying HVAC clients. Scope is limited to: SEC-01/02/03 (authorization + RLS + webhook signature), MISS-01..04 (CallRail ingestion → lead → GHL text-back → dashboard call log), and DPLY-01/02 (Supabase types + deploy/verification checklist). No unrelated refactors.

</domain>

<decisions>
## Implementation Decisions

### Authorization (SEC-01)
- Both `onboardClient` (apps/web/src/lib/actions/onboarding-actions.ts) and `createClientLogin` (apps/web/src/lib/actions/create-client-login.ts) must, as their FIRST action, resolve the caller via a request-scoped `createClient()` + `supabase.auth.getUser()` and reject (throw) unless `isAdmin(user.email)` is true. Mirror the pattern already used in settings-actions.ts / lead-actions.ts. No service-role client construction before the check passes.

### RLS on client_users (SEC-02)
- New Supabase migration: `ALTER TABLE public.client_users ENABLE ROW LEVEL SECURITY;` plus a single SELECT policy `USING (user_id = (select auth.uid()))`. No INSERT/UPDATE/DELETE policies — admin writes go through the service role (which bypasses RLS). Verify a second client's JWT cannot read or insert another user's mapping. This corrects the incorrect v1.0 "circular dependency" decision.

### GHL webhook signature (SEC-03)
- Remove `verify_ghl_legacy_signature` (always returns True) from api/services/ghl_service.py and the legacy `X-WH-Signature` branch in api/routers/webhooks.py. Accept only a valid Ed25519 `X-GHL-Signature`; reject (401) otherwise. Keep the existing Ed25519 verification path and hardcoded public key.

### CallRail / missed-call (MISS-01..04)
- New FastAPI router `POST /api/webhooks/callrail`. Verify authenticity via CallRail's signature/token mechanism (CallRail v3) before any processing; reject unauthenticated requests.
- On a missed/unanswered call event: insert a `calls` row and a `leads` row (source `direct_call`), deduplicated on the CallRail call id (rely on a unique index — coordinate with Phase 7 HARD-03, but add the needed unique index in this phase's migration if not present so dedup is race-safe).
- Trigger the client's GHL text-back workflow within 15 seconds (use the per-client GHL config; the full per-client token migration is Phase 6 FIX-01 — for this phase use the existing token mechanism and leave a clear seam).
- Dashboard call log (apps/web/src/app/(dashboard)/dashboard/calls) already reads `calls`; ensure ingested rows appear with recording links. No new UI framework — reuse existing table components.
- Follow project constraints: FastAPI async handlers, `httpx.AsyncClient` (never `requests`), immediate 200 after signature check with background processing, truncated PII in logs.

### Supabase types + deploy (DPLY-01, DPLY-02)
- DPLY-01: produce the command + integration to replace apps/web/src/lib/supabase/types.ts with generated types (`supabase gen types typescript`), and remove the `as any` / `@ts-expect-error` workarounds it enabled. The actual generation against the live project requires the human's credentials — produce the exact steps and a committed types file only if a local schema can generate it; otherwise document precisely.
- DPLY-02: write an operator checklist (env vars for Supabase/Vercel/Railway, migration apply order, and the two end-to-end traces: a real lead form→DB→GHL SMS→Resend email, and a real missed call→text-back). Mark DPLY-01 live-generation and DPLY-02 execution as "requires human/deploy" — do not mark falsely complete.

### Claude's Discretion
- Exact file/module names for the CallRail router/service, migration filenames (continue the NNN_ numbering), and dashboard wiring details are at Claude's discretion, following existing codebase conventions.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- Auth pattern: apps/web/src/lib/actions/settings-actions.ts and lead-actions.ts already do getUser()+authz — copy it.
- isAdmin(): apps/web/src/lib/admin.ts.
- GHL Ed25519 verification + hardcoded public key: api/services/ghl_service.py (keep the good path, delete the bypass).
- GHL webhook routing by event_type: api/routers/webhooks.py.
- Existing calls table + dashboard reader: supabase/migrations/001_initial_schema.sql (calls), apps/web/src/app/(dashboard)/dashboard/calls/page.tsx.
- Supabase service-role client (FastAPI): api/services/supabase_client.py.

### Established Patterns
- Migrations in supabase/migrations/NNN_*.sql.
- FastAPI webhooks: verify signature → return 200 fast → process in BackgroundTasks.
- Next.js server actions in apps/web/src/lib/actions/, request-scoped Supabase clients.

### Integration Points
- New CallRail router registered in api/main.py.
- calls/leads inserts via the FastAPI service-role Supabase client.
- GHL text-back via the GHL service client.

</code_context>

<specifics>
## Specific Ideas

The exact issues, file paths, and rationale are enumerated in .planning/REQUIREMENTS.md (v1.1 Critical section) and .planning/STATE.md accumulated context (including the client_users RLS correction). Treat those as the authoritative spec.

</specifics>

<deferred>
## Deferred Ideas

- Full per-client encrypted GHL token migration → Phase 6 (FIX-01).
- Broad schema constraints/indexes and updated_at triggers → Phase 7 (HARD-03), except the CallRail dedup unique index needed here for race-safety.
- Webhook durability (webhook_events store) → Phase 9 (DUR-01); this phase may leave a clean seam for it.

</deferred>
