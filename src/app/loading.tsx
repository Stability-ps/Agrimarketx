export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
      <div className="animate-pulse">
        <div className="h-7 w-48 rounded bg-slate-200" />
        <div className="mt-3 h-4 w-full max-w-md rounded bg-slate-100" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((item) => (
            <div key={item} className="rounded-md border border-slate-200 bg-white p-4">
              <div className="h-28 rounded bg-slate-100" />
              <div className="mt-4 h-4 w-3/4 rounded bg-slate-200" />
              <div className="mt-2 h-4 w-1/2 rounded bg-slate-100" />
            </div>
          ))}
        </div>
      </div>
      <span className="sr-only">Loading AgriMarketX</span>
    </main>
  );
}
