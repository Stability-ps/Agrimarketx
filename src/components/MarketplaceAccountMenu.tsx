"use client";

import Link from "next/link";
import type { Route } from "next";
import {
  Bell,
  Building2,
  FileSearch,
  Heart,
  HelpCircle,
  LogOut,
  MessageCircle,
  PlusCircle,
  Settings,
  ShoppingBag,
  Shuffle,
  UserCircle,
  type LucideIcon
} from "lucide-react";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type MarketplaceProfile = {
  email: string | null;
  full_name: string | null;
  account_role: string | null;
  avatar_url: string | null;
};

function initialsFor(nameOrEmail: string) {
  const cleanName = nameOrEmail.includes("@") ? nameOrEmail.split("@")[0] : nameOrEmail;
  const parts = cleanName
    .replace(/[^a-zA-Z0-9\s._-]/g, " ")
    .split(/[\s._-]+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return "AX";
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function ProfileAvatar({ displayName, avatarUrl }: { displayName: string; avatarUrl?: string | null }) {
  if (avatarUrl) {
    return <img src={avatarUrl} alt="" className="h-9 w-9 rounded-full object-cover" loading="lazy" decoding="async" />;
  }

  return (
    <span className="grid h-9 w-9 place-items-center rounded-full bg-green-50 text-sm font-bold text-brand-green">
      {initialsFor(displayName)}
    </span>
  );
}

function MarketplaceMenuLink({ href, icon: Icon, label }: { href: Route | string; icon: LucideIcon; label: string }) {
  return (
    <Link href={href as Route} className="flex items-center gap-3 border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 last:border-b-0 hover:bg-slate-50 hover:text-brand-green">
      <Icon size={17} />
      {label}
    </Link>
  );
}

export function MarketplaceAccountMenu() {
  const [profile, setProfile] = useState<MarketplaceProfile | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      const supabase = createClient();
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user) {
        if (!cancelled) {
          setLoaded(true);
        }
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("full_name, email, account_role, avatar_url")
        .eq("id", user.id)
        .maybeSingle();

      if (!cancelled) {
        setProfile({
          email: data?.email ?? user.email ?? null,
          full_name: data?.full_name ?? null,
          account_role: data?.account_role ?? "buyer",
          avatar_url: data?.avatar_url ?? null
        });
        setLoaded(true);
      }
    }

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, []);

  const signedIn = Boolean(profile);
  const displayName = profile?.full_name || profile?.email || "AgriMarketX user";
  const accountRole = profile?.account_role ?? "buyer";
  const isSeller = accountRole === "seller";
  const isAdmin = accountRole === "admin" || accountRole === "super_admin";
  const sellHref = !loaded
    ? "/login?next=%2Fmarketplace%2Fcreate"
    : !signedIn
      ? "/login?next=%2Fmarketplace%2Fcreate"
      : isSeller || isAdmin
        ? "/marketplace/create"
        : "/onboarding?next=%2Fmarketplace%2Fcreate";

  return (
    <div className="flex items-center justify-between gap-2 lg:justify-end">
      <Link href={sellHref as Route} className="primary-button gap-1">
        <PlusCircle size={17} />
        Sell
      </Link>
      <Link href={signedIn ? "/account/messages" : "/login?next=%2Faccount%2Fmessages"} className="secondary-button !px-3" aria-label="Messages">
        <MessageCircle size={18} />
      </Link>
      <Link href={signedIn ? "/account/notifications" : "/login?next=%2Faccount%2Fnotifications"} className="secondary-button !px-3" aria-label="Notifications">
        <Bell size={18} />
      </Link>

      <details className="relative">
        <summary className="flex cursor-pointer list-none items-center justify-center rounded-full border border-slate-200 bg-white p-1 shadow-sm transition hover:border-brand-green" aria-label="Account menu">
          {signedIn ? (
            <ProfileAvatar displayName={displayName} avatarUrl={profile?.avatar_url} />
          ) : (
            <span className="grid h-9 w-9 place-items-center rounded-full bg-slate-50 text-slate-600">
              <UserCircle size={22} />
            </span>
          )}
        </summary>
        <div className="absolute right-0 mt-2 w-72 overflow-hidden rounded-md border border-slate-200 bg-white shadow-soft">
          {signedIn ? (
            <>
              <div className="border-b border-slate-100 p-4">
                <p className="truncate font-bold text-brand-navy">{displayName}</p>
              </div>
              {isAdmin ? (
                <>
                  <MarketplaceMenuLink href="/account" icon={UserCircle} label="My Profile" />
                  <MarketplaceMenuLink href="/admin" icon={Settings} label="Admin Portal" />
                  <MarketplaceMenuLink href="/admin/reports" icon={FileSearch} label="Audit Logs" />
                  <MarketplaceMenuLink href="/marketplace" icon={ShoppingBag} label="Switch Platform" />
                </>
              ) : null}
              {isSeller ? (
                <>
                  <MarketplaceMenuLink href="/dashboard" icon={Building2} label="Farm Console" />
                  <MarketplaceMenuLink href="/account/listings" icon={ShoppingBag} label="My Listings" />
                  <MarketplaceMenuLink href="/account/transfers" icon={Shuffle} label="Transfer Centre" />
                </>
              ) : null}
              {!isAdmin ? <MarketplaceMenuLink href="/account" icon={UserCircle} label="Profile" /> : null}
              <MarketplaceMenuLink href="/account/saved" icon={Heart} label="Saved Listings" />
              <MarketplaceMenuLink href="/account/saved" icon={Building2} label="Saved Farms" />
              <MarketplaceMenuLink href="/account/requests" icon={FileSearch} label="My Requests" />
              <MarketplaceMenuLink href="/settings" icon={Settings} label="Account Settings" />
              <MarketplaceMenuLink href="/account/messages" icon={MessageCircle} label="Messages" />
              <MarketplaceMenuLink href="/account/notifications" icon={Bell} label="Notifications" />
              {!isAdmin ? <MarketplaceMenuLink href="/account/support" icon={HelpCircle} label="Support" /> : null}
              <form action="/auth/signout" method="post" className="border-t border-slate-100">
                <button className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-semibold text-red-700 hover:bg-red-50" type="submit">
                  <LogOut size={17} />
                  Logout
                </button>
              </form>
            </>
          ) : (
            <div className="grid gap-2 p-3">
              <Link href="/login?next=%2Fmarketplace" className="secondary-button w-full">Login</Link>
              <Link href="/signup" className="primary-button w-full">Create Account</Link>
            </div>
          )}
        </div>
      </details>
    </div>
  );
}
