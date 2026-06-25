import Link from "next/link";
import type { Route } from "next";
import { Bell, Building2, FileSearch, Heart, HelpCircle, LogOut, MessageCircle, PlusCircle, Settings, ShoppingBag, Shuffle, UserCircle, type LucideIcon } from "lucide-react";
import { MarketplaceSearch } from "./MarketplaceSearch";

type MarketplaceHeaderProps = {
  accountRole?: string;
  q?: string;
  category?: string;
  subcategory?: string;
  userEmail?: string | null;
  userName?: string | null;
  avatarUrl?: string | null;
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

function accountLabel(role?: string) {
  if (role === "seller") {
    return "Seller account";
  }

  if (role === "admin" || role === "super_admin") {
    return "Admin account";
  }

  return "Buyer account";
}

function ProfileAvatar({ displayName, avatarUrl }: { displayName: string; avatarUrl?: string | null }) {
  const initials = initialsFor(displayName);

  if (avatarUrl) {
    return <img src={avatarUrl} alt="" className="h-9 w-9 rounded-full object-cover" />;
  }

  return (
    <span className="grid h-9 w-9 place-items-center rounded-full bg-green-50 text-sm font-bold text-brand-green">
      {initials}
    </span>
  );
}

export function MarketplaceHeader({ accountRole = "buyer", q = "", category = "all", subcategory = "", userEmail, userName, avatarUrl }: MarketplaceHeaderProps) {
  const signedIn = Boolean(userEmail || userName);
  const displayName = userName || userEmail || "AgriMarketX user";
  const isSeller = accountRole === "seller";
  const isAdmin = accountRole === "admin" || accountRole === "super_admin";
  const sellHref = !signedIn
    ? "/login?next=%2Fmarketplace%2Fcreate"
    : isSeller || isAdmin
      ? "/marketplace/create"
      : "/onboarding?next=%2Fmarketplace%2Fcreate";

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto grid max-w-7xl gap-3 px-4 py-3 lg:grid-cols-[190px_1fr_auto] lg:items-center lg:px-8">
        <Link href="/marketplace" className="flex items-center gap-3">
          <img src="/agrimarketx-logo.png" alt="AgriMarketX" className="h-auto w-36" />
        </Link>

        <MarketplaceSearch q={q} category={category} subcategory={subcategory} />

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
                <ProfileAvatar displayName={displayName} avatarUrl={avatarUrl} />
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
                    <p className="mt-1 text-xs font-semibold text-slate-500">{accountLabel(accountRole)}</p>
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
      </div>
    </header>
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

export function MarketplacePageShell({
  accountRole,
  children,
  q,
  category,
  subcategory,
  userEmail,
  userName,
  avatarUrl
}: MarketplaceHeaderProps & {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-white text-brand-navy">
      <MarketplaceHeader accountRole={accountRole} q={q} category={category} subcategory={subcategory} userEmail={userEmail} userName={userName} avatarUrl={avatarUrl} />
      <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">{children}</div>
    </main>
  );
}
