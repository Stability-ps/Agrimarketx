import type { Metadata } from "next";
import Link from "next/link";
import { MarketingShell, SectionHeader } from "@/components/marketing/MarketingShell";

export const metadata: Metadata = {
  title: "Privacy Policy | AgriMarketX",
  description:
    "AgriMarketX privacy policy explaining how account, marketplace, farm, location and support information is handled."
};

const updated = "26 September 2026";

const sections = [
  {
    title: "Who we are",
    body: (
      <>
        AgriMarketX is an agricultural marketplace and farm-management platform operated by Stability Group (Pty) Ltd. This
        policy applies to the AgriMarketX website, Android and iOS applications and related services.
      </>
    )
  },
  {
    title: "Information we collect",
    body: (
      <>
        Depending on how you use AgriMarketX, we may process account and profile details such as your name, email address,
        telephone number, business or farm information, profile details and authentication information. We may also process
        marketplace listings, enquiries, offers, messages, saved listings, wanted requests, livestock and farm records,
        uploaded photos, videos and documents, and information you submit when contacting support.
      </>
    )
  },
  {
    title: "Location information",
    body: (
      <>
        AgriMarketX may request access to your device location when you choose features such as finding nearby marketplace
        listings or sellers. Location access is permission-based. You can deny or change the permission in your device
        settings. AgriMarketX is designed to avoid exposing an exact farm or personal location publicly unless you
        intentionally choose to share location information through a feature that clearly indicates this.
      </>
    )
  },
  {
    title: "How we use information",
    body: (
      <>
        We use information to provide accounts, farm-management tools, marketplace listings and search, buyer-seller
        interactions, support, security, verification, record keeping, service communications, billing where applicable,
        fraud and abuse prevention, and to maintain and improve the platform.
      </>
    )
  },
  {
    title: "Service providers",
    body: (
      <>
        AgriMarketX uses service providers to operate the platform. These may include Supabase for application database,
        authentication and storage services, hosting and infrastructure providers, and Stripe for subscription or payment
        functions where those features are used. Providers process information under their own security and privacy
        obligations and only as needed to provide their services.
      </>
    )
  },
  {
    title: "Marketplace information and sharing",
    body: (
      <>
        Information you intentionally publish in a marketplace listing may be visible to other users or the public,
        depending on the feature. Private farm records and account information are not intended to become public merely
        because you use AgriMarketX. We may disclose information when required by law, to protect users or the platform, or
        to investigate suspected fraud, abuse or security incidents.
      </>
    )
  },
  {
    title: "Data retention",
    body: (
      <>
        We retain information for as long as reasonably necessary to provide AgriMarketX, maintain records, resolve
        disputes, meet legal or regulatory obligations and protect the platform. Retention periods can differ depending on
        the type of information and why it is held.
      </>
    )
  },
  {
    title: "Your choices and rights",
    body: (
      <>
        You may update information available in your account and control device permissions such as location through your
        device settings. You may also request access to, correction of or deletion of personal information by contacting
        AgriMarketX through the{" "}
        <Link href="/contact" className="font-semibold text-brand-green hover:underline">
          contact page
        </Link>
        . Requests are handled subject to applicable law and legitimate record-retention requirements.
      </>
    )
  },
  {
    title: "Security",
    body: (
      <>
        We use reasonable technical and organisational safeguards intended to protect information against unauthorised
        access, loss, misuse or alteration. No online service can guarantee absolute security, so users should also protect
        their account credentials and devices.
      </>
    )
  },
  {
    title: "Children",
    body: (
      <>
        AgriMarketX is intended for agricultural businesses, farmers, buyers and sellers and is not designed for children.
        We do not knowingly seek to collect personal information from children through the platform.
      </>
    )
  },
  {
    title: "South African privacy law",
    body: (
      <>
        Where applicable, we aim to process personal information consistently with the Protection of Personal Information
        Act, 2013 (POPIA) and other applicable privacy and consumer-protection requirements.
      </>
    )
  },
  {
    title: "Changes to this policy",
    body: (
      <>
        We may update this policy when the platform, legal requirements or our data practices change. The latest version
        will be published on this page with an updated effective date.
      </>
    )
  },
  {
    title: "Contact us",
    body: (
      <>
        For privacy questions, data requests or complaints, contact AgriMarketX through our{" "}
        <Link href="/contact" className="font-semibold text-brand-green hover:underline">
          support and contact page
        </Link>
        .
      </>
    )
  }
] as const;

export default function PrivacyPolicyPage() {
  return (
    <MarketingShell>
      <section className="px-4 py-14 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <SectionHeader
            eyebrow="Privacy"
            title="AgriMarketX Privacy Policy"
            description="How AgriMarketX handles personal, marketplace, farm and device information."
          />
          <p className="mb-6 text-sm text-slate-500">Last updated: {updated}</p>
          <div className="grid gap-4">
            {sections.map((section) => (
              <section key={section.title} className="panel p-5">
                <h2 className="text-lg font-bold text-brand-navy">{section.title}</h2>
                <div className="mt-2 text-sm leading-7 text-slate-600">{section.body}</div>
              </section>
            ))}
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
