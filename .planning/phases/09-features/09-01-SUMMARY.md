---
phase: 09-features
plan: 01
subsystem: api
tags: [fastapi, webhooks, supabase, durability, idempotency, stripe, ghl, callrail]

# Dependency graph
requires:
  - phase: 07-medium-priority-hardening
    provides: run_in_threadpool wrapping pattern for sync Supabase client calls
provides:
  - webhook_events table (migration 010) with UNIQUE(provider, provider_event_id) dedup + RLS enabled/no-policy
  - api/services/webhook_events.py — record_event/mark_processed/mark_failed/run_processing/reprocess_event
  - record-before-ACK conversion of all 3 FastAPI webhook handlers (Stripe, GHL, CallRail)
  - scripts/replay_webhook_event.py — CLI replay of a stored event by id
affects: [09-02, 09-03, 09-04, 09-05, observability, launch-readiness]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Record-before-ACK: webhook handlers durably persist the raw provider event synchronously, after signature verification and before returning 200, then dispatch background processing against the stored row id"
    - "Dedup via UNIQUE(provider, provider_event_id) constraint — a caught duplicate-key exception short-circuits to {\"status\": \"duplicate\"} instead of reprocessing"
    - "Non-duplicate durable-insert failures re-raise to the router, which returns 503 so the provider's own retry mechanism redelivers"
    - "Lazy imports inside webhook_events.run_processing avoid circular imports between the shared service and the per-provider router/service modules"

key-files:
  created:
    - supabase/migrations/010_webhook_events.sql
    - api/services/webhook_events.py
    - scripts/replay_webhook_event.py
  modified:
    - api/routers/stripe_webhooks.py
    - api/routers/webhooks.py
    - api/routers/callrail_webhooks.py

key-decisions:
  - "GHL payloads lack a single canonical event-id field — provider_event_id falls back through webhookId -> id -> messageId -> sha256(body) so every GHL delivery still gets a stable dedup key"
  - "webhook_events RLS is enabled with zero policies (service-role only) — matches the DUR-01 decision in 09-CONTEXT.md; no anon/authenticated access is intended"
  - "Existing process_stripe_event / process_ghl_event / process_callrail_event functions were left in place and are now invoked by webhook_events.run_processing instead of directly by BackgroundTasks.add_task — no behavioral change to the actual per-provider processing logic"

patterns-established:
  - "Any future webhook provider integration should follow the same record_event -> BackgroundTasks(run_processing) -> mark_processed/mark_failed shape rather than dispatching directly to a processing function"

requirements-completed: [DUR-01]

# Metrics
duration: 12min
completed: 2026-07-06
---

# Phase 9 Plan 1: Webhook Durability (DUR-01) Summary

**Durable webhook_events log (migration 010) with UNIQUE(provider, provider_event_id) dedup; all 3 FastAPI webhook handlers now record the raw event synchronously before returning 200, dispatch background processing against the stored row, and support on-demand replay via a CLI script.**

## Performance

- **Duration:** 12 min
- **Tasks:** 3
- **Files modified:** 6 (3 created, 3 modified)

## Accomplishments
- No inbound webhook (Stripe, GHL, CallRail) can be silently lost — the raw event is durably persisted before any 200 is returned, and a failed durable insert now surfaces as a 503 so the provider retries instead of the event vanishing
- Redelivered events (same provider + provider_event_id) are detected via a UNIQUE constraint and short-circuited to `{"status": "duplicate"}` without reprocessing
- Every stored event transitions through received -> processed/failed, and any stored row can be reprocessed on demand with `python -m scripts.replay_webhook_event <id>`

## Task Commits

Each task was committed atomically:

1. **Task 1: Create the webhook_events migration (010)** - `8aa44e3` (feat)
2. **Task 2: Build the webhook_events service (record / mark / dispatch / replay)** - `76fe607` (feat)
3. **Task 3: Convert all 3 handlers to record-before-ACK + add replay script** - `dd07b1c` (feat)

_No TDD tasks in this plan; no plan-metadata commit yet (this SUMMARY + STATE/ROADMAP updates are committed separately below)._

## Files Created/Modified
- `supabase/migrations/010_webhook_events.sql` - webhook_events table, UNIQUE(provider, provider_event_id), RLS enabled/no policies, status check constraint, lookup index
- `api/services/webhook_events.py` - record_event, mark_processed, mark_failed, run_processing, reprocess_event
- `api/routers/stripe_webhooks.py` - record-before-ACK, 503-on-durable-failure, dispatch via run_processing
- `api/routers/webhooks.py` - record-before-ACK (GHL), provider_event_id fallback chain, dispatch via run_processing
- `api/routers/callrail_webhooks.py` - record-before-ACK, dispatch via run_processing
- `scripts/replay_webhook_event.py` - CLI: `python -m scripts.replay_webhook_event <webhook_events.id>`

## Decisions Made
- GHL provider_event_id fallback chain (webhookId -> id -> messageId -> body hash) since GHL's webhook payload shape doesn't guarantee one canonical id field across all event types
- webhook_events RLS enabled with no policies at all — deliberately service-role-only, per the DUR-01 decision already recorded in 09-CONTEXT.md
- Kept all existing per-provider processing functions (process_stripe_event, process_ghl_event, process_callrail_event) unchanged; only their invocation point moved from BackgroundTasks.add_task directly to webhook_events.run_processing

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required. Migration 010 will be applied to Supabase as part of the existing deploy/migration process (tracked separately under DPLY-01/DPLY-02 blockers in STATE.md).

## Next Phase Readiness

- DUR-01 is complete: webhook_events table, service, all 3 handlers, and replay script are all in place and py_compile-verified
- Ready to proceed to 09-02 (OBSV-01/OBSV-02 — Sentry + backups/uptime)
- No blockers introduced; migration 010 has not yet been applied to a live Supabase instance (consistent with the existing pre-launch deploy blocker already tracked in STATE.md)

---
*Phase: 09-features*
*Completed: 2026-07-06*

## Self-Check: PASSED

All created/modified files verified present on disk; all 3 task commit hashes (8aa44e3, 76fe607, dd07b1c) verified present in git history.
