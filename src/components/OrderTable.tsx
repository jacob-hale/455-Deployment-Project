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
      <p className="mt-3 text-sm text-slate-500">No orders found.</p>
    );
  }

  return (
    <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th className="px-4 py-3">Order ID</th>
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3">Total</th>
            <th className="px-4 py-3">Payment</th>
            <th className="px-4 py-3">Items</th>
            {showPredictions && (
              <>
                <th className="px-4 py-3">Fraud Prob</th>
                <th className="px-4 py-3">Prediction</th>
              </>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {orders.map((o) => (
            <tr key={o.order_id} className="hover:bg-slate-50">
              <td className="px-4 py-3 font-medium">{o.order_id}</td>
              <td className="px-4 py-3 text-slate-600">
                {new Date(o.order_datetime).toLocaleDateString()}
              </td>
              <td className="px-4 py-3">${o.order_total.toFixed(2)}</td>
              <td className="px-4 py-3 capitalize">{o.payment_method}</td>
              <td className="px-4 py-3 text-slate-600">
                {o.items.length > 0
                  ? o.items.map((i) => `${i.product_name} x${i.quantity}`).join(", ")
                  : "—"}
              </td>
              {showPredictions && (
                <>
                  <td className="px-4 py-3">
                    {o.proba_fraud != null
                      ? `${(o.proba_fraud * 100).toFixed(1)}%`
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {o.is_fraud_pred != null ? (
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                          o.is_fraud_pred === 1
                            ? "bg-rose-100 text-rose-700"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {o.is_fraud_pred === 1 ? "Fraud" : "OK"}
                      </span>
                    ) : (
                      "—"
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
