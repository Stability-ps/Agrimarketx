import Link from "next/link";
import { AppShell, PageHeader } from "@/components/AppShell";

export default function PreferencesPage() {
  return (
    <AppShell>
      <PageHeader title="Preferences" description="Manage the settings that are currently available for your account." />
      <div className="mx-auto grid max-w-2xl gap-4">
        <section className="panel p-5">
          <h2 className="font-bold text-brand-navy">In-app notifications</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Important marketplace, message, verification and account updates appear in your AgriMarketX notifications.
            Native push notification controls are not shown until push delivery is fully enabled.
          </p>
          <Link href="/account/notifications" className="secondary-button mt-4">View notifications</Link>
        </section>
        <section className="panel p-5">
          <h2 className="font-bold text-brand-navy">Account settings</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Update your profile, farm and account information from Settings. AgriMarketX will only display interactive
            preference switches when those choices are saved and respected by the service.
          </p>
          <Link href="/settings" className="secondary-button mt-4">Open Settings</Link>
        </section>
      </div>
    </AppShell>
  );
}
