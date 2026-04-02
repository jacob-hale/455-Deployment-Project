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
  items: { product_name: string; quantity: number; unit_price: number; line_total: number }[];
  proba_fraud: number | null;
  is_fraud_pred: number | null;
  risk_band_1_100: number | null;
  is_fraud_verified: number | null;
};

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
    <main className="mx-auto max-w-5xl px-6 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">Customer Portal</h1>
      <p className="mt-1 text-sm text-slate-600">
        Enter a customer ID to place orders and view history.
      </p>

      <form onSubmit={handleSelectCustomer} className="mt-6 flex gap-3">
        <input
          type="text"
          inputMode="numeric"
          placeholder="Customer ID (e.g. 1042)"
          value={customerId}
          onChange={(e) => setCustomerId(e.target.value)}
          className="w-48 rounded-lg border border-slate-300 px-4 py-2 text-sm outline-none ring-indigo-500 focus:ring-2"
        />
        <button
          type="submit"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Load
        </button>
      </form>

      {error && (
        <p className="mt-4 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      )}

      {activeCustomerId !== null && (
        <>
          <section className="mt-8">
            <h2 className="text-lg font-semibold">Place New Order</h2>
            <OrderForm
              customerId={activeCustomerId}
              onOrderPlaced={handleOrderPlaced}
            />
          </section>

          <section className="mt-10">
            <h2 className="text-lg font-semibold">Order History</h2>
            {loading ? (
              <p className="mt-3 text-sm text-slate-500">Loading orders...</p>
            ) : (
              <OrderTable orders={orders} showPredictions={false} />
            )}
          </section>
        </>
      )}
    </main>
  );
}
