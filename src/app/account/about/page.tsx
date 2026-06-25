import { BookOpen, BriefcaseBusiness, FilePlus2, Info } from "lucide-react";
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
          <AccountMenuItem href="/account/about#blog" icon={BookOpen} title="AgriMarketX Blog" description="Tips and product updates." />
          <AccountMenuItem href="/account/about#business" icon={BriefcaseBusiness} title="AgriMarketX for Business" description="Tools for breeders, farms and agricultural suppliers." />
        </AccountMenuGroup>
        <div className="mt-4 grid gap-3 text-sm text-slate-600">
          <p id="about" className="rounded-md border border-slate-200 p-4">AgriMarketX helps farmers, buyers and sellers manage farm records, livestock, products, services, requests and marketplace selling in one place.</p>
          <p id="posting-rules" className="rounded-md border border-slate-200 p-4">Use clear photos, honest prices, approximate location, correct category and real contact details.</p>
          <p id="blog" className="rounded-md border border-slate-200 p-4">The blog area is ready for future farmer education, marketplace tips and product updates.</p>
          <p id="business" className="rounded-md border border-slate-200 p-4">Business tools will support verified breeders, suppliers, vets and agricultural service providers.</p>
        </div>
      </div>
    </AppShell>
  );
}
