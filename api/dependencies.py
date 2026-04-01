import os
from functools import lru_cache

from fastapi import HTTPException
from supabase import Client, create_client


@lru_cache(maxsize=1)
def _create_supabase_client() -> Client:
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY")

    if not supabase_url or not supabase_key:
        raise HTTPException(
            status_code=500,
            detail="Missing SUPABASE_URL or SUPABASE_KEY environment variables.",
        )

    return create_client(supabase_url, supabase_key)


def get_supabase_client() -> Client:
    return _create_supabase_client()
