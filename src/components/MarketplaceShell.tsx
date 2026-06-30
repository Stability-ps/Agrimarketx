import Link from "next/link";
import { Suspense } from "react";
import { MarketplaceBottomNav } from "./MarketplaceBottomNav";
import { MarketplaceCategoriesButton } from "./MarketplaceCategoriesButton";
import { MarketplaceLocationSelector } from "./MarketplaceLocationSelector";
import { MarketplaceAccountMenuLoader } from "./MarketplaceAccountMenuLoader";
import { MarketplaceSearch } from "./MarketplaceSearch";
import type { MarketplaceListingSuggestion } from "@/lib/marketplace-search";

type MarketplaceHeaderProps = {
  q?: string;
  category?: string;
  subcategory?: string;
  location?: string;
  latitude?: string;
  longitude?: string;
  radius?: string;
  locationCounts?: Record<string, number>;
  listingSuggestions?: MarketplaceListingSuggestion[];
};

export function MarketplaceHeader({
  q = "",
  category = "all",
  subcategory = "",
  location = "",
  latitude,
  longitude,
  radius = "all",
  locationCounts = {},
  listingSuggestions = []
}: MarketplaceHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 pt-[env(safe-area-inset-top)] backdrop-blur lg:pt-0">
      <div className="mx-auto grid max-w-7xl min-w-0 gap-2 px-3 py-2 sm:px-4 lg:grid-cols-[190px_minmax(0,1fr)_auto] lg:items-center lg:gap-3 lg:px-8 lg:py-3">
        <div className="flex min-w-0 items-center justify-between gap-2 lg:block">
          <Link href="/marketplace" className="flex min-w-0 items-center gap-3">
            <img src="/agrimarketx-logo.png" alt="AgriMarketX" className="h-auto w-28 max-w-full sm:w-32 lg:w-36" />
          </Link>
          <MarketplaceCategoriesButton />
        </div>

        <MarketplaceSearch q={q} category={category} subcategory={subcategory} locationCounts={locationCounts} listingSuggestions={listingSuggestions} />

        <div className="hidden lg:block">
          <MarketplaceAccountMenuLoader />
        </div>
        <div className="lg:col-span-3 lg:max-w-sm">
          <Suspense fallback={null}>
            <MarketplaceLocationSelector location={location} latitude={latitude} longitude={longitude} radius={radius} />
          </Suspense>
        </div>
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
  location,
  latitude,
  longitude,
  radius,
  locationCounts,
  listingSuggestions
}: MarketplaceHeaderProps & {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen overflow-x-hidden bg-white pb-28 text-brand-navy lg:pb-0">
      <MarketplaceHeader q={q} category={category} subcategory={subcategory} location={location} latitude={latitude} longitude={longitude} radius={radius} locationCounts={locationCounts} listingSuggestions={listingSuggestions} />
      <div className="mx-auto max-w-7xl min-w-0 px-3 py-3 sm:px-4 lg:px-8 lg:py-5">{children}</div>
      <Suspense fallback={null}>
        <MarketplaceBottomNav />
      </Suspense>
    </main>
  );
}
