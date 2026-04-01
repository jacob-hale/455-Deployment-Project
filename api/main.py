from fastapi import FastAPI

from api.routers.customers import router as customers_router

app = FastAPI(title="ShopIQ API", version="0.1.0")

app.include_router(customers_router)


@app.get("/api/health")
async def health_check() -> dict[str, str]:
    return {"status": "ok"}
