"""Outbound GHL API client for the missed-call text-back workflow (MISS-03).

Uses httpx.AsyncClient exclusively — never `requests` (would block the
event loop under async webhook load, per CLAUDE.md constraints).
"""

import logging
from datetime import datetime, timezone
from typing import Optional

import httpx

logger = logging.getLogger(__name__)

GHL_BASE_URL = "https://services.leadconnectorhq.com"
GHL_API_VERSION = "2021-07-28"


def _truncate_phone(phone: Optional[str]) -> str:
    """Return only the last 4 digits of a phone number for safe logging."""
    if not phone:
        return "unknown"
    return f"***{phone[-4:]}" if len(phone) >= 4 else "***"


async def _ghl_post(path: str, token: str, json_body: dict) -> httpx.Response:
    url = f"{GHL_BASE_URL}{path}"
    headers = {
        "Authorization": f"Bearer {token}",
        "Version": GHL_API_VERSION,
        "Content-Type": "application/json",
    }
    async with httpx.AsyncClient(timeout=10.0) as client:
        return await client.post(url, headers=headers, json=json_body)


async def create_contact(location_id: str, phone: str, token: str) -> Optional[str]:
    """Create (or upsert) a GHL contact for the given phone number.

    Returns the contact id, or None on failure.
    """
    try:
        response = await _ghl_post(
            "/contacts/",
            token,
            {"locationId": location_id, "phone": phone},
        )
        response.raise_for_status()
        data = response.json()
        contact_id = data.get("contact", {}).get("id")
        return contact_id
    except Exception as e:
        logger.error(
            "[ghl_api] create_contact failed for phone=%s: %s",
            _truncate_phone(phone),
            e,
        )
        return None


async def add_to_workflow(contact_id: str, workflow_id: str, token: str) -> bool:
    """Add a contact to a GHL workflow (triggers the text-back SMS sequence)."""
    try:
        response = await _ghl_post(
            f"/contacts/{contact_id}/workflow/{workflow_id}",
            token,
            {"eventStartTime": datetime.now(timezone.utc).isoformat()},
        )
        response.raise_for_status()
        return True
    except Exception as e:
        logger.error(
            "[ghl_api] add_to_workflow failed for contact_id=%s workflow_id=%s: %s",
            contact_id,
            workflow_id,
            e,
        )
        return False


async def trigger_textback(
    location_id: str, phone: str, token: str, workflow_id: str
) -> bool:
    """Orchestrate create_contact -> add_to_workflow for the missed-call text-back.

    Per-client token seam — Phase 6 FIX-01 will pass the client's own stored
    GHL token; for now the caller supplies the configured (shared) token.
    """
    contact_id = await create_contact(location_id, phone, token)
    if not contact_id:
        logger.error(
            "[ghl_api] trigger_textback aborted — no contact_id for phone=%s",
            _truncate_phone(phone),
        )
        return False

    success = await add_to_workflow(contact_id, workflow_id, token)
    if not success:
        logger.error(
            "[ghl_api] trigger_textback failed to add contact_id=%s to workflow=%s",
            contact_id,
            workflow_id,
        )
        return False

    logger.info(
        "[ghl_api] trigger_textback succeeded for phone=%s", _truncate_phone(phone)
    )
    return True
