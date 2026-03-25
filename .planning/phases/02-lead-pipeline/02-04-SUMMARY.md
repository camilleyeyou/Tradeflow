---
phase: 02-lead-pipeline
plan: "04"
subsystem: fastapi-webhooks
tags: [ghl, webhooks, signature-verification, ed25519, sms, lead-pipeline]
dependency_graph:
  requires: [02-01]
  provides: [ghl-webhook-endpoint, ghl-signature-verification]
  affects: [leads.notes, leads.status, sms_sequences.status]
tech_stack:
  added: []
  patterns: [background-tasks, ed25519-signature-verification, event-routing]
key_files:
  created:
    - api/services/ghl_service.py
    - api/routers/webhooks.py
  modified:
    - api/main.py
decisions:
  - "GHL legacy RSA signature (X-WH-Signature) accepted permissively during transition — hard removal deadline July 1, 2026 documented in code"
  - "Background task processing for GHL events — immediate 200 OK response to GHL before processing"
  - "Single webhook endpoint routes by event_type field per GHL constraint (one URL per app)"
metrics:
  duration: 4 minutes
  completed_date: "2026-03-25"
  tasks_completed: 2
  files_changed: 3
---

# Phase 02 Plan 04: GHL Webhook Handler Summary

**One-liner:** GHL webhook endpoint with Ed25519 signature verification routing InboundMessage/ContactTagAdded events to Supabase lead and sms_sequences updates.

## What Was Built

Created the FastAPI GHL webhook handler that closes the loop on SMS follow-up automation. When a homeowner replies to an automated SMS, GHL fires an `InboundMessage` webhook — the handler logs the reply in the lead's notes and stops the pending SMS sequence. When GHL tags change (e.g., a technician marks a contact as "booked"), a `ContactTagAdded` event syncs that status back to Supabase.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create GHL signature verification service | 14d1bd2 | api/services/ghl_service.py |
| 2 | Create GHL webhook router and register in main.py | 37e6884 | api/routers/webhooks.py, api/main.py |

## Key Implementations

### GHL Signature Verification (api/services/ghl_service.py)

- `verify_ghl_ed25519_signature(body, header)`: Full Ed25519 verification using the `cryptography` library. Decodes the Base64 signature header and verifies against the GHL public key PEM.
- `verify_ghl_legacy_signature(body, header)`: Permissive acceptance during the GHL RSA-to-Ed25519 migration window. Logs a structured warning for every legacy request. Hard removal deadline (July 1, 2026) documented in both the docstring and log message.

### GHL Webhook Router (api/routers/webhooks.py)

- `POST /api/webhooks/ghl`: Single endpoint accepting all GHL events (per GHL constraint: one webhook URL per app).
- Reads raw body bytes before JSON parsing — required for signature verification to work.
- Signature gating: prefers `X-GHL-Signature` (Ed25519); falls back to `X-WH-Signature` (RSA legacy); rejects with 401 if neither present or if signature is invalid.
- Returns `{"status": "received"}` immediately; all processing in `BackgroundTasks`.
- `handle_inbound_message`: Looks up lead by `ghl_contact_id`, appends `[SMS Reply] {text}` to `leads.notes`, marks all pending `sms_sequences` for that lead as `stopped`.
- `handle_contact_tag_added`: Maps GHL tags (`contacted`, `booked`, `completed`, `lost`) to `leads.status` via lookup. Processes first matching tag only.

### main.py Update

Added `from api.routers import webhooks` and `app.include_router(webhooks.router)` to register the webhook routes.

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Legacy RSA permissive acceptance | GHL transition window — dropping legacy events would lose real lead data during migration |
| Hard July 1, 2026 removal deadline in code | Discoverable via grep (`REMOVE AFTER JULY 1, 2026`) so it doesn't get forgotten |
| Background task processing | GHL expects immediate 200; processing in background prevents timeouts on slow DB writes |
| Single endpoint routing by event_type | GHL architecture constraint — only one webhook URL allowed per app |

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all data paths are wired to Supabase. The `ghl_contact_id` field on leads must be populated by the lead intake flow (Phase 02-01 handles GHL contact creation and stores the ID).

## Self-Check: PASSED

Files verified:
- api/services/ghl_service.py: EXISTS
- api/routers/webhooks.py: EXISTS
- api/main.py: MODIFIED (contains `include_router(webhooks.router)`)

Commits verified:
- 14d1bd2: feat(02-04): create GHL webhook signature verification service
- 37e6884: feat(02-04): create GHL webhook router and register in main.py
