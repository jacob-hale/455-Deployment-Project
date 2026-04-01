type OrderTableProps = {
  title?: string;
};

export default function OrderTable({ title = "Orders" }: OrderTableProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm text-slate-600">
        Placeholder for customer order history table.
      </p>
    </section>
  );
}
