"""GHL webhook signature verification.

Supports both X-GHL-Signature (Ed25519, preferred) and X-WH-Signature (RSA, legacy).
Legacy RSA support must be removed after July 1, 2026.

Source: https://marketplace.gohighlevel.com/docs/webhook/WebhookIntegrationGuide/index.html
"""

import base64
import logging
from typing import Optional

from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
from cryptography.hazmat.primitives.serialization import load_pem_public_key
from cryptography.exceptions import InvalidSignature

logger = logging.getLogger(__name__)

# GHL Ed25519 public key for webhook signature verification
# Source: GHL Developer Portal -> Webhook Integration Guide
GHL_ED25519_PUBLIC_KEY_PEM = b"""-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEAi2HR1srL4o18O8BRa7gVJY7G7bupbN3H9AwJrHCDiOg=
-----END PUBLIC KEY-----"""


def verify_ghl_ed25519_signature(body: bytes, signature_header: str) -> bool:
    """Verify X-GHL-Signature (Ed25519).

    Args:
        body: Raw request body bytes (must be read before JSON parsing).
        signature_header: Base64-encoded Ed25519 signature from X-GHL-Signature header.

    Returns:
        True if signature is valid, False otherwise.
    """
    try:
        sig_bytes = base64.b64decode(signature_header)
        pub_key = load_pem_public_key(GHL_ED25519_PUBLIC_KEY_PEM)
        if not isinstance(pub_key, Ed25519PublicKey):
            logger.error("[ghl] Loaded key is not Ed25519")
            return False
        pub_key.verify(sig_bytes, body)  # raises InvalidSignature on failure
        return True
    except InvalidSignature:
        logger.warning("[ghl] Ed25519 signature verification failed")
        return False
    except Exception as e:
        logger.error("[ghl] Signature verification error: %s", e)
        return False


def verify_ghl_legacy_signature(body: bytes, signature_header: str) -> bool:
    """Verify X-WH-Signature (RSA, legacy).

    SECURITY: KNOWN PERMISSIVE GAP — This function does NOT verify the RSA
    signature. It accepts all requests with an X-WH-Signature header during
    the GHL transition period. This is a deliberate trade-off to avoid
    dropping legitimate events while GHL migrates to Ed25519.

    HARD DEADLINE: Remove this function and all X-WH-Signature support
    after July 1, 2026 (GHL legacy deprecation date). After removal,
    only X-GHL-Signature (Ed25519) should be accepted.

    Args:
        body: Raw request body bytes.
        signature_header: Legacy RSA signature from X-WH-Signature header.

    Returns:
        True (permissive during transition). Log warning for tracking.
    """
    # SECURITY: Permissive-only during transition. Remove after July 1, 2026.
    logger.warning(
        "[ghl] Legacy X-WH-Signature received — RSA verification not implemented. "
        "Accepting during transition period. REMOVE AFTER JULY 1, 2026."
    )
    # TODO(security): Implement RSA verification or remove legacy support entirely.
    # Tracking: GHL deprecation deadline is July 1, 2026.
    return True
