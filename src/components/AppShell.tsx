"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BadgeDollarSign,
  ArrowLeft,
  Bell,
  CalendarHeart,
  ClipboardList,
  CreditCard,
  FileSearch,
  HeartPulse,
  Home,
  MessageCircle,
  PawPrint,
  ShoppingCart,
  Settings,
  ShieldCheck,
  UserCircle,
  Users,
  Wrench
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ACTIVE_FARM_COOKIE } from "@/lib/farm-cookie";
import { MarketplaceHeader } from "@/components/MarketplaceShell";

const navItems: { href: Route | string; label: string; icon: typeof Home }[] = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/animals", label: "Animals", icon: PawPrint },
  { href: "/health", label: "Health", icon: HeartPulse },
  { href: "/breeding", label: "Breeding", icon: CalendarHeart },
  { href: "/finance", label: "Finance", icon: BadgeDollarSign },
  { href: "/marketplace", label: "Marketplace", icon: ShoppingCart },
  { href: "/reports", label: "Reports", icon: ClipboardList },
  { href: "/seller/verification", label: "Seller Verification", icon: ShieldCheck },
  { href: "/subscription", label: "Subscription", icon: CreditCard },
  { href: "/account", label: "Account", icon: UserCircle },
  { href: "/admin", label: "Admin", icon: Settings }
];

const sellerOnlyNav = new Set(["/dashboard", "/animals", "/health", "/breeding", "/finance", "/reports", "/seller/verification", "/subscription"]);

const adminNavItems: { href: Route | string; label: string; icon: typeof Home }[] = [
  { href: "/admin", label: "Dashboard", icon: Home },
  { href: "/admin/listings", label: "Listings", icon: ShoppingCart },
  { href: "/admin/wanted-requests", label: "Wanted Requests", icon: FileSearch },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/farms", label: "Farms", icon: Home },
  { href: "/admin/verifications", label: "Verifications", icon: ShieldCheck },
  { href: "/admin/reports", label: "Reports", icon: ClipboardList },
  { href: "/account/messages", label: "Messages", icon: MessageCircle },
  { href: "/admin/support", label: "Support Tickets", icon: Wrench },
  { href: "/admin/subscriptions", label: "Subscriptions", icon: CreditCard },
  { href: "/admin/analytics", label: "Analytics", icon: FileSearch },
  { href: "/admin/seo", label: "SEO Management", icon: FileSearch },
  { href: "/admin/audit-logs", label: "Audit Logs", icon: ClipboardList },
  { href: "/admin/transfers", label: "Transfers", icon: PawPrint },
  { href: "/settings", label: "Settings", icon: Settings }
];

