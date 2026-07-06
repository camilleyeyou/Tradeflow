"""Durable webhook event log service (DUR-01).

Every FastAPI webhook handler (Stripe, GHL, CallRail) calls `record_event`
synchronously, AFTER signature verification and BEFORE returning 200. A
duplicate provider_event_id (redelivery) is a benign no-op — the caller
short-circuits with a "duplicate" response. Any other durable-insert failure
propagates so the caller can return 5xx and the provider retries.

Background processing then runs via `run_processing`, which dispatches to the
existing per-provider handler and flips the stored row to processed/failed.
`reprocess_event` supports on-demand replay of any stored event by id.
"""

import logging
from datetime import datetime, timezone
from typing import Optional

from fastapi.concurrency import run_in_threadpool

from api.services.supabase_client import get_supabase

logger = logging.getLogger(__name__)


async def record_event(
    provider: str,
    provider_event_id: str,
    event_type: str,
    payload: dict,
    signature_verified: bool,
) -> Optional[str]:
    """Durably record a raw provider event before ACK.

    Returns the new webhook_events row id, or None if this is a duplicate
    redelivery (same provider + provider_event_id already recorded). Any
    other failure is re-raised so the caller can return 5xx for retry.
    """
    db = get_supabase()
    try:
        result = await run_in_threadpool(
            lambda: db.table("webhook_events")
            .insert(
                {
                    "provider": provider,
                    "provider_event_id": provider_event_id,
                    "event_type": event_type,
                    "payload": payload,
                    "signature_verified": signature_verified,
                    "status": "received",
                }
            )
            .execute()
        )
        return result.data[0]["id"]
    except Exception as e:
        if "duplicate" in str(e).lower() or "unique" in str(e).lower():
            logger.info(
                "[webhook_events] Duplicate %s event_id=%s — skipping", provider, provider_event_id
            )
            return None
        logger.error(
            "[webhook_events] Durable record failed for %s event_id=%s: %s",
            provider, provider_event_id, e,
        )
        raise


async def mark_processed(event_row_id: str) -> None:
    """Flip a stored webhook_events row to status='processed'."""
    db = get_supabase()
    try:
        await run_in_threadpool(
            lambda: db.table("webhook_events")
            .update(
                {
                    "status": "processed",
                    "processed_at": datetime.now(timezone.utc).isoformat(),
                }
            )
            .eq("id", event_row_id)
            .execute()
        )
    except Exception as e:
        logger.exception(
            "[webhook_events] Failed to mark event_row_id=%s processed: %s", event_row_id, e
        )


async def mark_failed(event_row_id: str, error: str) -> None:
    """Flip a stored webhook_events row to status='failed' with the error."""
    db = get_supabase()
    try:
        await run_in_threadpool(
            lambda: db.table("webhook_events")
            .update(
                {
                    "status": "failed",
                    "error": error[:2000],
                    "processed_at": datetime.now(timezone.utc).isoformat(),
                }
            )
            .eq("id", event_row_id)
            .execute()
        )
    except Exception as e:
        logger.exception(
            "[webhook_events] Failed to mark event_row_id=%s failed: %s", event_row_id, e
        )


async def run_processing(provider: str, event_row_id: str, payload: dict) -> None:
    """Dispatch a recorded event to its provider handler and flip status.

    Runs in a BackgroundTask. Never re-raises — any processing failure is
    caught, logged, and recorded on the stored row via mark_failed.
    """
    try:
        if provider == "stripe":
            from api.services.stripe_service import process_stripe_event
            await process_stripe_event(payload)
        elif provider == "ghl":
            from api.routers.webhooks import process_ghl_event
            event_type = payload.get("type") or payload.get("event_type", "")
            await process_ghl_event(event_type, payload)
        elif provider == "callrail":
            from api.services.callrail_service import CallRailEvent
            from api.routers.callrail_webhooks import process_callrail_event
            await process_callrail_event(CallRailEvent(**payload))
        else:
            raise ValueError(f"Unknown provider: {provider}")

        await mark_processed(event_row_id)
    except Exception as e:
        logger.exception(
            "[webhook_events] Processing failed for provider=%s event_row_id=%s", provider, event_row_id
        )
        await mark_failed(event_row_id, str(e))


async def reprocess_event(event_row_id: str) -> None:
    """Replay a stored webhook_events row by id (on-demand redelivery)."""
    db = get_supabase()
    result = await run_in_threadpool(
        lambda: db.table("webhook_events").select("*").eq("id", event_row_id).execute()
    )
    if not result.data:
        raise ValueError(f"webhook_events row not found: {event_row_id}")

    row = result.data[0]
    await run_processing(row["provider"], event_row_id, row["payload"])
