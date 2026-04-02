import os

from fastapi import FastAPI, HTTPException, Request

from api.ml_model.train import retrain_model
from api.dependencies import get_supabase_client
from api.routers.customers import router as customers_router
from api.routers.orders import router as orders_router
from api.routers.warehouse import router as warehouse_router

app = FastAPI(title="ShopIQ API", version="0.2.0")

app.include_router(customers_router)
app.include_router(orders_router)
app.include_router(warehouse_router)


@app.get("/api/health")
async def health_check() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/ml/retrain")
async def ml_retrain(request: Request) -> dict:
    """Nightly CRON endpoint — retrains the fraud-detection model.

    Protected by CRON_SECRET so only Vercel CRON (or an admin with the
    secret) can trigger it.
    """
    cron_secret = os.getenv("CRON_SECRET")
    if cron_secret:
        auth = request.headers.get("authorization", "")
        if auth != f"Bearer {cron_secret}":
            raise HTTPException(status_code=401, detail="Unauthorized")

    client = get_supabase_client()
    return retrain_model(client)
