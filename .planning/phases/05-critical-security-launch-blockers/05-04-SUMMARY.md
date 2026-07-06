---
phase: 05-critical-security-launch-blockers
plan: 04
subsystem: api
tags: [fastapi, callrail, ghl, httpx, webhooks, supabase, hmac]

requires:
  - phase: 05-critical-security-launch-blockers (05-01..03)
    provides: hardened Server Action auth, client_users RLS, GHL Ed25519-only signature verification (established webhook verify→200→BackgroundTasks pattern)
provides:
  - CallRail missed-call webhook endpoint (POST /api/webhooks/callrail) with fail-closed HMAC signature verification
  - calls + direct_call leads insertion, deduplicated at both application and DB layer
  - Async httpx-based GHL outbound client (create_contact, add_to_workflow, trigger_textback) for the missed-call text-back workflow
  - Race-safe partial unique index on leads.callrail_call_id
affects: [phase-06-fix-01-per-client-ghl-tokens, phase-05-dply-deploy-checklist]

tech-stack:
  added: []
  patterns:
    - "CallRail webhook: verify raw body HMAC-SHA256 (hex or base64) before parsing, fail closed on missing secret, 200 fast + BackgroundTasks"
    - "Outbound GHL calls via httpx.AsyncClient (never requests) mirroring apps/web/src/lib/ghl.ts request shapes"
    - "PII-safe logging: log only last 4 digits of phone numbers"

key-files:
  created:
    - supabase/migrations/005_add_leads_callrail_call_id_unique.sql
    - api/services/callrail_service.py
    - api/services/ghl_api.py
    - api/routers/callrail_webhooks.py
  modified:
    - api/main.py
    - api/.env.example

key-decisions:
  - "CallRail signature verification supports both hex and base64 HMAC-SHA256 digest encodings since CallRail's exact encoding must be confirmed against live docs at deploy time — implementation note left in code"
  - "Missed-call detection keyed on event.answered is False (explicit false, not falsy) to avoid misclassifying calls where the answered field is absent from the payload"
  - "Dedup enforced twice: application-level select-before-insert on calls.callrail_call_id, plus DB-level partial unique index on leads.callrail_call_id — the DB index is the real race-safety guarantee, the app check just avoids the more common non-concurrent redelivery"
  - "GHL_PRIVATE_TOKEN and GHL_SMS_WORKFLOW_ID reused as shared config for now — per-client token seam intentionally left as a comment referencing Phase 6 FIX-01 rather than pulling that refactor into this plan"

patterns-established:
  - "Async outbound third-party API clients (ghl_api.py) live under api/services/ and use httpx.AsyncClient with a short module-level base URL/version constant, mirroring the existing TS lib/ghl.ts contract"

requirements-completed: [MISS-01, MISS-02, MISS-03, MISS-04]

duration: 7min
completed: 2026-07-06
---

# Phase 05 Plan 04: CallRail Missed-Call Text-Back Summary

**CallRail webhook → deduplicated calls/leads rows → async GHL text-back, closing the previously-advertised-but-unbuilt missed-call feature.**

## Performance

- **Duration:** 7 min
- **Started:** 2026-07-06T11:14:13Z
- **Completed:** 2026-07-06T11:21:08Z
- **Tasks:** 3
- **Files modified:** 6 (4 created, 2 modified)

## Accomplishments

- `POST /api/webhooks/callrail` rejects any request without a valid HMAC-SHA256 signature (401) before any parsing or DB access, and fails closed if `CALLRAIL_WEBHOOK_SECRET` is unset
- Missed/unanswered CallRail calls now insert a `calls` row (with `recording_url` + `outcome='missed'`, exactly what the existing dashboard call log reads) and a `direct_call` `leads` row
- Duplicate CallRail deliveries are rejected at both the application layer (select-before-insert on `calls.callrail_call_id`) and the database layer (new partial unique index `leads_callrail_call_id_unique`)
- A missed call fires the GHL text-back workflow (`create_contact` → `add_to_workflow`) from a `BackgroundTasks` job after the fast 200, using `httpx.AsyncClient` exclusively (never `requests`)
- `api/main.py` app now imports cleanly end-to-end with all four webhook routers registered (`/api/webhooks/ghl`, `/api/webhooks/stripe`, `/api/webhooks/callrail`, plus health)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add race-safe dedup unique index on leads(callrail_call_id)** - `ab34b40` (feat)
2. **Task 2: CallRail signature verification service + async GHL text-back client** - `1089226` (feat)
3. **Task 3: CallRail webhook router — verify, insert calls+leads deduped, trigger text-back, register in main** - `42e5523` (feat)

