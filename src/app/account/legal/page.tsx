import { FileCheck, FileText, Lock, Scale, ShieldAlert } from "lucide-react";
import { AccountMenuGroup, AccountMenuItem } from "@/components/AccountMenu";
import { AppShell, PageHeader } from "@/components/AppShell";

export default function LegalPage() {
  return (
    <AppShell>
      <PageHeader title="Legal" description="Rules and disclaimers for using AgriMarketX." />
      <div className="mx-auto max-w-2xl">
        <AccountMenuGroup>
          <AccountMenuItem href="/account/legal#terms" icon={FileText} title="Terms and Conditions" description="General rules for using the platform." />
          <AccountMenuItem href="/account/legal#privacy" icon={Lock} title="Privacy Policy" description="How farmer and marketplace data is handled." />
          <AccountMenuItem href="/account/legal/marketplace-rules" icon={Scale} title="Marketplace Rules" description="Rules for safe buying and selling." />
          <AccountMenuItem href="/account/legal#seller" icon={FileCheck} title="Seller Rules" description="Seller responsibilities and listing standards." />
          <AccountMenuItem href="/account/legal#disclaimer" icon={ShieldAlert} title="Animal Sale Disclaimer" description="Animal condition and transfer responsibility." />
        </AccountMenuGroup>
        <div className="mt-4 grid gap-3 text-sm text-slate-600">
          <section id="terms" className="rounded-md border border-slate-200 p-4">
            <h3 className="font-bold text-brand-navy">Terms and Conditions</h3>
            <p className="mt-2">AgriMarketX is a farm management and marketplace platform. Users must provide accurate account, farm, animal and listing information. Users may not upload fake records, misrepresent ownership, abuse other users, or use the platform for unlawful trade. AgriMarketX may review, reject, pause or remove listings that create safety, fraud or compliance concerns.</p>
          </section>
          <section id="privacy" className="rounded-md border border-slate-200 p-4">
            <h3 className="font-bold text-brand-navy">Privacy Policy</h3>
            <p className="mt-2">Farm records, animal records, health data, breeding data and financial records belong to the account or farm that created them. Public marketplace listings show only the information needed for buyers, such as title, photos, price and approximate location. Exact GPS coordinates and private records should remain private unless a seller chooses to share them with a buyer.</p>
          </section>
          <section id="marketplace" className="rounded-md border border-slate-200 p-4">
            <h3 className="font-bold text-brand-navy">Marketplace Rules</h3>
            <p className="mt-2">Sellers must use real photos, honest descriptions, correct categories and fair contact details. Buyers should inspect goods and documents before paying. Listings that appear fake, stolen, unsafe, misleading or prohibited can be reported and removed.</p>
          </section>
          <section id="seller" className="rounded-md border border-slate-200 p-4">
            <h3 className="font-bold text-brand-navy">Seller Rules</h3>
            <p className="mt-2">Sellers must own or be authorised to sell every item listed. Livestock sellers must only list animals recorded in their AgriMarketX herd. Sellers should keep contact details current, respond honestly, and update listings when items are sold, unavailable, paused or removed.</p>
          </section>
          <section id="disclaimer" className="rounded-md border border-slate-200 p-4">
            <h3 className="font-bold text-brand-navy">Animal Sale Disclaimer</h3>
            <p className="mt-2">AgriMarketX helps record and share livestock information, but it does not guarantee animal health, fertility, ownership, performance or transport outcomes. Buyers should inspect animals, confirm tags and records, check health history, and agree transfer terms before completing a sale.</p>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
