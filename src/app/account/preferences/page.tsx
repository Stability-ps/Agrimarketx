import { PreferenceRow } from "@/components/AccountMenu";
import { AppShell, PageHeader } from "@/components/AppShell";

export default function PreferencesPage() {
  return (
    <AppShell>
      <PageHeader title="Preferences" description="Choose the alerts you want to receive." />
      <div className="mx-auto max-w-2xl overflow-hidden rounded-md border border-slate-200 bg-white">
        <PreferenceRow title="Push Notifications" description="Allow app-ready reminders and alerts." />
        <PreferenceRow title="Marketplace Alerts" description="New offers, saved listings and category updates." />
        <PreferenceRow title="Message Notifications" description="Buyer and seller message alerts." />
        <PreferenceRow title="Listing Approval Notifications" description="Updates when a listing is ready to appear." />
        <PreferenceRow title="Enhanced Error Logging" description="Help diagnose app issues faster during early testing." />
      </div>
    </AppShell>
  );
}
