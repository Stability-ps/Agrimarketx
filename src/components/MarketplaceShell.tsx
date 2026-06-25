import Link from "next/link";
import { MarketplaceAccountMenuLoader } from "./MarketplaceAccountMenuLoader";
import { MarketplaceSearch } from "./MarketplaceSearch";

type MarketplaceHeaderProps = {
  q?: string;
  category?: string;
  subcategory?: string;
};

export function MarketplaceHeader({ q = "", category = "all", subcategory = "" }: MarketplaceHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto grid max-w-7xl gap-3 px-4 py-3 lg:grid-cols-[190px_1fr_auto] lg:items-center lg:px-8">
        <Link href="/marketplace" className="flex items-center gap-3">
          <img src="/agrimarketx-logo.png" alt="AgriMarketX" className="h-auto w-36" />
        </Link>

        <MarketplaceSearch q={q} category={category} subcategory={subcategory} />

        <MarketplaceAccountMenuLoader />
      </div>
    </header>
  );
}

export function MarketplacePageShell({
  children,
  q,
  category,
  subcategory
}: MarketplaceHeaderProps & {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-white text-brand-navy">
      <MarketplaceHeader q={q} category={category} subcategory={subcategory} />
      <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">{children}</div>
    </main>
  );
}
