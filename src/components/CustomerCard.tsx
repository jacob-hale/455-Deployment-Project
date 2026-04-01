type CustomerCardProps = {
  fullName: string;
  loyaltyTier: string;
};

export default function CustomerCard({ fullName, loyaltyTier }: CustomerCardProps) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">{fullName}</h3>
      <p className="text-sm text-slate-600">Tier: {loyaltyTier}</p>
    </article>
  );
}