function readCookie(name: string) {
  if (typeof document === "undefined") {
    return "";
  }

  return document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${name}=`))
    ?.split("=")[1];
}

function isNavActive(pathname: string, href: string) {
  if (href === "/admin" || href === "/dashboard") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function initialsFor(nameOrEmail: string) {
  const cleanName = nameOrEmail.includes("@") ? nameOrEmail.split("@")[0] : nameOrEmail;
  const parts = cleanName
    .replace(/[^a-zA-Z0-9\s._-]/g, " ")
    .split(/[\s._-]+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return "AM";
  }

  return parts.slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function HeaderAvatar({ displayName, avatarUrl }: { displayName: string; avatarUrl?: string | null }) {
  if (avatarUrl) {
    return <img src={avatarUrl} alt="" className="h-9 w-9 rounded-full object-cover" />;
  }

  return (
    <span className="grid h-9 w-9 place-items-center rounded-full bg-green-50 text-sm font-bold text-brand-green">
      {initialsFor(displayName)}
    </span>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [farm, setFarm] = useState({
    name: "AgriMarketX",
    location: "Farm location",
    role: "Owner"
  });
  const [accountRole, setAccountRole] = useState<string | null>(null);
  const [profile, setProfile] = useState<{ email?: string | null; full_name?: string | null; avatar_url?: string | null }>({});
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    let mounted = true;

    async function loadFarm() {
      const supabase = createClient();
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user) {
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("account_role, email, full_name, avatar_url")
        .eq("id", user.id)
        .maybeSingle();

      if (mounted) {
        setAccountRole(profile?.account_role ?? "buyer");
        setProfile(profile ?? {});
      }

      const activeFarmId = readCookie(ACTIVE_FARM_COOKIE);
      let query = supabase
        .from("farm_members")
        .select("role, farm_id, farms(id, name, location, province, country)")
        .eq("user_id", user.id);

      if (activeFarmId) {
        query = query.eq("farm_id", activeFarmId);
      }

      let { data } = await query.limit(1).maybeSingle();

      if (!data && activeFarmId) {
        const fallback = await supabase
          .from("farm_members")
          .select("role, farm_id, farms(id, name, location, province, country)")
          .eq("user_id", user.id)
          .limit(1)
          .maybeSingle();

        data = fallback.data;
      }

      if (!mounted || !data) {
        return;
      }

      const farmRecord = Array.isArray(data.farms) ? data.farms[0] : data.farms;

      if (farmRecord?.name) {
        setFarm({
          name: farmRecord.name,
          location: farmRecord.location || [farmRecord.province, farmRecord.country].filter(Boolean).join(", ") || "Farm location",
          role: String(data.role || "owner").replace(/^\w/, (letter) => letter.toUpperCase())
        });
      }

      const { count } = await supabase
        .from("app_notifications")
        .select("id", { count: "exact", head: true })
        .is("read_at", null);

      if (mounted) {
        setUnreadNotifications(count ?? 0);
      }
    }

    loadFarm();

    return () => {
      mounted = false;
    };
  }, [pathname]);

  if (!accountRole) {
    return (
      <main className="grid min-h-screen place-items-center bg-white px-4 text-center">
        <div>
          <img src="/agrimarketx-logo.png" alt="AgriMarketX" className="mx-auto h-auto w-40" />
          <p className="mt-3 text-sm font-semibold text-slate-500">Loading your workspace...</p>
        </div>
      </main>
    );
  }

  if (accountRole === "buyer" && !pathname.startsWith("/admin")) {
    return (
      <main className="min-h-screen bg-white text-brand-navy">
        <MarketplaceHeader />
        <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">{children}</div>
      </main>
    );
  }

  const isAdminPortal = pathname.startsWith("/admin") && ["admin", "super_admin"].includes(accountRole);
  const adminRoleLabel = accountRole === "super_admin" ? "Super Admin" : accountRole === "admin" ? "Admin" : "Platform Admin";
  const visibleNavItems = isAdminPortal
    ? adminNavItems
    : navItems.filter((item) => {
        if (item.href === "/admin") {
          return ["admin", "super_admin"].includes(accountRole);
        }

        if (sellerOnlyNav.has(item.href)) {
          return ["seller", "admin", "super_admin"].includes(accountRole);
        }

        return true;
      });

  return (
    <div className="page-shell lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="border-b border-slate-200 bg-white lg:min-h-screen lg:border-b-0 lg:border-r">
        <div className="p-4 lg:p-6">
          <Link href={(isAdminPortal ? "/admin" : accountRole === "seller" ? "/dashboard" : "/marketplace") as Route} className="block">
            <div>
              <img
                src="/agrimarketx-logo.png"
                alt="AgriMarketX"
                className="h-auto w-44 max-w-full"
              />
              <div className="mt-2 text-sm font-semibold text-slate-600">{isAdminPortal ? (profile.full_name || profile.email || "Admin") : farm.name}</div>
            </div>
          </Link>
          <div className="mt-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-900">
            {isAdminPortal ? (
              <>
                <span className="block font-bold">{adminRoleLabel}</span>
                <span>AgriMarketX Platform</span>
              </>
            ) : `${farm.location} · ${farm.role}`}
          </div>
        </div>
        <nav className="flex gap-2 overflow-x-auto px-4 pb-4 lg:block lg:space-y-1 lg:px-3">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const active = isNavActive(pathname, String(item.href));

            return (
              <Link
                key={item.href}
                href={item.href as Route}
                className={`flex min-w-fit items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition ${
                  active ? "bg-brand-green text-white" : "text-slate-600 hover:bg-slate-100 hover:text-brand-navy"
                }`}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className="min-w-0">
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-slate-500">Agricultural marketplace and farm management</p>
              <h1 className="text-xl font-bold tracking-tight text-brand-navy">
                {isAdminPortal ? "AgriMarketX admin portal" : accountRole === "seller" ? "AgriMarketX farm console" : "AgriMarketX marketplace"}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/account/notifications" className="secondary-button relative !px-3" aria-label="Notifications">
                <Bell size={18} />
                {unreadNotifications > 0 ? (
                  <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-brand-green px-1 text-xs font-bold text-white">
                    {unreadNotifications > 9 ? "9+" : unreadNotifications}
                  </span>
                ) : null}
              </Link>
              {accountRole === "seller" ? (
                <Link href="/animals/add" className="primary-button">
                  Add animal
                </Link>
              ) : null}
              <details className="relative">
                <summary className="flex cursor-pointer list-none items-center justify-center rounded-full border border-slate-200 bg-white p-1 shadow-sm transition hover:border-brand-green" aria-label="Account menu">
                  <HeaderAvatar displayName={profile.full_name || profile.email || "AgriMarketX user"} avatarUrl={profile.avatar_url} />
                </summary>
                <div className="absolute right-0 mt-2 w-64 overflow-hidden rounded-md border border-slate-200 bg-white shadow-soft">
                  <div className="border-b border-slate-100 p-4">
                    <p className="truncate font-bold text-brand-navy">{profile.full_name || profile.email || "Account"}</p>
                  </div>
                  <Link href="/account" className="block border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-brand-green">Account</Link>
                  <Link href="/settings" className="block border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-brand-green">Settings</Link>
                  {isAdminPortal ? (
                    <>
                      <Link href="/account/notifications" className="block border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-brand-green">Notifications</Link>
                      <Link href="/admin/audit-logs" className="block border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-brand-green">Audit Logs</Link>
                      <Link href="/marketplace" className="block border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-brand-green">Switch Platform</Link>
                      <Link href="/admin" className="block border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-brand-green">Admin Portal</Link>
                    </>
                  ) : (
                    <>
                      <Link href="/dashboard" className="block border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-brand-green">Farm Console</Link>
                      <Link href="/seller/verification" className="block border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-brand-green">Seller Verification</Link>
                    </>
                  )}
                  <form action="/auth/signout" method="post">
                    <button className="block w-full px-4 py-3 text-left text-sm font-semibold text-red-700 hover:bg-red-50" type="submit">Logout</button>
                  </form>
                </div>
              </details>
            </div>
          </div>
        </header>
        <div className="p-4 lg:p-8">{children}</div>
      </main>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  action,
  backHref
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
  backHref?: string;
}) {
  function goBack() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      window.history.back();
      return;
    }

    window.location.href = backHref ?? "/account";
  }

  return (
    <div className="mb-6">
      <button type="button" onClick={goBack} className="mb-3 inline-flex items-center gap-2 text-sm font-bold text-brand-green hover:underline">
        <ArrowLeft size={16} />
        Back
      </button>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-brand-navy">{title}</h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">{description}</p>
        </div>
        {action}
      </div>
    </div>
  );
}
