---
phase: 07-medium-priority-hardening
plan: 02
subsystem: api
tags: [fastapi, asyncio, threadpool, env-validation, dependency-hygiene, supabase, stripe, callrail, ghl]

# Dependency graph
requires:
  - phase: 07-medium-priority-hardening plan 01
    provides: least-privilege RLS + schema integrity on the same Supabase tables these handlers query
provides:
  - Non-blocking Supabase DB I/O in all async webhook/background handlers (GHL, CallRail, Stripe)
  - Fail-fast env validation at FastAPI lifespan startup (api/config.py)
  - Minimal, fully pinned api/requirements.txt
affects: [deployment, railway-boot, webhook-reliability]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "run_in_threadpool(lambda: db.table(...).execute()) wraps every sync Supabase call inside async def handlers"
    - "validate_required_env() called first in FastAPI lifespan, before init_supabase()"

key-files:
  created:
    - api/config.py
  modified:
    - api/routers/webhooks.py
    - api/routers/callrail_webhooks.py
    - api/services/stripe_service.py
    - api/main.py
    - api/requirements.txt

key-decisions:
  - "Kept the sync Supabase client as-is (no async client swap) — only wrapped .execute() calls in run_in_threadpool per plan interface, matching the minimal-risk hardening approach"
  - "requirements.txt trimmed to the 9 top-level packages actually imported (or required as ASGI server / dev env loader) — pip resolves all transitive deps; removed pyiceberg, fastar, pyroaring, fastapi-cloud-cli, fastapi-cli, sentry-sdk"

patterns-established:
  - "Any new async webhook/background handler that touches the sync Supabase client must wrap .execute() in run_in_threadpool"
  - "New required env vars must be added to api/config.py REQUIRED_ENV_VARS so boot fails fast on misconfiguration"

requirements-completed: [HARD-01, HARD-09, HARD-10]

# Metrics
duration: 6min
completed: 2026-07-06
---

# Phase 07 Plan 02: FastAPI Async Hardening + Fail-Fast Env + Pinned Deps Summary

**Wrapped every synchronous Supabase `.execute()` call inside async webhook handlers in `run_in_threadpool`, added `api/config.py` fail-fast env validation called first in the FastAPI lifespan, and cut `api/requirements.txt` from 76 lines (unpinned resend, unused packages) to 9 fully pinned top-level dependencies.**

## Performance

- **Duration:** ~6 min
- **Completed:** 2026-07-06
- **Tasks:** 3/3 completed
- **Files modified:** 6 (5 modified, 1 created)

## Accomplishments
- Eliminated event-loop blocking on Supabase DB I/O in all three async webhook/background paths (GHL InboundMessage/ContactTagAdded, CallRail missed-call processing, Stripe subscription/invoice handlers) — 15 `.execute()` calls wrapped across 3 files
- FastAPI now refuses to boot with a clear `RuntimeError` listing missing env vars (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `CALLRAIL_WEBHOOK_SECRET`) instead of failing opaquely at first request
- `api/requirements.txt` reduced to exactly the top-level packages imported by the codebase (verified via grep across all `api/*.py`) plus `uvicorn[standard]` and `python-dotenv`; `resend[async]` now pinned to exact `2.32.2` instead of open-ended `>=2.0.0`

## Task Commits

Each task was committed atomically:

1. **Task 1: Offload all async-handler DB calls via run_in_threadpool (HARD-01)** - `29c3ddb` (feat)
2. **Task 2: Fail-fast env validation at boot (HARD-09, FastAPI side)** - `f730aed` (feat)
3. **Task 3: Minimal, fully pinned requirements.txt (HARD-10)** - `1a62efc` (chore)

_No TDD tasks in this plan; no plan-metadata commit yet (this SUMMARY commit follows)._

## Files Created/Modified
- `api/config.py` - New module with `REQUIRED_ENV_VARS` list and `validate_required_env()` fail-fast check
- `api/main.py` - `lifespan()` now calls `validate_required_env()` before `init_supabase()`
- `api/routers/webhooks.py` - GHL `handle_inbound_message` (3 execute calls) and `handle_contact_tag_added` (2 execute calls) offloaded to threadpool
- `api/routers/callrail_webhooks.py` - `process_callrail_event`'s client select, calls-existing select, calls insert, and leads insert (4 execute calls) offloaded to threadpool
- `api/services/stripe_service.py` - `handle_subscription_created`, `handle_subscription_deleted`, `handle_invoice_paid` (2 calls), `handle_invoice_failed` (5 execute calls total) offloaded to threadpool
- `api/requirements.txt` - Rewritten to 9 pinned top-level packages; runtime.txt verified unchanged (already pins `python-3.12.7`)

## Decisions Made
- Kept the synchronous Supabase client (`get_supabase()`) unchanged and only wrapped `.execute()` calls in `run_in_threadpool` — no async client migration, matching the plan's explicit "do not switch to an async client" instruction
- Did not modify `api/runtime.txt` — confirmed it already pins `python-3.12.7` per Phase 6 FIX-06, per plan instruction to verify-not-change

## Deviations from Plan

None - plan executed exactly as written. Query logic, column lists, and control flow were left untouched in all three files; only `.execute()` calls were wrapped.

## Self-Check: PASSED

- FOUND: api/config.py
- FOUND: api/routers/webhooks.py (modified)
- FOUND: api/routers/callrail_webhooks.py (modified)
- FOUND: api/services/stripe_service.py (modified)
- FOUND: api/requirements.txt (modified)
- FOUND commit 29c3ddb
- FOUND commit f730aed
- FOUND commit 1a62efc
- `python -m py_compile` on all 5 changed Python files: exit 0
- Empty-environment boot check raises "Missing required environment variables": confirmed
- `requirements.txt`: 0 unpinned (`>=`) entries, 0 excluded-package matches, 9 `==` entries, `resend[async]==2.32.2` present, `runtime.txt` still pins `python-3.12`
