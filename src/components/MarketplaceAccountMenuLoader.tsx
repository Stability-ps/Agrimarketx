"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { Bell, MessageCircle, PlusCircle, UserCircle } from "lucide-react";

const MarketplaceAccountMenu = dynamic(
  () => import("./MarketplaceAccountMenu").then((module) => module.MarketplaceAccountMenu),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-between gap-2 lg:justify-end">
        <Link href="/login?next=%2Fmarketplace%2Fcreate" className="primary-button gap-1">
          <PlusCircle size={17} />
          Sell
        </Link>
        <Link href="/login?next=%2Faccount%2Fmessages" className="secondary-button !px-3" aria-label="Messages">
          <MessageCircle size={18} />
        </Link>
        <Link href="/login?next=%2Faccount%2Fnotifications" className="secondary-button !px-3" aria-label="Notifications">
          <Bell size={18} />
        </Link>
        <span className="grid h-11 w-11 place-items-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm">
          <UserCircle size={22} />
        </span>
      </div>
    )
  }
);

export function MarketplaceAccountMenuLoader() {
  return <MarketplaceAccountMenu />;
}
