from __future__ import annotations

from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from supabase import Client

from api.dependencies import get_supabase_client

router = APIRouter(prefix="/api/orders", tags=["orders"])


# ---------------------------------------------------------------------------
# Request / Response schemas
# ---------------------------------------------------------------------------

class OrderItemIn(BaseModel):
    product_id: int
    quantity: int
    unit_price: float


class CreateOrderRequest(BaseModel):
    customer_id: int
    payment_method: str
    device_type: str
    ip_country: str = "US"
    billing_zip: Optional[str] = None
    shipping_zip: Optional[str] = None
    shipping_state: Optional[str] = None
    promo_used: int = 0
    promo_code: Optional[str] = None
    shipping_fee: float = 0.0
    tax_amount: float = 0.0
    items: List[OrderItemIn]


class CreateOrderResponse(BaseModel):
    status: str
    order_id: int
    message: str


class OrderItemOut(BaseModel):
    product_name: str
    quantity: int
    unit_price: float
    line_total: float


class OrderOut(BaseModel):
    order_id: int
    customer_id: int
    order_datetime: str
    order_total: float
    payment_method: str
    device_type: str
    is_fraud: int
    items: List[OrderItemOut] = []
    proba_fraud: Optional[float] = None
    is_fraud_pred: Optional[int] = None
    risk_band_1_100: Optional[int] = None
    is_fraud_verified: Optional[int] = None


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("", response_model=CreateOrderResponse)
async def create_order(
    body: CreateOrderRequest,
    supabase: Client = Depends(get_supabase_client),
) -> CreateOrderResponse:
    # Calculate totals
    order_subtotal = sum(i.unit_price * i.quantity for i in body.items)
    order_total = order_subtotal + body.shipping_fee + body.tax_amount

    order_row = {
        "customer_id": body.customer_id,
        "order_datetime": datetime.now(timezone.utc).isoformat(),
        "billing_zip": body.billing_zip,
        "shipping_zip": body.shipping_zip,
        "shipping_state": body.shipping_state,
        "payment_method": body.payment_method,
        "device_type": body.device_type,
        "ip_country": body.ip_country,
        "promo_used": body.promo_used,
        "promo_code": body.promo_code,
        "order_subtotal": round(order_subtotal, 2),
        "shipping_fee": round(body.shipping_fee, 2),
        "tax_amount": round(body.tax_amount, 2),
        "order_total": round(order_total, 2),
        "risk_score": 0.0,
        "is_fraud": 0,
    }

    resp = supabase.table("orders").insert(order_row).execute()
    if not resp.data:
        raise HTTPException(status_code=500, detail="Failed to insert order")
    new_order = resp.data[0]
    order_id = new_order["order_id"]

    # Insert order items
    item_rows = [
        {
            "order_id": order_id,
            "product_id": item.product_id,
            "quantity": item.quantity,
            "unit_price": item.unit_price,
            "line_total": round(item.unit_price * item.quantity, 2),
        }
        for item in body.items
    ]
    if item_rows:
        supabase.table("order_items").insert(item_rows).execute()

    return CreateOrderResponse(
        status="success",
        order_id=order_id,
        message="Order placed successfully.",
    )


@router.get("", response_model=List[OrderOut])
async def list_orders(
    customer_id: Optional[int] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    supabase: Client = Depends(get_supabase_client),
) -> List[OrderOut]:
    q = supabase.table("orders").select("*").order("order_id", desc=True).limit(limit)
    if customer_id is not None:
        q = q.eq("customer_id", customer_id)
    orders_resp = q.execute()
    orders = orders_resp.data or []

    if not orders:
        return []

    order_ids = [o["order_id"] for o in orders]

    # Fetch order items with product names
    items_resp = (
        supabase.table("order_items")
        .select("order_id, quantity, unit_price, line_total, product_id")
        .in_("order_id", order_ids)
        .execute()
    )
    items_data = items_resp.data or []

    # Fetch product names
    product_ids = list({i["product_id"] for i in items_data})
    products_map: dict[int, str] = {}
    if product_ids:
        prod_resp = (
            supabase.table("products")
            .select("product_id, product_name")
            .in_("product_id", product_ids)
            .execute()
        )
        products_map = {p["product_id"]: p["product_name"] for p in (prod_resp.data or [])}

    # Group items by order
    items_by_order: dict[int, list[OrderItemOut]] = {}
    for it in items_data:
        oid = it["order_id"]
        items_by_order.setdefault(oid, []).append(
            OrderItemOut(
                product_name=products_map.get(it["product_id"], "Unknown"),
                quantity=it["quantity"],
                unit_price=it["unit_price"],
                line_total=it["line_total"],
            )
        )

    # Fetch predictions (table may not exist yet if schema migration is incomplete)
    preds_map: dict[int, dict] = {}
    try:
        preds_resp = (
            supabase.table("payment_predictions")
            .select("order_id, proba_fraud, is_fraud_pred, risk_band_1_100, is_fraud_verified")
            .in_("order_id", order_ids)
            .order("prediction_id", desc=True)
            .execute()
        )
        for p in (preds_resp.data or []):
            if p["order_id"] not in preds_map:
                preds_map[p["order_id"]] = p
    except Exception:
        pass

    result: list[OrderOut] = []
    for o in orders:
        pred = preds_map.get(o["order_id"], {})
        result.append(
            OrderOut(
                order_id=o["order_id"],
                customer_id=o["customer_id"],
                order_datetime=o["order_datetime"],
                order_total=o["order_total"],
                payment_method=o["payment_method"],
                device_type=o["device_type"],
                is_fraud=o["is_fraud"],
                items=items_by_order.get(o["order_id"], []),
                proba_fraud=pred.get("proba_fraud"),
                is_fraud_pred=pred.get("is_fraud_pred"),
                risk_band_1_100=pred.get("risk_band_1_100"),
                is_fraud_verified=pred.get("is_fraud_verified"),
            )
        )
    return result
