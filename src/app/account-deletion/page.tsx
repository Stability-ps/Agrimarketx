import type { Metadata } from "next";
import Link from "next/link";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { createClient } from "@/lib/supabase/server";
import { requestAccountDeletion } from "./actions";

export const metadata: Metadata = {
  title: "Delete Account | AgriMarketX",
  description: "Request deletion of your AgriMarketX account and associated personal data."
};

export default async function AccountDeletionPage({
  searchParams
}: {
  searchParams: Promise<{ message?: string; status?: string }>;
}) {
  const { message, status } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <MarketingShell>
      <section className="px-4 py-12 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-wide text-brand-green">Privacy & account control</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-brand-navy sm:text-4xl">Delete your AgriMarketX account</h1>
          <p className="mt-4 text-slate-600">
            AgriMarketX is operated by Stability Group (Pty) Ltd. You can use this page to request deletion of your
            AgriMarketX account and personal data associated with it.
          </p>

          {message ? (
            <div className={`mt-6 rounded-md border px-4 py-3 text-sm font-medium ${status === "success" ? "border-green-200 bg-green-50 text-green-900" : "border-red-200 bg-red-50 text-red-800"}`}>
              {message}
            </div>
          ) : null}

          <div className="mt-8 grid gap-6">
            <section className="rounded-md border border-slate-200 bg-white p-5">
              <h2 className="text-xl font-bold">How to request deletion</h2>
              <p className="mt-2 text-sm text-slate-600">
                If you are signed in, submit the form below using the email address linked to your account. If you cannot
                sign in, you can still submit a request and we may contact you to verify account ownership before deletion.
              </p>
              <form action={requestAccountDeletion} className="mt-5 grid gap-4">
                <label className="grid gap-1 text-sm font-semibold">
                  AgriMarketX account email
                  <input className="field" name="email" type="email" defaultValue={user?.email ?? ""} required />
                </label>
                <label className="grid gap-1 text-sm font-semibold">
                  Reason (optional)
                  <textarea className="field min-h-24" name="reason" placeholder="Tell us why you would like the account deleted." />
                </label>
                <input type="hidden" name="source" value={user ? "app" : "web"} />
                <button className="primary-button sm:w-fit" type="submit">Request account deletion</button>
              </form>
            </section>

            <section className="rounded-md border border-slate-200 bg-white p-5">
              <h2 className="text-xl font-bold">What will be deleted</h2>
              <p className="mt-2 text-sm text-slate-600">
                After we verify and process your request, we delete or anonymise personal account and profile information
                and data that is no longer required to provide the service. This can include your profile details, saved
                marketplace activity, messages, uploaded profile media and other records directly associated with your account.
              </p>
            </section>

            <section className="rounded-md border border-slate-200 bg-white p-5">
              <h2 className="text-xl font-bold">Data we may retain</h2>
              <p className="mt-2 text-sm text-slate-600">
                Some records may be retained where reasonably necessary for legal, tax, accounting, fraud-prevention,
                dispute-resolution, security or regulatory obligations. Where possible, retained records are minimised or
                anonymised and are kept only for the applicable retention period.
              </p>
            </section>

            <section className="rounded-md border border-slate-200 bg-slate-50 p-5">
              <h2 className="font-bold">Need help?</h2>
              <p className="mt-2 text-sm text-slate-600">
                Contact AgriMarketX support at <a className="font-semibold text-brand-green" href="mailto:support@agrimarketx.co.za">support@agrimarketx.co.za</a>.
                You can also review our <Link href="/privacy" className="font-semibold text-brand-green">Privacy Policy</Link>.
              </p>
            </section>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
