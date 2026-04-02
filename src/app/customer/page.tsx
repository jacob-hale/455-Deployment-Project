"use client";

import { useCallback, useEffect, useState } from "react";
import OrderForm from "@/components/OrderForm";
import OrderTable from "@/components/OrderTable";

type Order = {
  order_id: number;
  customer_id: number;
  order_datetime: string;
  order_total: number;
  payment_method: string;
  device_type: string;
  is_fraud: number;
  items: {
    product_name: string;
    quantity: number;
    unit_price: number;
    line_total: number;
  }[];
  proba_fraud: number | null;
  is_fraud_pred: number | null;
  risk_band_1_100: number | null;
  is_fraud_verified: number | null;
};

const QUICK_IDS = [1, 23, 55, 87];

export default function CustomerDashboardPage() {
  const [customerId, setCustomerId] = useState<string>("");
  const [activeCustomerId, setActiveCustomerId] = useState<number | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = useCallback(async (cid: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/orders?customer_id=${cid}`);
      if (!res.ok) throw new Error("Failed to load orders");
      const data: Order[] = await res.json();
      setOrders(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeCustomerId !== null) {
      loadOrders(activeCustomerId);
    }
  }, [activeCustomerId, loadOrders]);

  const handleSelectCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(customerId, 10);
    if (Number.isNaN(parsed)) {
      setError("Please enter a valid customer ID");
      return;
    }
    setActiveCustomerId(parsed);
  };

  const handleOrderPlaced = () => {
    if (activeCustomerId !== null) {
      loadOrders(activeCustomerId);
    }
  };

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Customer Portal
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Place orders and view your order history.
        </p>
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <form onSubmit={handleSelectCustomer} className="flex gap-3">
          <input
            type="text"
            inputMode="numeric"
            placeholder="Customer ID (e.g. 42)"
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            className="w-52 rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
          />
          <button
            type="submit"
            className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
          >
            Load
          </button>
        </form>

        <div className="mt-3 flex flex-wrap gap-2">
          <span className="mr-1 self-center text-xs text-slate-400">
            Try:
          </span>
          {QUICK_IDS.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setCustomerId(String(id));
                setActiveCustomerId(id);
              }}
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
            >
              #{id}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {activeCustomerId !== null && (
        <>
          <section className="mt-8">
            <h2 className="text-lg font-semibold text-slate-900">
              Place New Order
              <span className="ml-2 text-sm font-normal text-slate-400">
                Customer #{activeCustomerId}
              </span>
            </h2>
            <OrderForm
              customerId={activeCustomerId}
              onOrderPlaced={handleOrderPlaced}
            />
          </section>

          <section className="mt-10">
            <h2 className="text-lg font-semibold text-slate-900">
              Order History
            </h2>
            {loading ? (
              <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-indigo-300 border-t-indigo-600" />
                Loading orders...
              </div>
            ) : (
              <OrderTable orders={orders} showPredictions={false} />
            )}
          </section>
        </>
      )}
    </main>
  );
}
