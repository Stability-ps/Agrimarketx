import { MarketplacePageShell } from "@/components/MarketplaceShell";

function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
      <div className="h-36 animate-pulse bg-green-50" />
      <div className="space-y-3 p-3">
        <div className="h-4 w-3/4 animate-pulse rounded bg-slate-100" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-slate-100" />
        <div className="h-3 w-2/3 animate-pulse rounded bg-slate-100" />
        <div className="h-5 w-24 animate-pulse rounded bg-green-50" />
      </div>
    </div>
  );
}

export default function MarketplaceLoading() {
  return (
    <MarketplacePageShell>
      <section className="mb-5 overflow-hidden rounded-lg bg-brand-navy text-white shadow-soft">
        <div className="p-6 sm:p-8 lg:p-10">
          <div className="h-9 w-72 max-w-full animate-pulse rounded bg-white/15" />
          <div className="mt-3 h-4 w-96 max-w-full animate-pulse rounded bg-white/10" />
          <div className="mt-5 h-10 w-36 animate-pulse rounded bg-white/15" />
        </div>
      </section>
      <section className="mb-5 grid grid-cols-3 gap-3 rounded-md border border-slate-200 bg-white p-4 sm:grid-cols-5 lg:grid-cols-9">
        {Array.from({ length: 9 }).map((_, index) => (
          <div key={index} className="grid justify-items-center gap-2 rounded-md p-2">
            <div className="h-12 w-12 animate-pulse rounded-full bg-green-50" />
            <div className="h-3 w-16 animate-pulse rounded bg-slate-100" />
          </div>
        ))}
      </section>
      <section>
        <div className="mb-4 h-6 w-44 animate-pulse rounded bg-slate-100" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => <SkeletonCard key={index} />)}
        </div>
      </section>
    </MarketplacePageShell>
  );
}
