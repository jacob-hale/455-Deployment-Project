import os
from functools import lru_cache

from fastapi import HTTPException
from supabase import Client, create_client


def _env_first(*names: str) -> str | None:
    for name in names:
        value = os.getenv(name)
        if value and value.strip():
            return value.strip()
    return None


@lru_cache(maxsize=1)
def _create_supabase_client() -> Client:
    # Vercel + Supabase integration usually sets NEXT_PUBLIC_* and SERVICE_ROLE / ANON.
    # Legacy / manual: SUPABASE_URL + SUPABASE_KEY.
    supabase_url = _env_first(
        "SUPABASE_URL",
        "NEXT_PUBLIC_SUPABASE_URL",
    )
    supabase_key = _env_first(
        "SUPABASE_KEY",
        "SUPABASE_SERVICE_ROLE_KEY",
        "SUPABASE_ANON_KEY",
        "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    )

    if not supabase_url or not supabase_key:
        raise HTTPException(
            status_code=500,
            detail=(
                "Missing Supabase credentials. In Vercel, set at least "
                "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (server) or "
                "NEXT_PUBLIC_SUPABASE_ANON_KEY (if RLS allows SELECT on customers)."
            ),
        )

    return create_client(supabase_url, supabase_key)


def get_supabase_client() -> Client:
    return _create_supabase_client()
