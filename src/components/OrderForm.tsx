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
      className="mt-4 space-y-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div className="grid grid-cols-3 gap-4">
        <label className="block">
          <span className="text-xs font-medium text-slate-600">Payment</span>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-xs font-medium text-slate-600">Device</span>
          <select
            value={deviceType}
            onChange={(e) => setDeviceType(e.target.value)}
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            {DEVICE_TYPES.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-xs font-medium text-slate-600">
            Shipping Fee
          </span>
          <input
            type="text"
            value={shippingFee}
            onChange={(e) => setShippingFee(e.target.value)}
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </label>
      </div>

      <div>
        <p className="text-xs font-medium text-slate-600">Items</p>
        <div className="mt-2 space-y-2">
          {items.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Product ID"
                value={item.product_id}
                onChange={(e) => updateItem(idx, "product_id", e.target.value)}
                className="w-28 rounded-md border border-slate-300 px-3 py-1.5 text-sm"
              />
              <input
                type="text"
                placeholder="Qty"
                value={item.quantity}
                onChange={(e) => updateItem(idx, "quantity", e.target.value)}
                className="w-16 rounded-md border border-slate-300 px-3 py-1.5 text-sm"
              />
              <input
                type="text"
                placeholder="Unit Price"
                value={item.unit_price}
                onChange={(e) => updateItem(idx, "unit_price", e.target.value)}
                className="w-28 rounded-md border border-slate-300 px-3 py-1.5 text-sm"
              />
              {items.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeItem(idx)}
                  className="text-xs text-rose-600 hover:text-rose-800"
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
          className="mt-2 text-xs font-medium text-indigo-600 hover:text-indigo-800"
        >
          + Add item
        </button>
      </div>

      {error && (
        <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      )}
      {success && (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {success}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
      >
        {submitting ? "Placing..." : "Place Order"}
      </button>
    </form>
  );
}
