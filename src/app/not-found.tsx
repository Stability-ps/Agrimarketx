import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-[70vh] place-items-center px-4 py-12">
      <section className="panel w-full max-w-xl p-6 text-center sm:p-8">
        <p className="text-sm font-bold uppercase tracking-wide text-brand-green">404</p>
        <h1 className="mt-2 text-2xl font-bold text-brand-navy">We could not find that page</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          The page may have moved, the listing may no longer be available, or the link may be incorrect.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/marketplace" className="primary-button">Back to Marketplace</Link>
          <Link href="/" className="secondary-button">Home</Link>
        </div>
      </section>
    </main>
  );
}
