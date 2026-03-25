"""GHL webhook handler.

Single endpoint at POST /api/webhooks/ghl that receives all GHL events.
Routes by event_type field in payload (per D-28: GHL allows only one webhook URL per app).
"""

import json
import logging
from typing import Optional

from fastapi import APIRouter, Request, Header, HTTPException, BackgroundTasks

from api.services.ghl_service import verify_ghl_ed25519_signature, verify_ghl_legacy_signature
from api.services.supabase_client import get_supabase

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["webhooks"])


@router.post("/webhooks/ghl")
async def ghl_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    x_ghl_signature: Optional[str] = Header(default=None, alias="X-GHL-Signature"),
    x_wh_signature: Optional[str] = Header(default=None, alias="X-WH-Signature"),
):
    # Read raw body BEFORE JSON parsing — required for signature verification
    body = await request.body()

    # Signature verification (per D-26, GHL-05)
    # Prefer Ed25519 (new); fall back to legacy RSA during transition
    if x_ghl_signature:
        if not verify_ghl_ed25519_signature(body, x_ghl_signature):
            raise HTTPException(status_code=401, detail="Invalid GHL Ed25519 signature")
    elif x_wh_signature:
        if not verify_ghl_legacy_signature(body, x_wh_signature):
            raise HTTPException(status_code=401, detail="Invalid GHL legacy signature")
    else:
        raise HTTPException(status_code=401, detail="Missing GHL signature header")

    # Parse payload after signature is verified
    payload = json.loads(body)
    event_type = payload.get("type") or payload.get("event_type", "")

    logger.info("[ghl-webhook] Received event_type=%s", event_type)

    # Process in background — return 200 immediately (per D-28)
    background_tasks.add_task(process_ghl_event, event_type, payload)
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
    result = db.table("leads").select("id, notes").eq("ghl_contact_id", contact_id).execute()
    if not result.data:
        logger.warning("[ghl-webhook] No lead found for ghl_contact_id=%s", contact_id)
        return

    lead = result.data[0]
    lead_id = lead["id"]
    existing_notes = lead.get("notes") or ""

    # Append SMS reply to notes
    updated_notes = f"{existing_notes}\n[SMS Reply] {message_body}".strip()
    db.table("leads").update({"notes": updated_notes}).eq("id", lead_id).execute()

    # Mark pending sms_sequences as stopped (per LEAD-06)
    db.table("sms_sequences").update({"status": "stopped"}).eq("lead_id", lead_id).eq("status", "pending").execute()

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
            result = db.table("leads").select("id").eq("ghl_contact_id", contact_id).execute()
            if result.data:
                lead_id = result.data[0]["id"]
                new_status = TAG_TO_STATUS[tag_lower]
                db.table("leads").update({"status": new_status}).eq("id", lead_id).execute()
                logger.info("[ghl-webhook] Tag '%s' -> status '%s' for lead_id=%s", tag, new_status, lead_id)
            break  # Only process first matching tag
