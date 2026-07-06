"""GHL webhook signature verification.

Verifies X-GHL-Signature (Ed25519) only. Legacy X-WH-Signature (RSA) support was removed in Phase 5 (SEC-03).

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
