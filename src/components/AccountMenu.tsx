import Link from "next/link";
import type { Route } from "next";
import { ChevronRight, type LucideIcon } from "lucide-react";

type AccountMenuItemProps = {
  href: Route | string;
  title: string;
  description?: string;
  icon: LucideIcon;
};

export function AccountMenuItem({ href, title, description, icon: Icon }: AccountMenuItemProps) {
  return (
    <Link
      href={href as Route}
      className="flex items-center gap-3 border-b border-slate-100 px-4 py-4 transition last:border-b-0 hover:bg-slate-50"
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-green-50 text-brand-green">
        <Icon size={20} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-bold text-brand-navy">{title}</span>
        {description ? <span className="mt-0.5 block text-sm text-slate-600">{description}</span> : null}
      </span>
      <ChevronRight className="shrink-0 text-slate-400" size={18} />
    </Link>
  );
}

export function AccountMenuGroup({ children }: { children: React.ReactNode }) {
  return <div className="overflow-hidden rounded-md border border-slate-200 bg-white">{children}</div>;
}

export function PreferenceRow({ title, description }: { title: string; description: string }) {
  return (
    <label className="flex items-center gap-3 border-b border-slate-100 px-4 py-4 last:border-b-0">
      <span className="min-w-0 flex-1">
        <span className="block font-bold text-brand-navy">{title}</span>
        <span className="mt-0.5 block text-sm text-slate-600">{description}</span>
      </span>
      <input type="checkbox" className="h-5 w-5 accent-brand-green" defaultChecked />
    </label>
  );
}
