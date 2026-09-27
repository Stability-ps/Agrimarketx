import { BriefcaseBusiness, FilePlus2, Info, ShieldCheck } from "lucide-react";
import { AccountMenuGroup, AccountMenuItem } from "@/components/AccountMenu";
import { AppShell, PageHeader } from "@/components/AppShell";

export default function AccountAboutPage() {
  return (
    <AppShell>
      <PageHeader title="About AgriMarketX" description="Learn about the platform and how to use it well." />
      <div className="mx-auto max-w-2xl">
        <AccountMenuGroup>
          <AccountMenuItem href="/account/about#about" icon={Info} title="About AgriMarketX" description="Buy, sell, manage and grow agricultural activity." />
          <AccountMenuItem href="/account/about#posting-rules" icon={FilePlus2} title="Rules for Posting Listings" description="What sellers should include before publishing." />
          <AccountMenuItem href="/safety-advice" icon={ShieldCheck} title="Safety Advice" description="Practical guidance for safer marketplace trading." />
          <AccountMenuItem href="/account/about#business" icon={BriefcaseBusiness} title="AgriMarketX for Business" description="Marketplace and farm tools for agricultural businesses." />
        </AccountMenuGroup>
        <div className="mt-4 grid gap-3 text-sm text-slate-600">
          <p id="about" className="rounded-md border border-slate-200 p-4">AgriMarketX helps farmers, buyers and sellers manage farm records, livestock, products, services, requests and marketplace selling in one place.</p>
          <p id="posting-rules" className="rounded-md border border-slate-200 p-4">Use clear photos, honest prices, approximate location, correct category and real contact details.</p>
          
          <p id="business" className="rounded-md border border-slate-200 p-4">Agricultural businesses can create seller profiles, publish supported marketplace listings and use farm-management tools available to their account.</p>
        </div>
      </div>
    </AppShell>
  );
}
