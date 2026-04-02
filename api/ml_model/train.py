"""Retraining pipeline called by the Vercel nightly CRON job.

Fetches all data from Supabase, incorporates admin-verified labels,
trains a single GradientBoosting model (no grid search to stay within
Vercel serverless timeout), selects a threshold, and uploads the
serialised model back to the ``ml_models`` table.
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
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.impute import SimpleImputer
from sklearn.metrics import average_precision_score, precision_recall_curve
from sklearn.model_selection import StratifiedShuffleSplit
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from supabase import Client

from api.ml_model.pipeline import (
    RANDOM_STATE,
    TARGET_COL,
    build_modeling_dataset,
    enforce_no_leakage,
    fetch_tables_from_supabase,
)

logger = logging.getLogger("fraud_pipeline.train")

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _build_preprocessor(
    X: pd.DataFrame,
) -> tuple[ColumnTransformer, list[str], list[str]]:
    """Exact port of the notebook's build_preprocessor."""
    numeric_cols = X.select_dtypes(include=["number", "bool"]).columns.tolist()
    categorical_cols = [c for c in X.columns if c not in numeric_cols]

    numeric_pipe = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler()),
        ]
    )
    categorical_pipe = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="most_frequent")),
            ("onehot", OneHotEncoder(handle_unknown="ignore")),
        ]
    )

    pre = ColumnTransformer(
        transformers=[
            ("num", numeric_pipe, numeric_cols),
            ("cat", categorical_pipe, categorical_cols),
        ],
        remainder="drop",
    )
    return pre, numeric_cols, categorical_cols


def _select_threshold_by_recall(
    y_true: pd.Series,
    proba: np.ndarray,
    recall_min: float = 0.80,
) -> Dict[str, Any]:
    """Exact port of the notebook's select_threshold_by_recall."""
    precision, recall, thresholds = precision_recall_curve(y_true, proba)

    precision_t = precision[1:]
    recall_t = recall[1:]

    ok = recall_t >= recall_min
    if not np.any(ok):
        f1 = 2 * (precision_t * recall_t) / np.clip(
            precision_t + recall_t, 1e-12, None
        )
        j = int(np.argmax(f1))
        return {
            "policy": "max_f1_fallback",
            "threshold": float(thresholds[j]),
            "precision": float(precision_t[j]),
            "recall": float(recall_t[j]),
            "recall_min": recall_min,
        }

    idx = np.where(ok)[0]
    best = idx[np.argmax(precision_t[idx])]

    return {
        "policy": "max_precision_given_recall_min",
        "threshold": float(thresholds[best]),
        "precision": float(precision_t[best]),
        "recall": float(recall_t[best]),
        "recall_min": recall_min,
    }


# ---------------------------------------------------------------------------
# Apply admin-verified labels
# ---------------------------------------------------------------------------

def _apply_verified_labels(client: Client) -> int:
    """Copy ``is_fraud_verified`` back into ``orders.is_fraud`` for verified rows.

    Returns the count of orders whose label was updated.
    """
    resp = (
        client.table("payment_predictions")
        .select("order_id, is_fraud_verified")
        .not_.is_("is_fraud_verified", "null")
        .execute()
    )
    verified = resp.data or []
    updated = 0
    for row in verified:
        client.table("orders").update(
            {"is_fraud": row["is_fraud_verified"]}
        ).eq("order_id", row["order_id"]).execute()
        updated += 1
    return updated


# ---------------------------------------------------------------------------
# Main retraining entry-point
# ---------------------------------------------------------------------------

def retrain_model(client: Client) -> Dict[str, Any]:
    """Full retrain: fetch data, train GradientBoosting, upload model."""
    # 1. Push verified labels into orders table
    n_label_updates = _apply_verified_labels(client)
    logger.info("Applied %d verified label updates", n_label_updates)

    # 2. Fetch fresh data
    raw = fetch_tables_from_supabase(client)
    if raw["orders"].empty or len(raw["orders"]) < 50:
        return {"status": "skipped", "reason": "Not enough orders to retrain"}

    # 3. Build feature matrix
    model_df = build_modeling_dataset(**raw, include_customer_history=True)
    leakage = enforce_no_leakage(model_df, target_col=TARGET_COL, raw_tables=raw)
    feature_cols = leakage["feature_cols"]

    X = model_df[feature_cols]
    y = model_df[TARGET_COL].astype(int)

    # 4. 80/20 stratified split (for threshold selection)
    splitter = StratifiedShuffleSplit(
        n_splits=1, test_size=0.2, random_state=RANDOM_STATE
    )
    train_idx, test_idx = next(splitter.split(X, y))
    X_train, y_train = X.iloc[train_idx], y.iloc[train_idx]
    X_test, y_test = X.iloc[test_idx], y.iloc[test_idx]

    # 5. Build preprocessor + model pipeline
    preprocessor, _, _ = _build_preprocessor(X_train)

    gb = GradientBoostingClassifier(
        n_estimators=200,
        learning_rate=0.1,
        max_depth=3,
        subsample=0.8,
        random_state=RANDOM_STATE,
    )
    pipe = Pipeline(steps=[("preprocess", preprocessor), ("model", gb)])

    # 6. Fit
    pipe.fit(X_train, y_train)

    # 7. Threshold selection on train set
    train_proba = pipe.predict_proba(X_train)[:, 1]
    threshold_info = _select_threshold_by_recall(y_train, train_proba, recall_min=0.80)

    # 8. Quick test evaluation
    test_proba = pipe.predict_proba(X_test)[:, 1]
    test_ap = float(average_precision_score(y_test, test_proba))

    # 9. Serialise model to base64
    buf = io.BytesIO()
    joblib.dump(pipe, buf)
    buf.seek(0)
    model_b64 = base64.b64encode(buf.read()).decode("ascii")

    # 10. Build metadata
    version = f"v{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}"
    metadata = {
        "model_version": version,
        "trained_at_utc": _utc_now_iso(),
        "random_state": RANDOM_STATE,
        "target_col": TARGET_COL,
        "feature_cols": feature_cols,
        "threshold": threshold_info,
        "test_average_precision": test_ap,
        "n_train": len(X_train),
        "n_test": len(X_test),
        "n_label_updates_applied": n_label_updates,
    }

    # 11. Upsert into ml_models (keep latest; insert new row)
    client.table("ml_models").insert(
        {
            "model_version": version,
            "created_at": _utc_now_iso(),
            "model_blob": model_b64,
            "metadata_json": json.dumps(metadata),
        }
    ).execute()

    logger.info(
        "Retrained model %s  (test AP=%.4f, threshold=%.4f)",
        version,
        test_ap,
        threshold_info["threshold"],
    )

    return {
        "status": "success",
        "model_version": version,
        "test_average_precision": round(test_ap, 4),
        "threshold": round(threshold_info["threshold"], 4),
        "n_train": len(X_train),
        "n_test": len(X_test),
        "n_label_updates_applied": n_label_updates,
    }
