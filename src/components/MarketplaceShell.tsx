import Link from "next/link";
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
        <Link href="/marketplace" className="flex min-w-0 items-center gap-3">
          <img src="/agrimarketx-logo.png" alt="AgriMarketX" className="h-auto w-32 max-w-full sm:w-36" />
        </Link>

        <MarketplaceSearch q={q} category={category} subcategory={subcategory} locationCounts={locationCounts} />

        <MarketplaceAccountMenuLoader />
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
    <main className="min-h-screen overflow-x-hidden bg-white text-brand-navy">
      <MarketplaceHeader q={q} category={category} subcategory={subcategory} locationCounts={locationCounts} />
      <div className="mx-auto max-w-7xl min-w-0 px-3 py-5 sm:px-4 lg:px-8">{children}</div>
    </main>
  );
}
