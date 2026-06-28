import Link from "next/link";
import { Bell, Home, PlusCircle, Search, UserCircle } from "lucide-react";
import { MarketplaceAccountMenuLoader } from "./MarketplaceAccountMenuLoader";
import { MarketplaceSearch } from "./MarketplaceSearch";

type MarketplaceHeaderProps = {
  q?: string;
  category?: string;
  subcategory?: string;
  locationCounts?: Record<string, number>;
};

export function MarketplaceHeader({ q = "", category = "all", subcategory = "", locationCounts = {} }: MarketplaceHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto grid max-w-7xl min-w-0 gap-3 px-3 py-3 sm:px-4 lg:grid-cols-[190px_minmax(0,1fr)_auto] lg:items-center lg:px-8">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <img src="/agrimarketx-logo.png" alt="AgriMarketX" className="h-auto w-32 max-w-full sm:w-36" />
        </Link>

        <MarketplaceSearch q={q} category={category} subcategory={subcategory} locationCounts={locationCounts} />

        <MarketplaceAccountMenuLoader />
        <nav className="hidden gap-4 text-xs font-bold uppercase tracking-wide text-slate-500 lg:col-span-3 lg:flex">
          <Link href="/" className="hover:text-brand-green">Home</Link>
          <Link href="/marketplace" className="hover:text-brand-green">Marketplace</Link>
          <Link href="/farm-management" className="hover:text-brand-green">Farm Management</Link>
        </nav>
      </div>
    </header>
  );
}

export function MarketplacePageShell({
  children,
  q,
  category,
  subcategory,
  locationCounts
}: MarketplaceHeaderProps & {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen overflow-x-hidden bg-white pb-20 text-brand-navy lg:pb-0">
      <MarketplaceHeader q={q} category={category} subcategory={subcategory} locationCounts={locationCounts} />
      <div className="mx-auto max-w-7xl min-w-0 px-3 py-5 sm:px-4 lg:px-8">{children}</div>
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-slate-200 bg-white/95 px-2 pb-[calc(env(safe-area-inset-bottom)+0.35rem)] pt-2 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur lg:hidden">
        {[
          { href: "/", label: "Home", icon: Home },
          { href: "/marketplace", label: "Search", icon: Search },
          { href: "/marketplace/create", label: "Sell", icon: PlusCircle },
          { href: "/account/notifications", label: "Alerts", icon: Bell },
          { href: "/account", label: "Account", icon: UserCircle }
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href as never} className="grid min-h-12 place-items-center gap-1 rounded-md text-[11px] font-bold text-slate-600 active:bg-green-50 active:text-brand-green">
              <Icon size={20} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </main>
  );
}