**Plan metadata:** (this commit) `docs(05-04): complete plan`

## Files Created/Modified

- `supabase/migrations/005_add_leads_callrail_call_id_unique.sql` - Partial unique index on `leads(callrail_call_id) where callrail_call_id is not null`
- `api/services/callrail_service.py` - `verify_callrail_signature` (fail-closed HMAC hex/base64 compare), `CallRailEvent` Pydantic v2 model, `is_missed_call` predicate
- `api/services/ghl_api.py` - `httpx.AsyncClient`-based `create_contact`, `add_to_workflow`, `trigger_textback`; PII-truncated logging helper
- `api/routers/callrail_webhooks.py` - `POST /api/webhooks/callrail` (verify → 200 fast → `BackgroundTasks`) and `process_callrail_event` (resolve client, dedup, insert calls+leads, trigger text-back)
- `api/main.py` - registered `callrail_webhooks.router`
- `api/.env.example` - documented `CALLRAIL_WEBHOOK_SECRET`, `GHL_PRIVATE_TOKEN`, `GHL_SMS_WORKFLOW_ID`

## Decisions Made

- Signature verification computes and compares both hex and base64 HMAC-SHA256 digests against the header value, since CallRail's exact digest encoding needs to be confirmed against live account settings at deploy time (documented as a code comment / DPLY follow-up, not a blocker for this plan)
- `is_missed_call` checks `event.answered is False` (strict identity check) rather than `not event.answered`, so a payload where `answered` is absent (`None`) is not misclassified as missed
- Kept the per-client GHL token as a shared `GHL_PRIVATE_TOKEN` env var per the plan's explicit interfaces contract — the seam for Phase 6 FIX-01 (client's own stored token) is a comment in both `ghl_api.py` and `callrail_webhooks.py`, not implemented here

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- Initial `python -m py_compile` and `python -c "import api.main"` sanity checks were run against the system Python, which lacks `stripe`/`fastapi`/etc. Found and used the project's `api/.venv` virtualenv instead — confirmed `api.main` imports cleanly and all four webhook routes register (`/api/webhooks/ghl`, `/api/webhooks/stripe`, `/api/webhooks/callrail`, health). No code changes required; this was purely a local verification environment issue, not a defect in the new code.

## User Setup Required

None for this plan in isolation — `CALLRAIL_WEBHOOK_SECRET`, `GHL_PRIVATE_TOKEN`, and `GHL_SMS_WORKFLOW_ID` are documented in `api/.env.example` but actual population of Railway env vars, applying migration 005, and confirming the exact CallRail signature header/encoding against a live CallRail account are tracked under the Phase 5 DPLY deploy checklist (see STATE.md blockers), not this plan.

## Next Phase Readiness

- MISS-01..04 are satisfied in-repo: signature-verified webhook, deduplicated calls+leads inserts, async text-back trigger, and dashboard-compatible call log columns.
- Live end-to-end confirmation (real CallRail account, real signature encoding, real 15-second timing, real recording links) is explicitly deferred to the DPLY deploy trace per the plan's own success criteria — flagging this so it isn't mistaken for already-verified.
- Phase 6 FIX-01 (per-client GHL tokens) has a clean seam to build on: both `ghl_api.trigger_textback` and `callrail_webhooks.process_callrail_event` currently read the single shared `GHL_PRIVATE_TOKEN`/`GHL_SMS_WORKFLOW_ID` env vars and are commented for the swap to per-client stored credentials.

---
*Phase: 05-critical-security-launch-blockers*
*Completed: 2026-07-06*

## Self-Check: PASSED

All created files confirmed present on disk; all three task commit hashes (ab34b40, 1089226, 42e5523) confirmed in git history.
