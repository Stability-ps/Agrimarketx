import Link from "next/link";

const navItems: { href: string; label: string }[] = [
  { href: "/", label: "Home" },
  { href: "/marketplace", label: "Marketplace" },
  { href: "/farm-management", label: "Farm Management" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/faq", label: "FAQ" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" }
];

const publicInfoLinks: { href: string; label: string }[] = [
  { href: "/help-centre", label: "Help Centre" },
  { href: "/safety-advice", label: "Safety Advice" },
  { href: "/marketplace-rules", label: "Marketplace Rules" },
  { href: "/legal", label: "Legal" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/account-deletion", label: "Delete Account" },
  { href: "/about", label: "About AgriMarketX" },
  { href: "/contact", label: "Contact" }
];

export function MarketingShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-brand-navy">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <img src="/agrimarketx-logo.png" alt="AgriMarketX" className="h-auto w-36" />
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-semibold text-slate-600 lg:flex">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href as never} className="hover:text-brand-green">
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login" className="secondary-button hidden sm:inline-flex">
              Login
            </Link>
            <Link href="/marketplace/create" className="primary-button">
              Sell
            </Link>
          </div>
        </div>
      </header>
      <main>{children}</main>
      <footer className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 lg:grid-cols-[1.4fr_1fr_1fr] lg:px-8">
          <div>
            <img src="/agrimarketx-logo.png" alt="AgriMarketX" className="h-auto w-44" />
            <p className="mt-4 max-w-md text-sm text-slate-600">
              Agricultural marketplace, farm management, digital records and buyer-seller tools for African agriculture.
            </p>
          </div>
          <div>
            <h3 className="font-bold">Platform</h3>
            <div className="mt-3 grid gap-2 text-sm text-slate-600">
              {navItems.slice(1).map((item) => (
                <Link key={item.href} href={item.href as never} className="hover:text-brand-green">
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-bold">Account</h3>
            <div className="mt-3 grid gap-2 text-sm text-slate-600">
              <Link href="/marketplace/create" className="hover:text-brand-green">Sell on AgriMarketX</Link>
              <Link href="/login" className="hover:text-brand-green">Login</Link>
              <Link href="/dashboard" className="hover:text-brand-green">Farm Console</Link>
            </div>
          </div>
          <div className="lg:col-span-3">
            <h3 className="font-bold">Help & Legal</h3>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-600">
              {publicInfoLinks.map((item) => (
                <Link key={item.href} href={item.href as never} className="hover:text-brand-green">
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
        <div className="border-t border-slate-200 px-4 py-4 text-center text-xs text-slate-500">
          © 2026 AgriMarketX. Built for farmers, buyers and sellers who manage, trade and grow agricultural businesses.
        </div>
      </footer>
    </div>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  description
}: {
  eyebrow?: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mx-auto mb-8 max-w-3xl text-center">
      {eyebrow ? <p className="text-sm font-bold uppercase tracking-wide text-brand-green">{eyebrow}</p> : null}
      <h2 className="mt-2 text-3xl font-bold tracking-tight text-brand-navy sm:text-4xl">{title}</h2>
      <p className="mt-3 text-base text-slate-600">{description}</p>
    </div>
  );
}

export function MarketingCta() {
  return (
    <section className="bg-brand-navy px-4 py-14 text-white lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-6">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-green-300">Ready to grow your agricultural business?</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight">Start with a clean marketplace and farm setup.</h2>
          <p className="mt-3 max-w-2xl text-sm text-slate-300">
            Create your first farm or seller profile, manage records, publish listings, track requests and grow with marketplace activity.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/onboarding" className="primary-button bg-white text-brand-navy hover:bg-slate-100">
            Start Farm Setup
          </Link>
          <Link href="/marketplace" className="secondary-button border-white/30 bg-transparent text-white hover:border-white hover:text-white">
            Browse Marketplace
          </Link>
        </div>
      </div>
    </section>
  );
}
