"use client";

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

type PriorityQueueProps = {
  items: QueueItem[];
  onVerify: (orderId: number, isFraud: number) => void;
};

function riskBadge(prob: number) {
  if (prob >= 0.7)
    return (
      <span className="inline-flex items-center rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-700 ring-1 ring-rose-200">
        High
      </span>
    );
  if (prob >= 0.3)
    return (
      <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
        Medium
      </span>
    );
  return (
    <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
      Low
    </span>
  );
}

function verifiedBadge(verified: number | null) {
  if (verified === null) return null;
  if (verified === 1)
    return (
      <span className="inline-flex items-center rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-700">
        Confirmed Fraud
      </span>
    );
  return (
    <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
      Confirmed OK
    </span>
  );
}

export default function PriorityQueue({ items, onVerify }: PriorityQueueProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
        <p className="text-sm text-slate-400">
          No predictions yet. Click{" "}
          <strong className="text-slate-600">Run Scoring</strong> to score
          orders.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-slate-100 bg-slate-50/80">
          <tr>
            {[
              "Order",
              "Customer",
              "Date",
              "Total",
              "Payment",
              "Fraud Prob",
              "Risk",
              "Prediction",
              "Status",
              "Verify",
            ].map((h) => (
              <th
                key={h}
                className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {items.map((item) => (
            <tr
              key={item.order_id}
              className="transition-colors hover:bg-slate-50/60"
            >
              <td className="px-4 py-3 font-semibold text-slate-900">
                #{item.order_id}
              </td>
              <td className="px-4 py-3 text-slate-700">{item.customer_name}</td>
              <td className="px-4 py-3 text-slate-500">
                {new Date(item.order_datetime).toLocaleDateString()}
              </td>
              <td className="px-4 py-3 font-medium">
                ${item.order_total.toFixed(2)}
              </td>
              <td className="px-4 py-3 capitalize text-slate-600">
                {item.payment_method}
              </td>
              <td className="px-4 py-3">
                <span className="font-mono text-xs font-semibold">
                  {(item.proba_fraud * 100).toFixed(1)}%
                </span>
              </td>
              <td className="px-4 py-3">{riskBadge(item.proba_fraud)}</td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    item.is_fraud_pred === 1
                      ? "bg-rose-100 text-rose-700"
                      : "bg-emerald-100 text-emerald-700"
                  }`}
                >
                  {item.is_fraud_pred === 1 ? "Fraud" : "OK"}
                </span>
              </td>
              <td className="px-4 py-3">
                {verifiedBadge(item.is_fraud_verified)}
              </td>
              <td className="px-4 py-3">
                {item.is_fraud_verified === null ? (
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => onVerify(item.order_id, 1)}
                      className="rounded-lg bg-rose-600 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-rose-700"
                    >
                      Fraud
                    </button>
                    <button
                      onClick={() => onVerify(item.order_id, 0)}
                      className="rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700"
                    >
                      OK
                    </button>
                  </div>
                ) : (
                  <span className="text-xs text-slate-400">Done</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
