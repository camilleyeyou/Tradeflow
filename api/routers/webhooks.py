"""GHL webhook handler.

Single endpoint at POST /api/webhooks/ghl that receives all GHL events.
Routes by event_type field in payload (per D-28: GHL allows only one webhook URL per app).
"""

import hashlib
import json
import logging
import os
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Request, Header, HTTPException, BackgroundTasks
from fastapi.concurrency import run_in_threadpool

from api.services.crypto import decrypt_token
from api.services.ghl_api import send_sms
from api.services.ghl_service import verify_ghl_ed25519_signature
from api.services.supabase_client import get_supabase
from api.services.webhook_events import record_event, run_processing

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["webhooks"])


@router.post("/webhooks/ghl")
async def ghl_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    x_ghl_signature: Optional[str] = Header(default=None, alias="X-GHL-Signature"),
):
    # Read raw body BEFORE JSON parsing — required for signature verification
    body = await request.body()

    # Signature verification (per D-26, GHL-05, SEC-03) — Ed25519 only
    if not x_ghl_signature:
        raise HTTPException(status_code=401, detail="Missing GHL signature header")
    if not verify_ghl_ed25519_signature(body, x_ghl_signature):
        raise HTTPException(status_code=401, detail="Invalid GHL Ed25519 signature")

    # Parse payload after signature is verified
    payload = json.loads(body)
    event_type = payload.get("type") or payload.get("event_type", "")

    logger.info("[ghl-webhook] Received event_type=%s", event_type)

    # Durably record the raw event before ACK (DUR-01). GHL payloads don't
    # guarantee a single canonical event-id field, so fall back through the
    # common candidates and finally a body hash for a stable dedup key.
    provider_event_id = str(
        payload.get("webhookId") or payload.get("id") or payload.get("messageId")
        or hashlib.sha256(body).hexdigest()
    )
    try:
        event_row_id = await record_event("ghl", provider_event_id, event_type, payload, True)
    except Exception:
        logger.exception("[ghl-webhook] durable record failed")
        raise HTTPException(status_code=503, detail="Could not record event")
    if event_row_id is None:
        return {"status": "duplicate"}

    # Process in background — return 200 immediately (per D-28)
    background_tasks.add_task(run_processing, "ghl", event_row_id, payload)
    return {"status": "received"}


async def process_ghl_event(event_type: str, payload: dict) -> None:
    """Route GHL events by type and process them."""
    db = get_supabase()

    if event_type == "InboundMessage":
        await handle_inbound_message(db, payload)
    elif event_type == "ContactTagAdded":
        await handle_contact_tag_added(db, payload)
    else:
        logger.info("[ghl-webhook] Unhandled event_type=%s", event_type)


async def handle_inbound_message(db, payload: dict) -> None:
    """Handle InboundMessage: append to lead notes, stop SMS sequence (per D-27)."""
    contact_id = payload.get("contactId")
    message_body = payload.get("body", "")

    if not contact_id:
        logger.warning("[ghl-webhook] InboundMessage missing contactId")
        return

    # Look up lead by ghl_contact_id
    result = await run_in_threadpool(
        lambda: db.table("leads").select("id, notes").eq("ghl_contact_id", contact_id).execute()
    )
    if not result.data:
        logger.warning("[ghl-webhook] No lead found for ghl_contact_id=%s", contact_id)
        return

    lead = result.data[0]
    lead_id = lead["id"]
    existing_notes = lead.get("notes") or ""

    # Append SMS reply to notes
    updated_notes = f"{existing_notes}\n[SMS Reply] {message_body}".strip()
    await run_in_threadpool(
        lambda: db.table("leads").update({"notes": updated_notes}).eq("id", lead_id).execute()
    )

    # Mark pending sms_sequences as stopped (per LEAD-06)
    await run_in_threadpool(
        lambda: db.table("sms_sequences")
        .update({"status": "stopped"})
        .eq("lead_id", lead_id)
        .eq("status", "pending")
        .execute()
    )

    logger.info("[ghl-webhook] InboundMessage processed for lead_id=%s", lead_id)


async def handle_contact_tag_added(db, payload: dict) -> None:
    """Handle ContactTagAdded: sync tag to lead status if it matches a pipeline stage (per D-27)."""
    contact_id = payload.get("contactId")
    tags = payload.get("tags", [])

    if not contact_id:
        logger.warning("[ghl-webhook] ContactTagAdded missing contactId")
        return

    TAG_TO_STATUS = {
        "contacted": "contacted",
        "booked": "booked",
        "completed": "completed",
        "lost": "lost",
    }

    for tag in tags:
        tag_lower = tag.lower() if isinstance(tag, str) else ""
        if tag_lower in TAG_TO_STATUS:
            result = await run_in_threadpool(
                lambda: db.table("leads")
                .select("id, client_id, phone, review_requested_at")
                .eq("ghl_contact_id", contact_id)
                .execute()
            )
            if result.data:
                lead = result.data[0]
                lead_id = lead["id"]
                new_status = TAG_TO_STATUS[tag_lower]
                await run_in_threadpool(
                    lambda: db.table("leads").update({"status": new_status}).eq("id", lead_id).execute()
                )
                logger.info("[ghl-webhook] Tag '%s' -> status '%s' for lead_id=%s", tag, new_status, lead_id)
                if new_status == "completed":
                    await _maybe_send_review_request(db, lead, contact_id)
            break  # Only process first matching tag


def _resolve_client_token(client_row: dict) -> Optional[str]:
    enc = client_row.get("ghl_private_token_encrypted")
    if enc:
        try:
            return decrypt_token(enc)
        except Exception as e:
            logger.error("[ghl-webhook] token decrypt failed: %s", e)
    return os.environ.get("GHL_PRIVATE_TOKEN")


async def _maybe_send_review_request(db, lead: dict, contact_id: str) -> None:
    """Send a one-time Google review-request SMS when a lead is marked completed.

    Idempotency contract: claim leads.review_requested_at FIRST via a
    conditional update (`.is_("review_requested_at", "null")`) — only proceed
    if a row was actually affected. This is the single guard that prevents
    this path and the Next.js updateLeadStatus path from ever double-sending.

    Wrapped entirely in try/except — never re-raises, so webhook processing
    and the already-returned 200 response are never affected by a failure
    here.
    """
    try:
        if lead.get("review_requested_at") is not None:
            return

        client_result = await run_in_threadpool(
            lambda: db.table("clients")
            .select("business_name, google_review_url, review_requests_enabled, ghl_private_token_encrypted")
            .eq("id", lead["client_id"])
            .execute()
        )
        if not client_result.data:
            return
        client = client_result.data[0]
        if not client.get("review_requests_enabled") or not client.get("google_review_url"):
            return

        claim = await run_in_threadpool(
            lambda: db.table("leads")
            .update({"review_requested_at": datetime.now(timezone.utc).isoformat()})
            .eq("id", lead["id"])
            .is_("review_requested_at", "null")
            .execute()
        )
        if not claim.data:
            # Another path (Next.js updateLeadStatus) already claimed this lead.
            return

        token = _resolve_client_token(client)
        if not token:
            logger.warning("[ghl-webhook] no GHL token available for review request, lead_id=%s", lead["id"])
            return

        message = (
            f"Thanks for choosing {client.get('business_name') or 'us'}! "
            f"If we did a great job, would you mind leaving us a quick review? {client['google_review_url']}"
        )
        await send_sms(contact_id, message, token)
        logger.info("[ghl-webhook] review request sent for lead_id=%s", lead["id"])
    except Exception:
        logger.exception("[ghl-webhook] review request failed for lead_id=%s", lead.get("id"))
