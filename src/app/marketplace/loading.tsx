import { MarketplacePageShell } from "@/components/MarketplaceShell";

function FeaturedSkeletonCard() {
  return (
    <div className="min-w-[31%] max-w-[31%] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm sm:min-w-[30%] sm:max-w-[30%] lg:min-w-[24%]">
      <div className="h-24 animate-pulse bg-green-50 sm:h-28 lg:h-44" />
      <div className="space-y-2 p-2 sm:p-3">
        <div className="h-3 w-5/6 animate-pulse rounded bg-slate-100" />
        <div className="h-3 w-2/3 animate-pulse rounded bg-slate-100" />
        <div className="h-4 w-20 animate-pulse rounded bg-green-50" />
      </div>
    </div>
  );
}

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
      <section className="mb-5 overflow-hidden border-b border-slate-200 bg-white pb-4 lg:rounded-xl lg:border lg:border-green-100 lg:bg-[#F8F9FA] lg:p-4 lg:shadow-soft">
        <div className="mb-3 flex items-center justify-between">
          <div className="h-6 w-40 animate-pulse rounded bg-slate-100" />
          <div className="h-4 w-14 animate-pulse rounded bg-green-50" />
        </div>
        <div className="no-scrollbar flex gap-2 overflow-hidden pb-1 lg:gap-4">
          {Array.from({ length: 4 }).map((_, index) => <FeaturedSkeletonCard key={index} />)}
        </div>
      </section>
      <section className="mb-5 border-b border-slate-200 bg-white pb-5 lg:rounded-xl lg:border lg:border-slate-200 lg:p-4 lg:shadow-sm">
        <div className="mb-3 h-5 w-36 animate-pulse rounded bg-slate-100" />
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-9">
        {Array.from({ length: 9 }).map((_, index) => (
          <div key={index} className="grid justify-items-center gap-2 rounded-md p-2">
            <div className="h-12 w-12 animate-pulse rounded-full bg-green-50" />
            <div className="h-3 w-16 animate-pulse rounded bg-slate-100" />
          </div>
        ))}
        </div>
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
