"use client";

import { useState } from "react";

type OrderFormProps = {
  customerId: number;
  onOrderPlaced: () => void;
};

type ItemRow = {
  product_id: string;
  quantity: string;
  unit_price: string;
};

const PAYMENT_METHODS = ["card", "paypal", "crypto", "bank_transfer"];
const DEVICE_TYPES = ["desktop", "mobile", "tablet"];

export default function OrderForm({ customerId, onOrderPlaced }: OrderFormProps) {
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [deviceType, setDeviceType] = useState("desktop");
  const [shippingFee, setShippingFee] = useState("5.99");
  const [items, setItems] = useState<ItemRow[]>([
    { product_id: "", quantity: "1", unit_price: "" },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const addItem = () =>
    setItems((prev) => [...prev, { product_id: "", quantity: "1", unit_price: "" }]);

  const removeItem = (idx: number) =>
    setItems((prev) => prev.filter((_, i) => i !== idx));

  const updateItem = (idx: number, field: keyof ItemRow, value: string) =>
    setItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item))
    );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    const parsedItems = items
      .filter((i) => i.product_id && i.unit_price)
      .map((i) => ({
        product_id: parseInt(i.product_id, 10),
        quantity: parseInt(i.quantity, 10) || 1,
        unit_price: parseFloat(i.unit_price) || 0,
      }));

    if (parsedItems.length === 0) {
      setError("Add at least one item with a product ID and price.");
      setSubmitting(false);
      return;
    }

    const subtotal = parsedItems.reduce(
      (sum, i) => sum + i.unit_price * i.quantity,
      0
    );
    const tax = +(subtotal * 0.08).toFixed(2);
    const fee = parseFloat(shippingFee) || 0;

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: customerId,
          payment_method: paymentMethod,
          device_type: deviceType,
          ip_country: "US",
          shipping_fee: fee,
          tax_amount: tax,
          items: parsedItems,
        }),
      });
      if (!res.ok) throw new Error("Failed to place order");
      const data = await res.json();
      setSuccess(`Order #${data.order_id} placed successfully!`);
      setItems([{ product_id: "", quantity: "1", unit_price: "" }]);
      onOrderPlaced();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-4 space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Payment
          </span>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="mt-1.5 block w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
          >
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>
                {m.replace("_", " ")}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Device
          </span>
          <select
            value={deviceType}
            onChange={(e) => setDeviceType(e.target.value)}
            className="mt-1.5 block w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
          >
            {DEVICE_TYPES.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Shipping Fee
          </span>
          <input
            type="text"
            value={shippingFee}
            onChange={(e) => setShippingFee(e.target.value)}
            className="mt-1.5 block w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
          />
        </label>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Line Items
        </p>
        <div className="mt-2 space-y-2">
          {items.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Product ID"
                value={item.product_id}
                onChange={(e) => updateItem(idx, "product_id", e.target.value)}
                className="w-28 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
              />
              <input
                type="text"
                placeholder="Qty"
                value={item.quantity}
                onChange={(e) => updateItem(idx, "quantity", e.target.value)}
                className="w-16 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
              />
              <input
                type="text"
                placeholder="Unit Price"
                value={item.unit_price}
                onChange={(e) => updateItem(idx, "unit_price", e.target.value)}
                className="w-28 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
              />
              {items.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeItem(idx)}
                  className="rounded-lg px-2 py-1.5 text-xs font-medium text-rose-500 transition hover:bg-rose-50 hover:text-rose-700"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addItem}
          className="mt-2 text-xs font-semibold text-indigo-600 transition hover:text-indigo-800"
        >
          + Add item
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-700">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-700">
          {success}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
      >
        {submitting ? "Placing..." : "Place Order"}
      </button>
    </form>
  );
}
