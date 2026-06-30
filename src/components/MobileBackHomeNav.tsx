"use client";

import Link from "next/link";
import { ArrowLeft, Home } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

function isMarketplaceHome(pathname: string) {
  return pathname === "/" || pathname === "/marketplace";
}

export function MobileBackHomeNav() {
  const pathname = usePathname();
  const router = useRouter();

  if (isMarketplaceHome(pathname)) {
    return null;
  }

  return (
    <div className="fixed left-3 top-[calc(env(safe-area-inset-top)+0.75rem)] z-50 flex items-center gap-2 lg:hidden">
      <button
        type="button"
        className="inline-flex h-9 items-center gap-1 rounded-full border border-slate-200 bg-white/95 px-3 text-xs font-black text-brand-green shadow-sm backdrop-blur active:scale-95"
        onClick={() => {
          if (window.history.length > 1) {
            router.back();
            return;
          }

          router.push("/marketplace");
        }}
      >
        <ArrowLeft size={15} />
        Back
      </button>
      <Link
        href="/marketplace"
        className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 bg-white/95 text-brand-green shadow-sm backdrop-blur active:scale-95"
        aria-label="Marketplace home"
      >
        <Home size={16} />
      </Link>
    </div>
  );
}
