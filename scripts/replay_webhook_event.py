"""Replay a stored webhook_events row on demand (DUR-01).

Usage (run from repo root):

    python -m scripts.replay_webhook_event <webhook_events.id>

Loads SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY from the environment (or a
local .env via python-dotenv if present), initializes the service-role
Supabase client, and reprocesses the given webhook_events row through its
original provider handler (stripe / ghl / callrail), flipping its status to
processed or failed.
"""

import asyncio
import sys

try:
    from dotenv import load_dotenv

    load_dotenv()
except ImportError:
    pass

from api.services.supabase_client import init_supabase
from api.services.webhook_events import reprocess_event


async def main(event_id: str) -> None:
    init_supabase()
    await reprocess_event(event_id)
    print(f"Replayed webhook_events row {event_id}")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python -m scripts.replay_webhook_event <webhook_events.id>")
        sys.exit(1)
    asyncio.run(main(sys.argv[1]))
