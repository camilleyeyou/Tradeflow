"""Stripe event processing service.

Handles four Stripe webhook event types per D-60:
- customer.subscription.created -> activate client
- customer.subscription.deleted -> deactivate client
- invoice.payment_succeeded -> insert billing record
- invoice.payment_failed -> send alert email via Resend
"""

import os
import logging
from datetime import datetime, timezone

import resend
from api.services.supabase_client import get_supabase

logger = logging.getLogger(__name__)


async def process_stripe_event(event: dict) -> None:
    """Route Stripe event by type and process in background."""
    event_type = event["type"]
    obj = event["data"]["object"]

    if event_type == "customer.subscription.created":
        await handle_subscription_created(obj)
    elif event_type == "customer.subscription.deleted":
        await handle_subscription_deleted(obj)
    elif event_type == "invoice.payment_succeeded":
        await handle_invoice_paid(obj)
    elif event_type == "invoice.payment_failed":
        await handle_invoice_failed(obj)
    else:
        logger.info("[stripe] Unhandled event_type=%s", event_type)


async def handle_subscription_created(subscription: dict) -> None:
    """Set is_active=true and store stripe_subscription_id on client (BILL-01)."""
    db = get_supabase()
    customer_id = subscription["customer"]
    subscription_id = subscription["id"]

    result = db.table("clients").update({
        "is_active": True,
        "stripe_subscription_id": subscription_id,
    }).eq("stripe_customer_id", customer_id).execute()

    if not result.data:
        logger.warning(
            "[stripe] No client found for customer_id=%s on subscription.created", customer_id
        )
    else:
        logger.info("[stripe] Activated client for customer_id=%s", customer_id)


async def handle_subscription_deleted(subscription: dict) -> None:
    """Set is_active=false on client (BILL-02)."""
    db = get_supabase()
    customer_id = subscription["customer"]

    result = db.table("clients").update({
        "is_active": False,
    }).eq("stripe_customer_id", customer_id).execute()

    if not result.data:
        logger.warning(
            "[stripe] No client found for customer_id=%s on subscription.deleted", customer_id
        )
    else:
        logger.info("[stripe] Deactivated client for customer_id=%s", customer_id)


async def handle_invoice_paid(invoice: dict) -> None:
    """Insert billing record (BILL-03). UNIQUE on stripe_invoice_id prevents duplicates (BILL-06)."""
    db = get_supabase()
    customer_id = invoice["customer"]

    # Look up client_id from stripe_customer_id (D-63)
    client_result = db.table("clients").select("id, business_name").eq(
        "stripe_customer_id", customer_id
    ).execute()

    if not client_result.data:
        logger.warning("[stripe] No client for invoice customer_id=%s", customer_id)
        return

    client = client_result.data[0]

    period_start = (
        datetime.fromtimestamp(invoice["period_start"], tz=timezone.utc).isoformat()
        if invoice.get("period_start") else None
    )
    period_end = (
        datetime.fromtimestamp(invoice["period_end"], tz=timezone.utc).isoformat()
        if invoice.get("period_end") else None
    )

    try:
        db.table("billing").insert({
            "client_id": client["id"],
            "stripe_invoice_id": invoice["id"],
            "stripe_subscription_id": invoice.get("subscription"),
            "amount_cents": invoice.get("amount_paid", 0),
            "currency": invoice.get("currency", "usd"),
            "status": "paid",
            "period_start": period_start,
            "period_end": period_end,
            "paid_at": datetime.now(tz=timezone.utc).isoformat(),
        }).execute()
        logger.info(
            "[stripe] Billing record created for client=%s invoice=%s",
            client["business_name"], invoice["id"]
        )
    except Exception as e:
        # UNIQUE constraint on stripe_invoice_id will raise on duplicates — this is expected (BILL-06)
        if "duplicate" in str(e).lower() or "unique" in str(e).lower():
            logger.info("[stripe] Duplicate invoice %s — skipping (idempotent)", invoice["id"])
        else:
            logger.error("[stripe] Failed to insert billing record: %s", e)


async def handle_invoice_failed(invoice: dict) -> None:
    """Send payment failure alert email via Resend to ADMIN_EMAIL (BILL-04)."""
    db = get_supabase()
    customer_id = invoice["customer"]

    client_result = db.table("clients").select("business_name").eq(
        "stripe_customer_id", customer_id
    ).execute()
    client_name = client_result.data[0]["business_name"] if client_result.data else "Unknown Client"

    amount_due = invoice.get("amount_due", 0)
    admin_email = os.environ.get("ADMIN_EMAIL")
    resend_from = os.environ.get("RESEND_FROM_EMAIL", "alerts@tradeflow.io")

    if not admin_email:
        logger.error("[stripe] ADMIN_EMAIL not set — cannot send payment failure alert")
        return

    resend.api_key = os.environ.get("RESEND_API_KEY", "")
    if not resend.api_key:
        logger.error("[stripe] RESEND_API_KEY not set — cannot send payment failure alert")
        return

    try:
        await resend.Emails.send_async({
            "from": f"Tradeflow <{resend_from}>",
            "to": [admin_email],
            "subject": f"Payment Failed: {client_name}",
            "html": (
                f"<h2>Payment Failed</h2>"
                f"<p>A payment of <strong>${amount_due / 100:.2f}</strong> failed for "
                f"<strong>{client_name}</strong>.</p>"
                f"<p>Please check the Stripe dashboard for details and follow up with the client.</p>"
            ),
        })
        logger.info("[stripe] Payment failure alert sent for client=%s", client_name)
    except Exception as e:
        logger.error("[stripe] Failed to send payment failure alert: %s", e)
