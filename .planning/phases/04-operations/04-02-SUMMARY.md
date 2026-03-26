---
phase: 04-operations
plan: 02
subsystem: payments
tags: [stripe, resend, webhooks, billing, fastapi, python]

# Dependency graph
requires:
  - phase: 04-operations
    provides: Supabase billing table with stripe_invoice_id UNIQUE, clients table with stripe_customer_id

provides:
  - POST /api/webhooks/stripe endpoint with Stripe signature verification
  - customer.subscription.created handler (activates client, stores stripe_subscription_id)
  - customer.subscription.deleted handler (deactivates client)
  - invoice.payment_succeeded handler (inserts billing record, idempotent on stripe_invoice_id)
  - invoice.payment_failed handler (Resend email alert to ADMIN_EMAIL)
  - resend[async] dependency enabling send_async for FastAPI background tasks

affects: [04-operations, future-billing-features]

# Tech tracking
tech-stack:
  added: ["resend[async]>=2.0.0 (Python SDK with async support for FastAPI)"]
  patterns:
    - "Stripe webhook signature verified with stripe.Webhook.construct_event before processing"
    - "stripe-signature header alias lowercase (FastAPI normalizes HTTP headers)"
    - "stripe.errors.SignatureVerificationError (v14.x namespace, not stripe.error)"
    - "Raw body read with await request.body() before any JSON parsing for signature integrity"
    - "BackgroundTasks for webhook processing — 200 returned immediately"
    - "UNIQUE constraint on stripe_invoice_id provides idempotency guard for duplicate events"

key-files:
  created:
    - api/services/stripe_service.py
    - api/routers/stripe_webhooks.py
  modified:
    - api/requirements.txt
    - api/.env.example
    - api/main.py

key-decisions:
  - "stripe.errors.SignatureVerificationError used (v14.x namespace) — not stripe.error which is v13.x and below"
  - "stripe-signature header alias is lowercase — FastAPI normalizes all HTTP headers to lowercase"
  - "resend[async] extra required for send_async() — bare resend package lacks anyio dependency"
  - "Duplicate invoice events caught by UNIQUE DB constraint + exception handling — no pre-check query needed"

patterns-established:
  - "Stripe webhook router: verify signature -> return 200 immediately -> process in BackgroundTasks"
  - "Client lookup: stripe_customer_id field on clients table maps Stripe events to internal records"

requirements-completed: [BILL-01, BILL-02, BILL-03, BILL-04, BILL-05, BILL-06]

# Metrics
duration: 5min
completed: 2026-03-26
---

# Phase 4 Plan 02: Stripe Webhook Handler Summary

**Stripe subscription lifecycle automation with signature verification, four event handlers (activate/deactivate/billing/alert), and Resend async email integration for payment failure alerts**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-26T21:44:48Z
- **Completed:** 2026-03-26T21:49:26Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Stripe webhook endpoint at POST /api/webhooks/stripe with signature verification rejecting invalid requests with 400 (BILL-05)
- Four event handlers: subscription.created activates client (BILL-01), subscription.deleted deactivates client (BILL-02), invoice.payment_succeeded inserts billing record (BILL-03), invoice.payment_failed sends Resend alert (BILL-04)
- Idempotency guard: UNIQUE constraint on stripe_invoice_id prevents duplicate billing records (BILL-06)
- resend[async] Python SDK added enabling send_async in FastAPI async background tasks

## Task Commits

Each task was committed atomically:

1. **Task 1: Add resend[async] to requirements.txt and create Stripe service module** - `905dc5b` (feat)
2. **Task 2: Create Stripe webhook router and wire into FastAPI app** - `660d3ae` (feat)

**Plan metadata:** (docs commit - below)

## Files Created/Modified
- `api/services/stripe_service.py` - Four Stripe event handlers with Supabase writes and Resend alerts
- `api/routers/stripe_webhooks.py` - POST /api/webhooks/stripe with signature verification and BackgroundTasks
- `api/main.py` - Added stripe_webhooks router import and include_router
- `api/requirements.txt` - Added resend[async]>=2.0.0
- `api/.env.example` - Added ADMIN_EMAIL= env var

## Decisions Made
- stripe.errors.SignatureVerificationError used (v14.x namespace) — not stripe.error which is v13.x and below
- stripe-signature header alias is lowercase — FastAPI normalizes all HTTP headers to lowercase
- resend[async] extra required for send_async() — bare resend package lacks anyio dependency
- Duplicate invoice events caught by UNIQUE DB constraint + exception handling — no pre-check query needed (avoids race condition)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

External services require manual configuration before this webhook handler is live:

1. **Stripe Dashboard:** Create webhook endpoint pointing to `https://{railway-url}/api/webhooks/stripe`
   - Location: Stripe Dashboard -> Developers -> Webhooks -> Add endpoint
   - Events to listen for: `customer.subscription.created`, `customer.subscription.deleted`, `invoice.payment_succeeded`, `invoice.payment_failed`

2. **Railway Environment Variables:**
   - `STRIPE_WEBHOOK_SECRET` — from Stripe Dashboard -> Developers -> Webhooks -> Signing secret (whsec_...)
   - `ADMIN_EMAIL` — email address to receive payment failure alerts
   - `RESEND_API_KEY` — already required from Phase 2; confirm set in Railway

## Next Phase Readiness
- Stripe billing automation complete; subscription lifecycle updates client records automatically
- CallRail integration (04-03) and admin panel (04-01) can proceed independently
- Requires Railway deployment with STRIPE_WEBHOOK_SECRET and ADMIN_EMAIL set for end-to-end testing

---
*Phase: 04-operations*
*Completed: 2026-03-26*
