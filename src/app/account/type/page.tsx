import { ShoppingCart, Sprout } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { chooseAccountType } from "./actions";

export default async function AccountTypePage({
  searchParams
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const { message } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  return (
    <main className="page-shell grid min-h-screen place-items-center px-4 py-10">
      <section className="w-full max-w-2xl">
        <div className="mb-8 text-center">
          <img src="/agrimarketx-logo.png" alt="AgriMarketX" className="mx-auto h-auto w-56 max-w-full" />
          <h1 className="mt-5 text-2xl font-bold text-brand-navy">How do you want to use AgriMarketX?</h1>
          <p className="mt-2 text-sm text-slate-600">{user?.email ?? "Choose your account type to continue."}</p>
        </div>
        {message ? (
          <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900">
            {message}
          </div>
        ) : null}
        <form action={chooseAccountType} className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
          <button
            className="panel p-5 text-left transition hover:border-brand-green hover:shadow-sm"
            name="accountType"
            value="buyer"
            type="submit"
          >
            <ShoppingCart className="text-brand-green" size={28} />
            <h2 className="mt-4 text-lg font-bold text-brand-navy">Buy only</h2>
            <p className="mt-2 text-sm text-slate-600">Browse listings, save favourites, follow farms, contact sellers and send messages.</p>
          </button>
          <button
            className="panel p-5 text-left transition hover:border-brand-green hover:shadow-sm"
            name="accountType"
            value="seller"
            type="submit"
          >
            <Sprout className="text-brand-green" size={28} />
            <h2 className="mt-4 text-lg font-bold text-brand-navy">Manage my farm / Sell</h2>
            <p className="mt-2 text-sm text-slate-600">Create farm profiles, manage farm records, and sell agricultural products or services.</p>
          </button>
          </div>
          <div className="panel p-4">
            <p className="text-sm font-bold text-brand-navy">If you choose Seller, what type of seller are you?</p>
            <p className="mt-1 text-xs text-slate-500">This only controls verification. Both seller types can sell every marketplace category.</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <label className="flex items-start gap-3 rounded-md border border-slate-200 p-3 text-sm">
                <input type="radio" name="sellerType" value="individual" defaultChecked />
                <span><b>Individual Seller</b><br /><span className="text-slate-600">Farmers, breeders, traders and individuals.</span></span>
              </label>
              <label className="flex items-start gap-3 rounded-md border border-slate-200 p-3 text-sm">
                <input type="radio" name="sellerType" value="business" />
                <span><b>Business Seller</b><br /><span className="text-slate-600">Feed stores, vets, dealers, co-ops and agri suppliers.</span></span>
              </label>
            </div>
          </div>
        </form>
      </section>
    </main>
  );
}
