import os
from supabase import create_client, Client

_supabase: Client | None = None


def init_supabase() -> None:
    global _supabase
    _supabase = create_client(
        os.environ["SUPABASE_URL"],
        os.environ["SUPABASE_SERVICE_ROLE_KEY"],
    )


def get_supabase() -> Client:
    if _supabase is None:
        raise RuntimeError("Supabase client not initialized. Call init_supabase() first.")
    return _supabase
