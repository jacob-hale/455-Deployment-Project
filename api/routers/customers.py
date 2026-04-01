from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from supabase import Client

from api.dependencies import get_supabase_client

router = APIRouter(prefix="/api/customers", tags=["customers"])


class CustomerProfileResponse(BaseModel):
    customer_id: int
    full_name: str
    email: str
    customer_segment: str
    loyalty_tier: str


@router.get("/{customer_id}", response_model=CustomerProfileResponse)
async def get_customer_profile(
    customer_id: int, supabase: Client = Depends(get_supabase_client)
) -> CustomerProfileResponse:
    query_result = (
        supabase.table("customers")
        .select("customer_id, full_name, email, customer_segment, loyalty_tier")
        .eq("customer_id", customer_id)
        .limit(1)
        .execute()
    )

    customer_rows = query_result.data or []
    if not customer_rows:
        raise HTTPException(status_code=404, detail="Customer not found.")

    return CustomerProfileResponse.model_validate(customer_rows[0])
