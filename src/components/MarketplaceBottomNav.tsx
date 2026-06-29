"use client";

import Link from "next/link";
import type { Route } from "next";
import { Bell, Home, PlusCircle, Search, UserCircle } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

function activeFor(pathname: string, href: string) {
  if (href === "/marketplace") {
    return pathname === "/" || pathname === "/marketplace";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MarketplaceBottomNav() {
  const pathname = usePathname();
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadSession() {
      const supabase = createClient();
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!cancelled) {
        setSignedIn(Boolean(user));
      }
    }

    void loadSession();

    return () => {
      cancelled = true;
    };
  }, []);

  const alertsHref = signedIn ? "/account/notifications" : "/login?next=%2Faccount%2Fnotifications";
  const accountHref = signedIn ? "/account" : "/login?next=%2Faccount";
  const items = [
    { href: "/marketplace", label: "Home", icon: Home },
    { href: "/marketplace?focus=search", label: "Search", icon: Search },
    { href: alertsHref, label: "Alerts", icon: Bell },
    { href: accountHref, label: "Account", icon: UserCircle }
  ];

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-2 pb-[calc(env(safe-area-inset-bottom)+0.45rem)] pt-2 shadow-[0_-10px_30px_rgba(15,23,42,0.10)] backdrop-blur lg:hidden"
      aria-label="Marketplace primary navigation"
    >
      <div className="relative mx-auto grid max-w-md grid-cols-5 items-end gap-1">
        {items.slice(0, 2).map((item) => {
          const Icon = item.icon;
          const active = activeFor(pathname, item.href.split("?")[0]);

          return (
            <Link
              key={item.label}
              href={item.href as Route}
              className={`grid min-h-14 touch-manipulation place-items-center gap-1 rounded-lg px-1 text-[11px] font-bold transition active:scale-95 ${
                active ? "bg-green-50 text-brand-green" : "text-slate-600 active:bg-green-50 active:text-brand-green"
              }`}
            >
              <Icon size={21} />
              {item.label}
            </Link>
          );
        })}
        <Link
          href={"/marketplace/create" as Route}
          className="group relative -mt-8 grid min-h-16 touch-manipulation place-items-center gap-1 rounded-lg text-[11px] font-bold text-brand-green"
          aria-label="Sell on AgriMarketX"
        >
          <span className="grid h-16 w-16 place-items-center rounded-full bg-brand-green text-white shadow-[0_12px_30px_rgba(46,125,50,0.35)] transition group-active:scale-95">
            <PlusCircle size={30} />
          </span>
          <span>Sell</span>
        </Link>
        {items.slice(2).map((item) => {
          const Icon = item.icon;
          const active = activeFor(pathname, item.href.split("?")[0]);

          return (
            <Link
              key={item.label}
              href={item.href as Route}
              className={`grid min-h-14 touch-manipulation place-items-center gap-1 rounded-lg px-1 text-[11px] font-bold transition active:scale-95 ${
                active ? "bg-green-50 text-brand-green" : "text-slate-600 active:bg-green-50 active:text-brand-green"
              }`}
            >
              <Icon size={21} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
