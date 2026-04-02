"""Feature engineering pipeline ported from Fraud_Detection_Pipeline.ipynb.

Replaces SQLite reads with Supabase client queries.  Every helper is a pure
function that returns a *new* DataFrame (no mutation of inputs).
"""

from __future__ import annotations

from typing import Any, Dict, Iterable, List, Optional

import numpy as np
import pandas as pd
from supabase import Client

# ---------------------------------------------------------------------------
# Constants (mirrored from the notebook)
# ---------------------------------------------------------------------------
TARGET_COL = "is_fraud"
RANDOM_STATE = 27

BANNED_NAME_PATTERNS = [
    "is_fraud",
    "fraud",
    "risk_score",
    "risk",
    "label",
    "target",
    "outcome",
    "review",
    "chargeback",
    "refund",
    "dispute",
]

BANNED_TABLES = {"shipments", "product_reviews"}

# ---------------------------------------------------------------------------
# Supabase data extraction
# ---------------------------------------------------------------------------

def _supabase_select_all(client: Client, table: str) -> pd.DataFrame:
    """Fetch every row from *table* via the Supabase REST API."""
    page_size = 1000
    rows: list[dict] = []
    offset = 0
    while True:
        resp = (
            client.table(table)
            .select("*")
            .range(offset, offset + page_size - 1)
            .execute()
        )
        batch = resp.data or []
        rows.extend(batch)
        if len(batch) < page_size:
            break
        offset += page_size
    df = pd.DataFrame(rows)
    _coerce_numpy_dtypes(df)
    return df


def _coerce_numpy_dtypes(df: pd.DataFrame) -> None:
    """Convert nullable extension types to numpy-backed types in-place.

    Pandas 2.x may infer ``Int64``, ``Float64``, ``boolean``, or
    ``StringDtype`` when rows contain ``None``.  Sklearn expects
    numpy-backed ``float64`` / ``object`` and chokes on ``pd.NA``.
    """
    for col in df.columns:
        if pd.api.types.is_extension_array_dtype(df[col].dtype):
            if pd.api.types.is_numeric_dtype(df[col]):
                df[col] = df[col].astype(float)
            else:
                df[col] = df[col].astype(object)


def fetch_tables_from_supabase(
    client: Client,
) -> Dict[str, pd.DataFrame]:
    """Fetch the four tables needed for leakage-safe modelling."""
    return {
        "orders": _supabase_select_all(client, "orders"),
        "customers": _supabase_select_all(client, "customers"),
        "order_items": _supabase_select_all(client, "order_items"),
        "products": _supabase_select_all(client, "products"),
    }


# ---------------------------------------------------------------------------
# Feature helpers (exact ports from the notebook)
# ---------------------------------------------------------------------------

def _safe_copy(df: pd.DataFrame) -> pd.DataFrame:
    return df.copy(deep=True)


def split_order_datetime(orders: pd.DataFrame) -> pd.DataFrame:
    df = _safe_copy(orders)
    dt = pd.to_datetime(df["order_datetime"], errors="coerce", utc=True)
    df["order_date"] = dt.dt.strftime("%Y-%m-%d")
    df["order_time"] = dt.dt.strftime("%H:%M:%S")
    return df


def build_order_item_aggregates(order_items: pd.DataFrame) -> pd.DataFrame:
    oi = _safe_copy(order_items)
    agg = (
        oi.groupby("order_id", as_index=False)
        .agg(
            n_lines=("order_item_id", "count"),
            sum_quantity=("quantity", "sum"),
            avg_unit_price=("unit_price", "mean"),
            min_unit_price=("unit_price", "min"),
            max_unit_price=("unit_price", "max"),
            items_total=("line_total", "sum"),
        )
        .reset_index(drop=True)
    )
    agg["n_items"] = agg["sum_quantity"]
    return agg


def build_product_mix_aggregates(
    order_items: pd.DataFrame, products: pd.DataFrame
) -> pd.DataFrame:
    oi = _safe_copy(order_items)
    pr = _safe_copy(products)

    merged = oi.merge(
        pr[["product_id", "category", "price", "cost"]],
        on="product_id",
        how="left",
    )
    merged["unit_margin"] = merged["price"] - merged["cost"]

    def _mode(series: pd.Series) -> str | None:
        s = series.dropna()
        if s.empty:
            return None
        return s.value_counts().index[0]

    agg = (
        merged.groupby("order_id", as_index=False)
        .agg(
            n_unique_products=("product_id", pd.Series.nunique),
            n_unique_categories=("category", pd.Series.nunique),
            top_category=("category", _mode),
            avg_product_cost=("cost", "mean"),
            avg_unit_margin=("unit_margin", "mean"),
        )
        .reset_index(drop=True)
    )
    return agg


