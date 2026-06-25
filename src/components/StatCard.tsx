import type { LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  detail,
  icon: Icon
}: {
  label: string;
  value: string | number;
  detail: string;
  icon: LucideIcon;
}) {
  return (
    <div className="panel p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-bold text-brand-navy">{value}</p>
        </div>
        <div className="rounded-lg bg-green-50 p-2 text-brand-green">
          <Icon size={20} />
        </div>
      </div>
      <p className="mt-3 text-sm text-slate-500">{detail}</p>
    </div>
  );
}
