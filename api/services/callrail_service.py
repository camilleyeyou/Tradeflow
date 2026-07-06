"""CallRail webhook signature verification + payload model.

Verifies the CallRail webhook signature before any processing (MISS-01).
Fails closed: if the shared secret is not configured, verification always
returns False so no unauthenticated request is ever processed.

IMPLEMENTATION NOTE: confirm the exact CallRail v3 signature header name and
digest encoding from CallRail docs at deploy time (per DPLY checklist). The
default header alias used by the router is `Signature`. This implementation
supports both hex and base64 HMAC-SHA256 digest encodings so it works
regardless of which encoding CallRail sends.
"""

import base64
import hashlib
import hmac
import logging
import os
from typing import Optional

from pydantic import BaseModel, ConfigDict

logger = logging.getLogger(__name__)


def verify_callrail_signature(body: bytes, signature_header: Optional[str]) -> bool:
    """Verify a CallRail webhook signature (HMAC-SHA256 over the raw body).

    Fails closed: returns False if the signature header is missing or if
    CALLRAIL_WEBHOOK_SECRET is not configured.
    """
    if not signature_header:
        logger.warning("[callrail] Missing signature header")
        return False

    secret = os.environ.get("CALLRAIL_WEBHOOK_SECRET")
    if not secret:
        logger.error("[callrail] CALLRAIL_WEBHOOK_SECRET not configured — failing closed")
        return False

    digest = hmac.new(secret.encode(), body, hashlib.sha256)
    hex_digest = digest.hexdigest()
    b64_digest = base64.b64encode(digest.digest()).decode()

    if hmac.compare_digest(hex_digest, signature_header):
        return True
    if hmac.compare_digest(b64_digest, signature_header):
        return True

    logger.warning("[callrail] Signature verification failed")
    return False


class CallRailEvent(BaseModel):
    """CallRail call-webhook payload (subset of fields we care about).

    IMPLEMENTATION NOTE: field names must be confirmed against the actual
    CallRail v3 webhook payload shape at deploy time; `id` maps from
    `call.id` / `resource_id` depending on webhook configuration.
    """

    model_config = ConfigDict(extra="ignore")

    id: str
    answered: Optional[bool] = None
    duration: Optional[int] = None
    customer_phone_number: Optional[str] = None
    tracking_phone_number: Optional[str] = None
    recording: Optional[str] = None
    customer_city: Optional[str] = None
    customer_zip: Optional[str] = None


def is_missed_call(event: CallRailEvent) -> bool:
    """Return True when the call was not answered (missed/unanswered)."""
    return event.answered is False