def build_modeling_dataset(
    orders: pd.DataFrame,
    customers: pd.DataFrame,
    order_items: pd.DataFrame,
    products: pd.DataFrame,
    include_customer_history: bool = True,
) -> pd.DataFrame:
    """Build denormalized dataset with one row per order."""
    ord_df = split_order_datetime(orders)
    cust_df = _safe_copy(customers)

    oi_agg = build_order_item_aggregates(order_items)
    mix_agg = build_product_mix_aggregates(order_items, products)

    out = ord_df.merge(cust_df, on="customer_id", how="left", suffixes=("", "_customer"))
    out = out.merge(oi_agg, on="order_id", how="left")
    out = out.merge(mix_agg, on="order_id", how="left")

    out["discount_proxy"] = out["order_subtotal"] - out["items_total"]

    if include_customer_history:
        hist = out[["order_id", "customer_id", "order_datetime", "order_total"]].copy()
        hist["order_datetime_parsed"] = pd.to_datetime(
            hist["order_datetime"], errors="coerce", utc=False
        )
        hist = hist.sort_values(
            ["customer_id", "order_datetime_parsed", "order_id"], kind="mergesort"
        )

        hist["customer_prior_orders"] = hist.groupby("customer_id").cumcount()
        hist["customer_prior_total_spend"] = (
            hist.groupby("customer_id")["order_total"]
            .cumsum()
            .shift(1)
            .fillna(0.0)
        )

        prev_dt = hist.groupby("customer_id")["order_datetime_parsed"].shift(1)
        hist["customer_days_since_prev_order"] = (
            (hist["order_datetime_parsed"] - prev_dt).dt.total_seconds() / 86400.0
        )

        out = out.merge(
            hist[
                [
                    "order_id",
                    "customer_prior_orders",
                    "customer_prior_total_spend",
                    "customer_days_since_prev_order",
                ]
            ],
            on="order_id",
            how="left",
        )

    if out["order_id"].duplicated().any():
        raise ValueError("Denormalization failed: duplicated order_id rows")

    return out


# ---------------------------------------------------------------------------
# Leakage audit (exact port)
# ---------------------------------------------------------------------------

def leakage_audit_columns(
    columns: Iterable[str],
    banned_name_patterns: Iterable[str] = BANNED_NAME_PATTERNS,
) -> List[str]:
    pats = [p.lower() for p in banned_name_patterns]
    banned: list[str] = []
    for c in columns:
        cl = c.lower()
        if any(p in cl for p in pats):
            banned.append(c)
    return sorted(set(banned))


def leakage_audit_sources(feature_sources: Dict[str, str]) -> List[str]:
    return sorted(
        {f for f, src in feature_sources.items() if src in BANNED_TABLES}
    )


def enforce_no_leakage(
    df: pd.DataFrame,
    target_col: str = TARGET_COL,
    raw_tables: Optional[Dict[str, pd.DataFrame]] = None,
) -> Dict[str, Any]:
    """Return a leakage report with the final feature column list."""
    if target_col not in df.columns:
        raise KeyError(f"Target column '{target_col}' not found")

    banned_by_name = leakage_audit_columns(df.columns)

    feature_sources: Dict[str, str] = {}
    if raw_tables is not None:
        for c in df.columns:
            if c in raw_tables.get("orders", pd.DataFrame()).columns:
                feature_sources[c] = "orders"
            elif c in raw_tables.get("customers", pd.DataFrame()).columns:
                feature_sources[c] = "customers"
            elif c in {
                "n_lines", "sum_quantity", "avg_unit_price",
                "min_unit_price", "max_unit_price", "items_total", "n_items",
            }:
                feature_sources[c] = "order_items"
            elif c in {
                "n_unique_products", "n_unique_categories",
                "top_category", "avg_product_cost", "avg_unit_margin",
            }:
                feature_sources[c] = "products"
            else:
                feature_sources[c] = "engineered"

    banned_by_source = leakage_audit_sources(feature_sources) if feature_sources else []

    hard_ban = {target_col}
    if "risk_score" in df.columns:
        hard_ban.add("risk_score")

    banned_all = sorted(set(banned_by_name) | set(banned_by_source) | hard_ban)
    non_feature_cols = {target_col, "order_id"}
    feature_cols = [
        c for c in df.columns if c not in set(banned_all) | non_feature_cols
    ]

    return {
        "target_col": target_col,
        "banned_all": banned_all,
        "n_features_after_ban": len(feature_cols),
        "feature_cols": feature_cols,
    }
