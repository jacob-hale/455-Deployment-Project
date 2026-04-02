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

  const flaggedCount = queue.filter((q) => q.is_fraud_pred === 1).length;
  const verifiedCount = queue.filter((q) => q.is_fraud_verified !== null).length;

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Admin Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Fraud detection priority queue &mdash; review and verify
            predictions.
          </p>
        </div>
        <button
          onClick={handleRunScoring}
          disabled={scoring}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
        >
          {scoring && (
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          )}
          {scoring ? "Scoring..." : "Run Scoring"}
        </button>
      </div>

      {/* Stats row */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            In Queue
          </p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {queue.length}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Flagged as Fraud
          </p>
          <p className="mt-1 text-2xl font-bold text-rose-600">
            {flaggedCount}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Verified
          </p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">
            {verifiedCount}
            <span className="ml-1 text-sm font-normal text-slate-400">
              / {queue.length}
            </span>
          </p>
        </div>
      </div>

      {scoreResult && (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Scored <strong>{scoreResult.records_scored}</strong> orders &mdash;{" "}
          <strong>{scoreResult.high_risk_detected}</strong> flagged as high risk
          {scoreResult.execution_time_ms != null && (
            <span className="text-emerald-600">
              {" "}
              ({(scoreResult.execution_time_ms / 1000).toFixed(1)}s)
            </span>
          )}
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {lastUpdated && (
        <p className="mt-4 text-xs text-slate-400">
          Last scored:{" "}
          <time className="font-medium text-slate-500">
            {new Date(lastUpdated).toLocaleString()}
          </time>
        </p>
      )}

      <section className="mt-6">
        {loading ? (
          <div className="flex items-center gap-2 py-12 text-sm text-slate-500">
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-indigo-300 border-t-indigo-600" />
            Loading queue...
          </div>
        ) : (
          <PriorityQueue items={queue} onVerify={handleVerify} />
        )}
      </section>
    </main>
  );
}
