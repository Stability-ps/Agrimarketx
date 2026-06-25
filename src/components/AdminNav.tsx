"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const adminLinks = [
  ["/admin", "Overview"],
  ["/admin/listings", "Listings"],
  ["/admin/categories", "Categories"],
  ["/admin/wanted-requests", "Wanted Requests"],
  ["/admin/users", "Users"],
  ["/admin/farms", "Farms"],
  ["/admin/reports", "Reports"],
  ["/admin/support", "Support"],
  ["/account/messages", "Messages"],
  ["/admin/transfers", "Transfers"],
  ["/admin/verifications", "Verifications"],
  ["/admin/subscriptions", "Subscriptions"],
  ["/admin/analytics", "Analytics"],
  ["/admin/seo", "SEO"],
  ["/admin/audit-logs", "Audit Logs"],
  ["/settings", "Settings"]
] as const;

export function AdminNav() {
  const pathname = usePathname();

  return (
    <div className="mb-5 flex gap-2 overflow-x-auto rounded-lg border border-slate-200 bg-white p-2">
      {adminLinks.map(([href, label]) => {
        const active = href === "/admin" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

        return (
          <Link
            key={href}
            href={href as never}
            className={`min-w-fit rounded-md px-3 py-2 text-sm font-semibold ${
              active ? "bg-brand-green text-white" : "text-slate-600 hover:bg-green-50 hover:text-brand-green"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}
