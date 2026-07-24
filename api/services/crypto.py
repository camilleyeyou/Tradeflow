"""Server-side token decryption mirroring apps/web/src/lib/crypto.ts.

Decrypts per-client GHL tokens stored as `iv:authTag:ciphertext` (hex-encoded
segments), AES-256-GCM, keyed on GHL_TOKEN_ENC_KEY (64 hex chars / 32 bytes).

Note: Node's crypto module stores the GCM authentication tag separately
(`cipher.getAuthTag()`), while Python's AESGCM expects ciphertext and tag
concatenated (`ciphertext || tag`). No AAD is used on either side.
"""

import os

from cryptography.hazmat.primitives.ciphers.aead import AESGCM


def _get_key() -> bytes:
    hex_key = os.environ.get("GHL_TOKEN_ENC_KEY")
    if not hex_key:
        raise ValueError("GHL_TOKEN_ENC_KEY missing or not 32 bytes (64 hex chars)")
    key = bytes.fromhex(hex_key)
    if len(key) != 32:
        raise ValueError("GHL_TOKEN_ENC_KEY missing or not 32 bytes (64 hex chars)")
    return key


def decrypt_token(payload: str) -> str:
    """Decrypts a payload produced by apps/web/src/lib/crypto.ts encryptToken().

    Reverses the `iv:authTag:ciphertext` format (hex-encoded segments).
    Raises if the key is missing/malformed or the payload is invalid.
    """
    key = _get_key()
    parts = payload.split(":")
    if len(parts) != 3:
        raise ValueError("Invalid encrypted token payload")
    iv_hex, tag_hex, ciphertext_hex = parts
    if not iv_hex or not tag_hex or not ciphertext_hex:
        raise ValueError("Invalid encrypted token payload")

    iv = bytes.fromhex(iv_hex)
    tag = bytes.fromhex(tag_hex)
    ciphertext = bytes.fromhex(ciphertext_hex)

    aesgcm = AESGCM(key)
    plaintext = aesgcm.decrypt(iv, ciphertext + tag, None)
    return plaintext.decode("utf-8")
