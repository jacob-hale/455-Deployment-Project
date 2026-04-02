from __future__ import annotations

import time
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from supabase import Client

from api.dependencies import get_supabase_client
from api.ml_model.predict import score_unscored_orders

router = APIRouter(prefix="/api/warehouse", tags=["warehouse"])


# ---------------------------------------------------------------------------
# Response schemas
# ---------------------------------------------------------------------------

class QueueItem(BaseModel):
    order_id: int
    customer_name: str
    order_datetime: str
    order_total: float
    payment_method: str
    device_type: str
    proba_fraud: float
    risk_band_1_100: int
    is_fraud_pred: int
    is_fraud_verified: Optional[int] = None
    scored_at_utc: str
    model_version: str


class QueueResponse(BaseModel):
    last_updated: Optional[str] = None
    queue: List[QueueItem]


class ScoreResponse(BaseModel):
    status: str
    records_scored: int
    high_risk_detected: int
    model_version: Optional[str] = None
    execution_time_ms: Optional[int] = None


class VerifyRequest(BaseModel):
    is_fraud_verified: int
    verified_by: str = "admin"


class VerifyResponse(BaseModel):
    status: str
    order_id: int
    is_fraud_verified: int


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("/queue", response_model=QueueResponse)
async def get_fraud_queue(
    limit: int = 50,
    supabase: Client = Depends(get_supabase_client),
) -> QueueResponse:
    """Return orders ranked by fraud probability (highest first)."""
    resp = (
        supabase.table("payment_predictions")
        .select("order_id, proba_fraud, risk_band_1_100, is_fraud_pred, is_fraud_verified, scored_at_utc, model_version")
        .order("proba_fraud", desc=True)
        .limit(limit)
        .execute()
    )
    preds = resp.data or []

    if not preds:
        return QueueResponse(queue=[])

    order_ids = [p["order_id"] for p in preds]

    # Fetch order details
    orders_resp = (
        supabase.table("orders")
        .select("order_id, customer_id, order_datetime, order_total, payment_method, device_type")
        .in_("order_id", order_ids)
        .execute()
    )
    orders_map = {o["order_id"]: o for o in (orders_resp.data or [])}

    # Fetch customer names
    customer_ids = list({o["customer_id"] for o in orders_map.values()})
    cust_resp = (
        supabase.table("customers")
        .select("customer_id, full_name")
        .in_("customer_id", customer_ids)
        .execute()
    )
    cust_map = {c["customer_id"]: c["full_name"] for c in (cust_resp.data or [])}

    last_updated = preds[0]["scored_at_utc"] if preds else None
    items: list[QueueItem] = []
    for p in preds:
        order = orders_map.get(p["order_id"])
        if order is None:
            continue
        items.append(
            QueueItem(
                order_id=p["order_id"],
                customer_name=cust_map.get(order["customer_id"], "Unknown"),
                order_datetime=order["order_datetime"],
                order_total=order["order_total"],
                payment_method=order["payment_method"],
                device_type=order["device_type"],
                proba_fraud=p["proba_fraud"],
                risk_band_1_100=p["risk_band_1_100"],
                is_fraud_pred=p["is_fraud_pred"],
                is_fraud_verified=p.get("is_fraud_verified"),
                scored_at_utc=p["scored_at_utc"],
                model_version=p["model_version"],
            )
        )

    return QueueResponse(last_updated=last_updated, queue=items)


@router.post("/score", response_model=ScoreResponse)
async def trigger_scoring(
    supabase: Client = Depends(get_supabase_client),
) -> ScoreResponse:
    """Run ML inference on all unscored orders."""
    start = time.time()
    result = score_unscored_orders(supabase)
    elapsed_ms = int((time.time() - start) * 1000)

    return ScoreResponse(
        status=result["status"],
        records_scored=result["records_scored"],
        high_risk_detected=result["high_risk_detected"],
        model_version=result.get("model_version"),
        execution_time_ms=elapsed_ms,
    )


@router.patch("/predictions/{order_id}/verify", response_model=VerifyResponse)
async def verify_prediction(
    order_id: int,
    body: VerifyRequest,
    supabase: Client = Depends(get_supabase_client),
) -> VerifyResponse:
    """Admin marks a prediction as correct (1=fraud) or incorrect (0=not fraud)."""
    if body.is_fraud_verified not in (0, 1):
        raise HTTPException(
            status_code=422, detail="is_fraud_verified must be 0 or 1"
        )

    # Find the latest prediction for this order
    pred_resp = (
        supabase.table("payment_predictions")
        .select("prediction_id")
        .eq("order_id", order_id)
        .order("prediction_id", desc=True)
        .limit(1)
        .execute()
    )
    rows = pred_resp.data or []
    if not rows:
        raise HTTPException(status_code=404, detail="No prediction found for this order")

    supabase.table("payment_predictions").update(
        {
            "is_fraud_verified": body.is_fraud_verified,
            "verified_by": body.verified_by,
            "verified_at": datetime.now(timezone.utc).isoformat(),
        }
    ).eq("prediction_id", rows[0]["prediction_id"]).execute()

    return VerifyResponse(
        status="success",
        order_id=order_id,
        is_fraud_verified=body.is_fraud_verified,
    )
