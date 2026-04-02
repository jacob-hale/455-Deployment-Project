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
      <span className="inline-block rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700">
        High
      </span>
    );
  if (prob >= 0.3)
    return (
      <span className="inline-block rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
        Medium
      </span>
    );
  return (
    <span className="inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
      Low
    </span>
  );
}

function verifiedBadge(verified: number | null) {
  if (verified === null) return null;
  if (verified === 1)
    return (
      <span className="inline-block rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-700">
        Confirmed Fraud
      </span>
    );
  return (
    <span className="inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
      Confirmed OK
    </span>
  );
}

export default function PriorityQueue({ items, onVerify }: PriorityQueueProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 text-center text-sm text-slate-500 shadow-sm">
        No predictions yet. Click <strong>Run Scoring</strong> to score
        orders.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th className="px-4 py-3">Order</th>
            <th className="px-4 py-3">Customer</th>
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3">Total</th>
            <th className="px-4 py-3">Payment</th>
            <th className="px-4 py-3">Fraud Prob</th>
            <th className="px-4 py-3">Risk</th>
            <th className="px-4 py-3">Prediction</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Verify</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {items.map((item) => (
            <tr key={item.order_id} className="hover:bg-slate-50">
              <td className="px-4 py-3 font-medium">{item.order_id}</td>
              <td className="px-4 py-3">{item.customer_name}</td>
              <td className="px-4 py-3 text-slate-600">
                {new Date(item.order_datetime).toLocaleDateString()}
              </td>
              <td className="px-4 py-3">${item.order_total.toFixed(2)}</td>
              <td className="px-4 py-3 capitalize">{item.payment_method}</td>
              <td className="px-4 py-3 font-mono">
                {(item.proba_fraud * 100).toFixed(1)}%
              </td>
              <td className="px-4 py-3">{riskBadge(item.proba_fraud)}</td>
              <td className="px-4 py-3">
                <span
                  className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
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
                  <div className="flex gap-1">
                    <button
                      onClick={() => onVerify(item.order_id, 1)}
                      className="rounded bg-rose-600 px-2 py-1 text-xs font-medium text-white hover:bg-rose-700"
                    >
                      Fraud
                    </button>
                    <button
                      onClick={() => onVerify(item.order_id, 0)}
                      className="rounded bg-emerald-600 px-2 py-1 text-xs font-medium text-white hover:bg-emerald-700"
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
