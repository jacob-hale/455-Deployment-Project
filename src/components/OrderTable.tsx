"use client";

type OrderItem = {
  product_name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
};

type Order = {
  order_id: number;
  customer_id: number;
  order_datetime: string;
  order_total: number;
  payment_method: string;
  device_type: string;
  is_fraud: number;
  items: OrderItem[];
  proba_fraud: number | null;
  is_fraud_pred: number | null;
  risk_band_1_100: number | null;
  is_fraud_verified: number | null;
};

type OrderTableProps = {
  orders: Order[];
  showPredictions?: boolean;
};

export default function OrderTable({
  orders,
  showPredictions = false,
}: OrderTableProps) {
  if (orders.length === 0) {
    return (
      <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-400">
        No orders found for this customer.
      </div>
    );
  }

  return (
    <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-slate-100 bg-slate-50/80">
          <tr>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Order
            </th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Date
            </th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Total
            </th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Payment
            </th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Items
            </th>
            {showPredictions && (
              <>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Fraud Prob
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Prediction
                </th>
              </>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {orders.map((o) => (
            <tr
              key={o.order_id}
              className="transition-colors hover:bg-slate-50/60"
            >
              <td className="px-4 py-3 font-semibold text-slate-900">
                #{o.order_id}
              </td>
              <td className="px-4 py-3 text-slate-500">
                {new Date(o.order_datetime).toLocaleDateString()}
              </td>
              <td className="px-4 py-3 font-medium">
                ${o.order_total.toFixed(2)}
              </td>
              <td className="px-4 py-3 capitalize text-slate-600">
                {o.payment_method}
              </td>
              <td className="max-w-xs truncate px-4 py-3 text-slate-500">
                {o.items.length > 0
                  ? o.items
                      .map((i) => `${i.product_name} x${i.quantity}`)
                      .join(", ")
                  : "\u2014"}
              </td>
              {showPredictions && (
                <>
                  <td className="px-4 py-3 font-mono text-xs">
                    {o.proba_fraud != null
                      ? `${(o.proba_fraud * 100).toFixed(1)}%`
                      : "\u2014"}
                  </td>
                  <td className="px-4 py-3">
                    {o.is_fraud_pred != null ? (
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          o.is_fraud_pred === 1
                            ? "bg-rose-100 text-rose-700"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {o.is_fraud_pred === 1 ? "Fraud" : "OK"}
                      </span>
                    ) : (
                      "\u2014"
                    )}
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
