export function InfoCard({
  title,
  value,
  detail
}: {
  title: string;
  value: string | number;
  detail: string;
}) {
  return (
    <div className="panel p-4">
      <p className="text-sm font-semibold text-slate-500">{title}</p>
      <p className="mt-2 text-2xl font-bold text-brand-navy">{value}</p>
      <p className="mt-2 text-sm text-slate-600">{detail}</p>
    </div>
  );
}
