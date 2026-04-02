"use client";

import { useMemo, useState } from "react";

type CustomerProfile = {
  customer_id: number;
  full_name: string;
  email: string;
  customer_segment: string;
  loyalty_tier: string;
};

const QUICK_SELECT_IDS = [1, 23, 55, 87];

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
        headers: { "Content-Type": "application/json" },
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
    <main className="mx-auto flex min-h-[calc(100vh-57px)] w-full max-w-xl flex-col items-center justify-center px-6 py-12">
      <section className="w-full rounded-2xl border border-slate-200 bg-white p-8 shadow-lg shadow-slate-200/60">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Welcome to ShopIQ
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Enter a customer ID to get started, or pick one below.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 flex gap-3">
          <input
            type="text"
            inputMode="numeric"
            placeholder="e.g. 42"
            value={customerIdInput}
            onChange={(event) => setCustomerIdInput(event.target.value)}
            className="flex-1 rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-200 disabled:cursor-not-allowed disabled:bg-indigo-300 disabled:shadow-none"
          >
            {isLoading ? "Loading..." : "Continue"}
          </button>
        </form>

        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <span className="mr-1 self-center text-xs text-slate-400">
            Quick pick:
          </span>
          {QUICK_SELECT_IDS.map((id) => (
            <button
              key={id}
              type="button"
              disabled={isLoading}
              onClick={() => void loadCustomer(id)}
              className="rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-medium text-slate-600 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              #{id}
            </button>
          ))}
        </div>

        {error ? (
          <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        {customer ? (
          <div className="mt-6 rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-emerald-600">
              Welcome back
            </p>
            <p className="mt-1 text-xl font-bold text-emerald-900">
              {customer.full_name}
            </p>
            <div className="mt-3 flex gap-3">
              <span className="inline-flex items-center rounded-full bg-white/70 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
                {customer.customer_segment}
              </span>
              <span className="inline-flex items-center rounded-full bg-white/70 px-3 py-1 text-xs font-medium capitalize text-emerald-700 ring-1 ring-emerald-200">
                {customer.loyalty_tier}
              </span>
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
}
