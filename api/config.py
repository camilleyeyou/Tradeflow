import os

REQUIRED_ENV_VARS = [
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "CALLRAIL_WEBHOOK_SECRET",
]


def validate_required_env() -> None:
    """Fail fast at boot if any required env var is missing or empty."""
    missing = [name for name in REQUIRED_ENV_VARS if not os.environ.get(name)]
    if missing:
        raise RuntimeError(
            "Missing required environment variables: "
            + ", ".join(missing)
            + ". Set them in Railway (or your local .env) before starting the service."
        )
