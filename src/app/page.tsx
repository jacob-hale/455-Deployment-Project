"use client";

import { useMemo, useState } from "react";

type CustomerProfile = {
  customer_id: number;
  full_name: string;
  email: string;
  customer_segment: string;
  loyalty_tier: string;
};

const QUICK_SELECT_IDS = [1042, 1001, 2025, 3099];

export default function SelectCustomerPage() {
  const [customerIdInput, setCustomerIdInput] = useState<string>("");
  const [customer, setCustomer] = useState<CustomerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parsedCustomerId = useMemo(() => {
    if (!customerIdInput.trim()) {
      return null;
    }
    const parsed = Number.parseInt(customerIdInput, 10);
    return Number.isNaN(parsed) ? null : parsed;
  }, [customerIdInput]);

  const loadCustomer = async (customerId: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/customers/${customerId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" }
      });

      if (!response.ok) {
        throw new Error("Customer not found or unavailable.");
      }

      const profile: CustomerProfile = await response.json();
      setCustomer(profile);
      setCustomerIdInput(String(customerId));
    } catch (fetchError) {
      setCustomer(null);
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "Unable to load customer."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (parsedCustomerId === null) {
      setError("Please enter a valid numeric customer ID.");
      return;
    }
    await loadCustomer(parsedCustomerId);
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-6 py-12">
      <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
          Select Customer
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Enter a customer ID to log in or choose a quick option.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 flex gap-3">
          <input
            type="text"
            inputMode="numeric"
            placeholder="e.g. 1042"
            value={customerIdInput}
            onChange={(event) => setCustomerIdInput(event.target.value)}
            className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none ring-indigo-500 transition focus:ring-2"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
          >
            {isLoading ? "Loading..." : "Continue"}
          </button>
        </form>

        <div className="mt-4 flex flex-wrap gap-2">
          {QUICK_SELECT_IDS.map((id) => (
            <button
              key={id}
              type="button"
              disabled={isLoading}
              onClick={() => void loadCustomer(id)}
              className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-indigo-400 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {id}
            </button>
          ))}
        </div>

        {error ? (
          <p className="mt-5 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </p>
        ) : null}

        {customer ? (
          <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-sm text-emerald-700">Welcome back,</p>
            <p className="text-xl font-semibold text-emerald-900">
              {customer.full_name}
            </p>
            <p className="mt-1 text-sm text-emerald-800">
              Loyalty Tier:{" "}
              <span className="font-semibold capitalize">
                {customer.loyalty_tier}
              </span>
            </p>
          </div>
        ) : null}
      </section>
    </main>
  );
}
