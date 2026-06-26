import { defaultSpecies } from "@/lib/constants";
import { LocationFields } from "@/components/LocationFields";
import { supplyCategories } from "@/lib/supply-categories";
import { createClient } from "@/lib/supabase/server";
import { createFarm } from "./actions";

export default async function OnboardingPage({
  searchParams
}: {
  searchParams: Promise<{ message?: string; next?: string; sellerType?: string }>;
}) {
  const { message, next = "/dashboard", sellerType = "individual" } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone")
    .eq("id", user?.id ?? "")
    .maybeSingle();

  return (
    <main className="page-shell px-4 py-8 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Set up your farm</h1>
          <p className="mt-2 text-slate-600">Create the first farm profile, choose what you manage or sell, and invite your team later.</p>
        </div>
        <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
          <form action={createFarm} className="panel space-y-4 p-5">
            <input type="hidden" name="next" value={next} />
            <input type="hidden" name="sellerType" value={sellerType === "business" ? "business" : "individual"} />
            {message ? (
              <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900">
                {message}
              </div>
            ) : null}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-md border border-green-100 bg-green-50 p-3 sm:col-span-2">
                <p className="text-sm font-bold text-brand-green">
                  Seller type: {sellerType === "business" ? "Business Seller" : "Individual Seller"}
                </p>
                <p className="mt-1 text-xs text-slate-600">This only controls verification. You can sell any approved marketplace category.</p>
              </div>
              <label>
                <span className="text-sm font-semibold">Farm name</span>
                <input className="field mt-1" name="farmName" placeholder="Mavuno Mixed Farm" required />
              </label>
              <label>
                <span className="text-sm font-semibold">Owner details</span>
                <input className="field mt-1" name="ownerName" placeholder="Patric Moyo" defaultValue={profile?.full_name ?? ""} />
              </label>
              <label>
                <span className="text-sm font-semibold">Owner phone</span>
                <input className="field mt-1" name="ownerPhone" placeholder="+27 61 000 0000" defaultValue={profile?.phone ?? ""} />
              </label>
              <label>
                <span className="text-sm font-semibold">Country</span>
                <input className="field mt-1" name="country" placeholder="South Africa" defaultValue="South Africa" />
              </label>
              <div className="sm:col-span-2">
                <LocationFields townName="location" showApproximate={false} />
              </div>
              <label>
                <span className="text-sm font-semibold">GPS coordinates</span>
                <input className="field mt-1" name="gpsCoordinates" placeholder="-23.8332, 30.1635" />
              </label>
              <label>
                <span className="text-sm font-semibold">Farm size</span>
                <input className="field mt-1" name="sizeHectares" placeholder="450 hectares" />
              </label>
              <label>
                <span className="text-sm font-semibold">Farm type</span>
                <select className="field mt-1" name="farmType">
                  <option>Mixed livestock</option>
                  <option>Commercial breeding</option>
                  <option>Smallholder</option>
                  <option>Feedlot</option>
                </select>
              </label>
              <label>
                <span className="text-sm font-semibold">Facilities</span>
                <input className="field mt-1" name="facilities" placeholder="Camps, crush, dip tank, loading ramp" />
              </label>
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold">What do you sell or offer?</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {supplyCategories.map(([value, label]) => (
                  <label key={value} className="flex items-center gap-3 rounded-md border border-slate-200 px-3 py-2 text-sm">
                    <input type="checkbox" name="supplyCategories" value={value} defaultChecked={value === "livestock"} />
                    {label}
                  </label>
                ))}
              </div>
              <p className="mt-2 text-xs font-semibold text-slate-500">Used for buyer request matching, farm profiles and seller recommendations.</p>
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold">Livestock types</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {defaultSpecies.map((species) => (
                  <label key={species.name} className="flex items-center gap-3 rounded-md border border-slate-200 px-3 py-2 text-sm">
                    <input type="checkbox" name="species" value={species.name} defaultChecked={["Cattle", "Goats", "Sheep"].includes(species.name)} />
                    {species.name}
                  </label>
                ))}
              </div>
            </div>
            <button className="primary-button" type="submit">
              Create farm
            </button>
          </form>
          <aside className="panel p-5">
            <h2 className="font-bold">Livestock species settings</h2>
            <div className="mt-4 space-y-3">
              {defaultSpecies.slice(0, 5).map((species) => (
                <div key={species.name} className="rounded-md bg-slate-50 p-3">
                  <div className="font-semibold">{species.name}</div>
                  <div className="text-sm text-slate-600">
                    {species.young} · {species.female} · {species.male} · {species.gestationDays} days
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
