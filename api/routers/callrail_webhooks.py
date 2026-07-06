"""CallRail missed-call webhook handler (MISS-01..04).

POST /api/webhooks/callrail verifies the CallRail signature before any
processing, returns 200 fast, and processes the event in a BackgroundTask:
inserts a deduplicated `calls` row and a `direct_call` `leads` row, then
triggers the client's GHL text-back workflow within the 15-second budget.
"""

import json
import logging
from typing import Optional
import os

from fastapi import APIRouter, Request, Header, HTTPException, BackgroundTasks

from api.services.callrail_service import (
    verify_callrail_signature,
    CallRailEvent,
    is_missed_call,
)
from api.services.ghl_api import trigger_textback
from api.services.supabase_client import get_supabase

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["callrail-webhooks"])


def _truncate_phone(phone: Optional[str]) -> str:
    """Return only the last 4 digits of a phone number for safe logging."""
    if not phone:
        return "unknown"
    return f"***{phone[-4:]}" if len(phone) >= 4 else "***"


@router.post("/webhooks/callrail")
async def callrail_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    signature: Optional[str] = Header(default=None, alias="Signature"),
):
    # Read raw body BEFORE JSON parsing — required for signature verification
    body = await request.body()

    if not verify_callrail_signature(body, signature):
        raise HTTPException(status_code=401, detail="Invalid CallRail signature")

    try:
        payload = json.loads(body)
        event = CallRailEvent(**payload)
    except (json.JSONDecodeError, TypeError, ValueError) as e:
        logger.warning("[callrail-webhook] Invalid payload: %s", e)
        raise HTTPException(status_code=400, detail="Invalid CallRail payload")

    logger.info("[callrail-webhook] Received call id=%s answered=%s", event.id, event.answered)

    # Process in background — return 200 immediately so the 15s text-back
    # budget is met by the background task, not the webhook round-trip.
    background_tasks.add_task(process_callrail_event, event)
    return {"status": "received"}


async def process_callrail_event(event: CallRailEvent) -> None:
    """Insert deduped calls+leads rows for a missed call and trigger text-back."""
    if not is_missed_call(event):
        logger.info("[callrail-webhook] Call id=%s was answered — skipping", event.id)
        return

    db = get_supabase()

    # Resolve client by CallRail tracking number
    client_result = (
        db.table("clients")
        .select("id, ghl_sub_account_id")
        .eq("callrail_tracking_number", event.tracking_phone_number)
        .execute()
    )
    if not client_result.data:
        logger.warning(
            "[callrail-webhook] No client found for tracking_number=%s",
            _truncate_phone(event.tracking_phone_number),
        )
        return

    client = client_result.data[0]
    client_id = client["id"]
    ghl_sub_account_id = client.get("ghl_sub_account_id")

    # Dedup: idempotent redelivery of the same CallRail call id
    existing_call = (
        db.table("calls").select("id").eq("callrail_call_id", event.id).execute()
    )
    if existing_call.data:
        logger.info("[callrail-webhook] Call id=%s already processed — skipping", event.id)
        return

    # Insert calls row — these are exactly the columns the dashboard call log reads (MISS-04)
    db.table("calls").insert(
        {
            "client_id": client_id,
            "callrail_call_id": event.id,
            "caller_number": event.customer_phone_number,
            "tracking_number": event.tracking_phone_number,
            "duration_seconds": event.duration,
            "recording_url": event.recording,
            "outcome": "missed",
        }
    ).execute()

    # Insert leads row (source direct_call). Race dedup via unique index
    # leads_callrail_call_id_unique — treat a unique-violation as benign no-op.
    try:
        db.table("leads").insert(
            {
                "client_id": client_id,
                "phone": event.customer_phone_number,
                "zip_code": event.customer_zip,
                "source": "direct_call",
                "callrail_call_id": event.id,
            }
        ).execute()
    except Exception as e:
        if "duplicate key" in str(e).lower() or "unique" in str(e).lower():
            logger.info(
                "[callrail-webhook] Lead for call id=%s already exists — race dedup", event.id
            )
        else:
            logger.error("[callrail-webhook] Failed to insert lead for call id=%s: %s", event.id, e)

    # Trigger GHL text-back workflow (MISS-03)
    # Per-client token seam — Phase 6 FIX-01 will pass the client's own stored
    # GHL token; for now we read the shared configured token from env.
    ghl_token = os.environ.get("GHL_PRIVATE_TOKEN")
    workflow_id = os.environ.get("GHL_SMS_WORKFLOW_ID")

    if not (ghl_token and workflow_id and ghl_sub_account_id and event.customer_phone_number):
        logger.warning(
            "[callrail-webhook] Skipping text-back for call id=%s — missing GHL config",
            event.id,
        )
        return

    success = await trigger_textback(
        location_id=ghl_sub_account_id,
        phone=event.customer_phone_number,
        token=ghl_token,
        workflow_id=workflow_id,
    )
    if success:
        logger.info(
            "[callrail-webhook] Text-back triggered for phone=%s",
            _truncate_phone(event.customer_phone_number),
        )
    else:
        logger.error(
            "[callrail-webhook] Text-back failed for phone=%s",
            _truncate_phone(event.customer_phone_number),
        )
