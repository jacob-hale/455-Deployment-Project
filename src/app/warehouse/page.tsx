"use client";

import { useCallback, useEffect, useState } from "react";
import PriorityQueue from "@/components/PriorityQueue";

type QueueItem = {
  order_id: number;
  customer_name: string;
  order_datetime: string;
  order_total: number;
  payment_method: string;
  device_type: string;
  proba_fraud: number;
  risk_band_1_100: number;
  is_fraud_pred: number;
  is_fraud_verified: number | null;
  scored_at_utc: string;
  model_version: string;
};

type ScoreResult = {
  status: string;
  records_scored: number;
  high_risk_detected: number;
  model_version?: string;
  execution_time_ms?: number;
};

export default function WarehouseDashboardPage() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [scoring, setScoring] = useState(false);
  const [scoreResult, setScoreResult] = useState<ScoreResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadQueue = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/warehouse/queue");
      if (!res.ok) throw new Error("Failed to load queue");
      const data = await res.json();
      setQueue(data.queue || []);
      setLastUpdated(data.last_updated || null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  const handleRunScoring = async () => {
    setScoring(true);
    setScoreResult(null);
    setError(null);
    try {
      const res = await fetch("/api/warehouse/score", { method: "POST" });
      if (!res.ok) throw new Error("Scoring failed");
      const data: ScoreResult = await res.json();
      setScoreResult(data);
      await loadQueue();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Scoring error");
    } finally {
      setScoring(false);
    }
  };

  const handleVerify = async (orderId: number, isFraud: number) => {
    try {
      const res = await fetch(`/api/warehouse/predictions/${orderId}/verify`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          is_fraud_verified: isFraud,
          verified_by: "admin",
        }),
      });
      if (!res.ok) throw new Error("Verification failed");
      setQueue((prev) =>
        prev.map((item) =>
          item.order_id === orderId
            ? { ...item, is_fraud_verified: isFraud }
            : item
        )
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Verification error");
    }
  };

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Admin Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Fraud detection priority queue &mdash; review and verify predictions.
          </p>
        </div>
        <button
          onClick={handleRunScoring}
          disabled={scoring}
          className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
        >
          {scoring ? "Scoring..." : "Run Scoring"}
        </button>
      </div>

      {scoreResult && (
        <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Scored <strong>{scoreResult.records_scored}</strong> orders &mdash;{" "}
          <strong>{scoreResult.high_risk_detected}</strong> flagged as high risk
          {scoreResult.execution_time_ms != null && (
            <> ({scoreResult.execution_time_ms}ms)</>
          )}
        </div>
      )}

      {error && (
        <p className="mt-4 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      )}

      {lastUpdated && (
        <p className="mt-4 text-xs text-slate-500">
          Last scored: {new Date(lastUpdated).toLocaleString()}
        </p>
      )}

      <section className="mt-6">
        {loading ? (
          <p className="text-sm text-slate-500">Loading queue...</p>
        ) : (
          <PriorityQueue items={queue} onVerify={handleVerify} />
        )}
      </section>
    </main>
  );
}
