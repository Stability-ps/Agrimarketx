import type { Metadata } from "next";
import { MarketingShell, SectionHeader } from "@/components/marketing/MarketingShell";
import { supportChannels } from "@/lib/marketing-data";
import { createPublicContactEnquiry } from "./actions";

export const metadata: Metadata = {
  title: "Contact AgriMarketX",
  description: "Contact AgriMarketX support, send an enquiry, report a problem or request assistance without creating an account."
};

export default async function ContactPage({
  searchParams
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const { message } = await searchParams;

  return (
    <MarketingShell>
      <section className="px-4 py-14 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <SectionHeader
              eyebrow="Contact"
              title="Talk through your farm setup."
              description="Use this page for demo requests, onboarding questions, support and partnership interest."
            />
            <div className="grid gap-3">
              {supportChannels.map((channel) => {
                const Icon = channel.icon;
                return (
                  <div key={channel.label} className="panel flex gap-4 p-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-green-50 text-brand-green">
                      <Icon size={21} />
                    </div>
                    <div>
                      <h2 className="font-bold">{channel.label}</h2>
                      <p className="text-sm text-slate-600">{channel.value}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <form action={createPublicContactEnquiry} className="panel space-y-4 p-5">
            {message ? <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm font-semibold text-green-900">{message}</div> : null}
            <div className="grid gap-4 sm:grid-cols-2">
              <label>
                <span className="text-sm font-semibold">Name</span>
                <input className="field mt-1" name="name" placeholder="Your name" required />
              </label>
              <label>
                <span className="text-sm font-semibold">Email</span>
                <input className="field mt-1" name="email" type="email" placeholder="you@example.com" required />
              </label>
              <label>
                <span className="text-sm font-semibold">What do you need?</span>
                <select className="field mt-1" name="enquiryType" defaultValue="support">
                  <option value="support">Request assistance</option>
                  <option value="problem">Report a problem</option>
                  <option value="marketplace">Marketplace question</option>
                  <option value="farm">Farm setup question</option>
                  <option value="partnership">Partnership</option>
                </select>
              </label>
              <label>
                <span className="text-sm font-semibold">Subject</span>
                <input className="field mt-1" name="subject" placeholder="Short subject" required />
              </label>
            </div>
            <label className="block">
              <span className="text-sm font-semibold">Message</span>
              <textarea className="field mt-1 min-h-32" name="message" placeholder="Tell us what you need help with." required />
            </label>
            <button className="primary-button" type="submit">
              Send request
            </button>
          </form>
        </div>
      </section>
    </MarketingShell>
  );
}
