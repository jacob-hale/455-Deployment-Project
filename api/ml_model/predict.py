"""Scoring / inference logic for the fraud-detection pipeline.

Loads the latest model from the Supabase ``ml_models`` table, scores
unscored orders, and writes results back to ``payment_predictions``.
"""

from __future__ import annotations

import base64
import io
import json
import logging
from datetime import datetime, timezone
from typing import Any, Dict

import joblib
import numpy as np
import pandas as pd
from supabase import Client

from api.ml_model.pipeline import (
    TARGET_COL,
    build_modeling_dataset,
    enforce_no_leakage,
    fetch_tables_from_supabase,
)

logger = logging.getLogger("fraud_pipeline.predict")

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def risk_band_1_100(proba: np.ndarray) -> np.ndarray:
    band = np.ceil(100.0 * proba).astype(int)
    return np.clip(band, 1, 100)


# ---------------------------------------------------------------------------
# Model loading
# ---------------------------------------------------------------------------

def load_model_from_supabase(client: Client) -> tuple[Any, Dict[str, Any]]:
    """Fetch the most-recent model blob from ``ml_models`` and deserialise.

    Returns ``(sklearn_pipeline, metadata_dict)``.
    """
    resp = (
        client.table("ml_models")
        .select("model_blob, metadata_json, model_version")
        .order("id", desc=True)
        .limit(1)
        .execute()
    )
    rows = resp.data or []
    if not rows:
        raise RuntimeError("No model found in ml_models table. Run bootstrap first.")

    row = rows[0]
    blob_bytes = base64.b64decode(row["model_blob"])
    pipeline = joblib.load(io.BytesIO(blob_bytes))

    metadata: Dict[str, Any] = {}
    if row.get("metadata_json"):
        metadata = json.loads(row["metadata_json"])
    metadata.setdefault("model_version", row["model_version"])

    return pipeline, metadata


# ---------------------------------------------------------------------------
# Scoring
# ---------------------------------------------------------------------------

def score_unscored_orders(client: Client) -> Dict[str, Any]:
    """Score orders that don't have a prediction yet.

    Returns a summary dict suitable for the API response.
    """
    pipeline, metadata = load_model_from_supabase(client)
    model_version = metadata.get("model_version", "v1")
    threshold = float(
        metadata.get("threshold", {}).get("threshold", 0.5)
        if isinstance(metadata.get("threshold"), dict)
        else metadata.get("threshold", 0.5)
    )

    raw = fetch_tables_from_supabase(client)
    if raw["orders"].empty:
        return {"status": "success", "records_scored": 0, "high_risk_detected": 0}

    # Determine which orders already have predictions for this model version
    existing_resp = (
        client.table("payment_predictions")
        .select("order_id")
        .eq("model_version", model_version)
        .execute()
    )
    scored_ids = {r["order_id"] for r in (existing_resp.data or [])}

    unscored_mask = ~raw["orders"]["order_id"].isin(scored_ids)
    if not unscored_mask.any():
        return {"status": "success", "records_scored": 0, "high_risk_detected": 0}

    # Build feature dataset for ALL orders (needed for customer-history features)
    model_df = build_modeling_dataset(**raw, include_customer_history=True)
    leakage = enforce_no_leakage(model_df, target_col=TARGET_COL, raw_tables=raw)
    feature_cols = leakage["feature_cols"]

    # Keep only unscored rows for prediction output
    unscored_order_ids = set(raw["orders"].loc[unscored_mask, "order_id"])
    mask = model_df["order_id"].isin(unscored_order_ids)
    X_score = model_df.loc[mask, feature_cols].copy()
    order_ids = model_df.loc[mask, "order_id"].astype(int).values

    # Ensure numpy-backed dtypes so sklearn never sees pd.NA
    for col in X_score.columns:
        if pd.api.types.is_extension_array_dtype(X_score[col].dtype):
            if pd.api.types.is_numeric_dtype(X_score[col]):
                X_score[col] = X_score[col].astype(float)
            else:
                X_score[col] = X_score[col].astype(object)

    proba = pipeline.predict_proba(X_score)[:, 1]
    preds = (proba >= threshold).astype(int)
    bands = risk_band_1_100(proba)

    scored_at = _utc_now_iso()
    rows_to_insert = [
        {
            "order_id": int(oid),
            "model_version": model_version,
            "scored_at_utc": scored_at,
            "proba_fraud": round(float(p), 6),
            "risk_band_1_100": int(b),
            "threshold": threshold,
            "is_fraud_pred": int(pred),
            "metadata_json": json.dumps({"model": model_version}),
        }
        for oid, p, b, pred in zip(order_ids, proba, bands, preds)
    ]

    # Batch upsert (Supabase supports upsert on unique constraint)
    batch_size = 500
    for i in range(0, len(rows_to_insert), batch_size):
        batch = rows_to_insert[i : i + batch_size]
        client.table("payment_predictions").upsert(
            batch, on_conflict="order_id,model_version"
        ).execute()

    high_risk = int(np.sum(preds))
    logger.info(
        "Scored %d orders (%d high-risk) with model %s",
        len(rows_to_insert),
        high_risk,
        model_version,
    )

    return {
        "status": "success",
        "records_scored": len(rows_to_insert),
        "high_risk_detected": high_risk,
        "model_version": model_version,
    }
