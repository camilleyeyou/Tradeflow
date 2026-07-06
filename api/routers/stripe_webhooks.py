"""Stripe webhook handler.

POST /api/webhooks/stripe receives all Stripe webhook events.
Verifies signature with stripe.Webhook.construct_event before processing (BILL-05).
Returns 200 immediately; event processing runs in BackgroundTasks (D-62).
"""

import os
import logging
from typing import Optional

import stripe
from fastapi import APIRouter, Request, Header, HTTPException, BackgroundTasks

from api.services.webhook_events import record_event, run_processing

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["stripe-webhooks"])


@router.post("/webhooks/stripe")
async def stripe_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    stripe_signature: Optional[str] = Header(default=None, alias="stripe-signature"),
):
    """Handle incoming Stripe webhook events.

    1. Read raw body bytes (MUST happen before any JSON parsing)
    2. Verify signature using stripe.Webhook.construct_event (BILL-05)
    3. Return 200 immediately (D-62)
    4. Process event in BackgroundTasks
    """
    # Read raw body — required for signature verification
    body = await request.body()

    if not stripe_signature:
        raise HTTPException(status_code=400, detail="Missing stripe-signature header")

    webhook_secret = os.environ.get("STRIPE_WEBHOOK_SECRET")
    if not webhook_secret:
        logger.error("[stripe-webhook] STRIPE_WEBHOOK_SECRET not configured")
        raise HTTPException(status_code=500, detail="Webhook secret not configured")

    try:
        event = stripe.Webhook.construct_event(
            payload=body,
            sig_header=stripe_signature,
            secret=webhook_secret,
        )
    except stripe.SignatureVerificationError:
        logger.warning("[stripe-webhook] Invalid signature")
        raise HTTPException(status_code=400, detail="Invalid Stripe signature")
    except ValueError:
        logger.warning("[stripe-webhook] Invalid payload")
        raise HTTPException(status_code=400, detail="Invalid payload")

    logger.info("[stripe-webhook] Received event type=%s id=%s", event["type"], event["id"])

    # Durably record the raw event before ACK (DUR-01). Dedup on Stripe's
    # event id; a real DB failure (non-duplicate) surfaces as 5xx so Stripe
    # retries the delivery.
    try:
        event_row_id = await record_event("stripe", event["id"], event["type"], dict(event), True)
    except Exception:
        logger.exception("[stripe-webhook] durable record failed")
        raise HTTPException(status_code=503, detail="Could not record event")
    if event_row_id is None:
        return {"status": "duplicate"}

    # Process in background — return 200 immediately (D-62)
    background_tasks.add_task(run_processing, "stripe", event_row_id, dict(event))
    return {"status": "received"}
