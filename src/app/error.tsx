"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[agrimarketx-page-error]", error);
  }, [error]);

  return (
    <main className="grid min-h-[70vh] place-items-center px-4 py-12">
      <section className="panel w-full max-w-xl p-6 text-center sm:p-8">
        <p className="text-sm font-bold uppercase tracking-wide text-brand-green">AgriMarketX</p>
        <h1 className="mt-2 text-2xl font-bold text-brand-navy">Something went wrong</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          We could not load this page. Check your connection and try again. Your account data has not been changed by this screen.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button type="button" className="primary-button" onClick={() => reset()}>Try again</button>
          <Link href="/marketplace" className="secondary-button">Back to Marketplace</Link>
        </div>
      </section>
    </main>
  );
}
