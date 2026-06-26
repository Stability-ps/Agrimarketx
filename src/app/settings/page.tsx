import { AppShell, PageHeader } from "@/components/AppShell";
import { LocationFields } from "@/components/LocationFields";
import { publicStorageUrl } from "@/lib/files";
import { formatRand } from "@/lib/format";
import { supplyCategories } from "@/lib/supply-categories";
import { createClient } from "@/lib/supabase/server";
import { getOptionalCurrentFarm } from "@/lib/farm-server";
import {
  createAdditionalFarm,
  deleteFarmLogo,
  deleteProfilePhoto,
  switchActiveFarm,
  updateFarmDetails,
  updateFarmLogo,
  updateProfileDetails,
  updateProfilePhoto
} from "./actions";

export default async function SettingsPage({
  searchParams
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const { message } = await searchParams;
  const supabase = await createClient();
  const farm = await getOptionalCurrentFarm();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, phone, whatsapp_number, avatar_url")
    .eq("id", user?.id ?? "")
    .maybeSingle();
  const { data: farmRecord } = farm?.id
    ? await supabase
        .from("farms")
        .select("name, owner_name, owner_phone, location, province, country, gps_latitude, gps_longitude, size_hectares, farm_type, facilities, description, logo_url, supply_categories")
        .eq("id", farm.id)
        .maybeSingle()
    : { data: null };
  const { data: farmMemberships } = await supabase
    .from("farm_members")
    .select("role, farm_id, farms(id, name, location, province, country, logo_url)")
    .eq("user_id", user?.id ?? "")
    .order("created_at", { ascending: true });
  const { data: savedListings } = await supabase
    .from("marketplace_saved_listings")
    .select(`
      id,
      marketplace_listings(
        id,
        title,
        price,
        currency,
        province,
        town,
        approximate_location,
        animals(breed, gender, species(name), animal_media(storage_path, media_type, is_profile, created_at))
      )
    `)
    .eq("user_id", user?.id ?? "")
    .order("created_at", { ascending: false })
    .limit(12);

  return (
    <AppShell>
      <PageHeader
        title="Settings"
        description="Manage your account profile, contact details, farms and marketplace preferences."
      />
      {message ? (
        <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm font-medium text-green-900">
          {message}
        </div>
      ) : null}
      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <section id="my-farms" className="panel p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="font-bold">Farmer profile</h3>
              <p className="mt-1 text-sm text-slate-600">This is the person profile connected to your account.</p>
            </div>
            <div className="flex items-center gap-3">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Farmer profile" className="h-20 w-20 rounded-full object-cover" />
              ) : (
                <div className="grid h-20 w-20 place-items-center rounded-full bg-green-50 text-sm font-bold text-brand-green">
                  Profile
                </div>
              )}
            </div>
          </div>
          <form action={updateProfilePhoto} className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
            <input className="field" type="file" name="profilePhoto" accept="image/*" required />
            <button className="primary-button" type="submit">{profile?.avatar_url ? "Change picture" : "Upload picture"}</button>
          </form>
          {profile?.avatar_url ? (
            <form action={deleteProfilePhoto} className="mt-3">
              <button className="secondary-button border-red-200 text-red-700 hover:border-red-300 hover:text-red-800" type="submit">Delete profile picture</button>
            </form>
          ) : null}
          <form action={updateProfileDetails} className="mt-5 grid gap-3 md:grid-cols-3">
            <label className="grid gap-1 text-sm font-semibold">
              Full name
              <input className="field" name="fullName" defaultValue={profile?.full_name ?? ""} placeholder="Farmer name" />
            </label>
            <label className="grid gap-1 text-sm font-semibold">
              Email
              <input className="field" name="email" type="email" defaultValue={profile?.email ?? user?.email ?? ""} placeholder="farmer@example.com" />
            </label>
            <label className="grid gap-1 text-sm font-semibold">
              Phone
              <input className="field" name="phone" defaultValue={profile?.phone ?? ""} placeholder="+27 61 000 0000" />
            </label>
            <label className="grid gap-1 text-sm font-semibold">
              WhatsApp
              <input className="field" name="whatsappNumber" defaultValue={profile?.whatsapp_number ?? ""} placeholder="+27 61 000 0000" />
            </label>
            <button className="primary-button md:w-fit" type="submit">Save profile details</button>
          </form>
        </section>

        <section className="panel p-5">
          <h3 className="font-bold">Your farms</h3>
          <p className="mt-1 text-sm text-slate-600">Choose which farm you are working on. Each farm keeps its own animals, health, breeding and finance records.</p>
          <div className="mt-4 grid gap-2">
            {(farmMemberships ?? []).length === 0 ? (
              <p className="rounded-md border border-slate-200 p-3 text-sm text-slate-600">No farms yet. You can keep using AgriMarketX as a buyer, or create a farm when you are ready to sell, manage farm records and run your operations.</p>
            ) : null}
            {(farmMemberships ?? []).map((membership) => {
              const memberFarm = Array.isArray(membership.farms) ? membership.farms[0] : membership.farms;
              if (!memberFarm) {
                return null;
              }
              const active = memberFarm.id === farm?.id;

              return (
                <div key={membership.farm_id} className={`rounded-md border p-3 ${active ? "border-brand-green bg-green-50" : "border-slate-200"}`}>
                  <div className="flex items-start gap-3">
                    {memberFarm.logo_url ? (
                      <img src={memberFarm.logo_url} alt={memberFarm.name} className="h-12 w-12 rounded-md object-cover" />
                    ) : (
                      <div className="grid h-12 w-12 place-items-center rounded-md bg-white text-xs font-bold text-brand-green">Farm</div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-bold">{memberFarm.name}</p>
                      <p className="text-sm text-slate-600">{memberFarm.location || [memberFarm.province, memberFarm.country].filter(Boolean).join(", ") || "No location yet"}</p>
                      <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{String(membership.role).replace(/^\w/, (letter) => letter.toUpperCase())}</p>
                    </div>
                    {active ? (
                      <span className="rounded-full bg-brand-green px-2 py-1 text-xs font-bold text-white">Active</span>
                    ) : (
                      <form action={switchActiveFarm}>
                        <input type="hidden" name="farmId" value={memberFarm.id} />
                        <button className="secondary-button" type="submit">Switch</button>
                      </form>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <form action={createAdditionalFarm} className="mt-5 grid gap-3">
            <h4 className="font-bold">{farmMemberships?.length ? "Add another farm" : "Create your first farm"}</h4>
            <input className="field" name="farmName" placeholder="Farm name" required />
            <input className="field" name="ownerName" placeholder="Owner name" defaultValue={profile?.full_name ?? ""} />
            <input className="field" name="ownerPhone" placeholder="Owner phone" defaultValue={profile?.phone ?? ""} />
            <div className="grid gap-3">
              <LocationFields townName="location" showApproximate={false} />
              <input className="field" name="country" placeholder="Country" defaultValue="South Africa" />
            </div>
            <input className="field" name="farmType" placeholder="Farm / business type, e.g. Mixed farm, feed supplier, equipment dealer" />
            <div className="grid gap-2">
              <p className="text-sm font-semibold">What do you sell or offer?</p>
              <p className="text-xs text-slate-500">Choose all that fit your farm or business. This helps matching and recommendations, but does not limit what you can sell.</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {supplyCategories.map(([value, label]) => (
                  <label key={value} className="flex items-center gap-3 rounded-md border border-slate-200 px-3 py-2 text-sm">
                    <input type="checkbox" name="supplyCategories" value={value} defaultChecked={value === "all"} />
                    {label}
                  </label>
                ))}
              </div>
            </div>
            <input className="field" name="facilities" placeholder="Facilities, comma separated" />
            <button className="primary-button" type="submit">Create farm</button>
          </form>
        </section>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_360px]">
        {farm ? (
        <>
        <section className="panel p-5">
          <h3 className="font-bold">Farm logo</h3>
          <div className="mt-4 flex items-center gap-4">
            {farmRecord?.logo_url ? (
              <img src={farmRecord.logo_url} alt="Farm logo" className="h-20 w-20 rounded-md object-cover" />
            ) : (
              <div className="grid h-20 w-20 place-items-center rounded-md bg-slate-50 text-sm font-bold text-slate-500">
                Logo
              </div>
            )}
            <div>
              <p className="font-semibold">{farmRecord?.name ?? farm.name}</p>
              <p className="text-sm text-slate-600">Use your farm logo for documents and future marketplace trust badges.</p>
            </div>
          </div>
          <form action={updateFarmLogo} className="mt-4 grid gap-3">
            <input className="field" type="file" name="farmLogo" accept="image/*" required />
            <button className="primary-button sm:w-fit" type="submit">{farmRecord?.logo_url ? "Change farm logo" : "Upload farm logo"}</button>
          </form>
          {farmRecord?.logo_url ? (
            <form action={deleteFarmLogo} className="mt-3">
              <button className="secondary-button border-red-200 text-red-700 hover:border-red-300 hover:text-red-800" type="submit">Delete farm logo</button>
            </form>
          ) : null}
          <form action={updateFarmDetails} className="mt-5 grid gap-3 md:grid-cols-2">
            <label className="grid gap-1 text-sm font-semibold">
              Farm name
              <input className="field" name="farmName" defaultValue={farmRecord?.name ?? farm.name} required />
            </label>
            <label className="grid gap-1 text-sm font-semibold">
              Owner name
              <input className="field" name="ownerName" defaultValue={farmRecord?.owner_name ?? profile?.full_name ?? ""} />
            </label>
            <label className="grid gap-1 text-sm font-semibold">
              Owner phone
              <input className="field" name="ownerPhone" defaultValue={farmRecord?.owner_phone ?? profile?.phone ?? ""} />
            </label>
            <div className="md:col-span-2">
              <LocationFields
                townName="location"
                defaultTown={farmRecord?.location ?? ""}
                defaultProvince={farmRecord?.province ?? ""}
                showApproximate={false}
              />
            </div>
            <label className="grid gap-1 text-sm font-semibold">
              Country
              <input className="field" name="country" defaultValue={farmRecord?.country ?? ""} />
            </label>
            <label className="grid gap-1 text-sm font-semibold">
              GPS latitude
              <input className="field" name="gpsLatitude" defaultValue={farmRecord?.gps_latitude ?? ""} placeholder="-23.8332" />
            </label>
            <label className="grid gap-1 text-sm font-semibold">
              GPS longitude
              <input className="field" name="gpsLongitude" defaultValue={farmRecord?.gps_longitude ?? ""} placeholder="30.1635" />
            </label>
            <label className="grid gap-1 text-sm font-semibold">
              Farm size
              <input className="field" name="sizeHectares" defaultValue={farmRecord?.size_hectares ?? ""} placeholder="450" />
            </label>
            <label className="grid gap-1 text-sm font-semibold">
              Farm / business type
              <input className="field" name="farmType" defaultValue={farmRecord?.farm_type ?? ""} placeholder="Mixed farm, feed supplier, equipment dealer" />
            </label>
            <div className="grid gap-2 md:col-span-2">
              <p className="text-sm font-semibold">What do you sell or offer?</p>
              <p className="text-xs text-slate-500">Used for farm profile display, buyer request matching and seller recommendations. You can still sell approved items outside these categories.</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {supplyCategories.map(([value, label]) => (
                  <label key={value} className="flex items-center gap-3 rounded-md border border-slate-200 px-3 py-2 text-sm">
                    <input type="checkbox" name="supplyCategories" value={value} defaultChecked={(farmRecord?.supply_categories ?? []).includes(value) || (!(farmRecord?.supply_categories ?? []).length && value === "all")} />
                    {label}
                  </label>
                ))}
              </div>
            </div>
            <label className="grid gap-1 text-sm font-semibold md:col-span-2">
              Facilities
              <input className="field" name="facilities" defaultValue={(farmRecord?.facilities ?? []).join(", ")} placeholder="Camps, crush, dip tank" />
            </label>
            <label className="grid gap-1 text-sm font-semibold md:col-span-2">
              Farm description
              <textarea className="field min-h-24" name="description" defaultValue={farmRecord?.description ?? ""} placeholder="Short description buyers will see on your public farm profile." />
            </label>
            <button className="primary-button md:w-fit" type="submit">Save farm details</button>
          </form>
        </section>
        <section className="panel p-5">
          <h3 className="font-bold">Active farm records</h3>
          <p className="mt-2 text-sm text-slate-600">You are currently working inside:</p>
          <div className="mt-4 rounded-md bg-green-50 p-4">
            <p className="text-lg font-bold text-brand-green">{farmRecord?.name ?? farm.name}</p>
            <p className="mt-1 text-sm text-green-900">{farmRecord?.location || [farmRecord?.province, farmRecord?.country].filter(Boolean).join(", ") || "Location not set"}</p>
          </div>
          <p className="mt-4 text-sm text-slate-600">When you switch farms, the dashboard, animals, health, breeding, finance and reports all use that farm’s records.</p>
        </section>
        </>
        ) : (
        <section className="panel p-5">
          <h3 className="font-bold">Farm tools are optional</h3>
          <p className="mt-2 text-sm text-slate-600">You are using a buyer account right now. You can browse, save listings, follow farms, message sellers and manage your profile without creating a farm.</p>
          <div className="mt-4 rounded-md bg-green-50 p-4">
            <p className="font-bold text-brand-green">Want to sell or manage a farm?</p>
            <p className="mt-1 text-sm text-green-900">Choose Manage my farm / Sell and create your first farm or seller profile when you are ready.</p>
          </div>
          <a href="/account/type" className="primary-button mt-4 inline-flex">Start selling</a>
        </section>
        )}
      </div>
      <section id="saved-listings" className="panel mt-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-bold">Saved marketplace listings</h3>
            <p className="mt-1 text-sm text-slate-600">Listings you marked with the heart icon while browsing the marketplace.</p>
          </div>
          <a href="/marketplace" className="secondary-button">Browse marketplace</a>
        </div>
        {(savedListings ?? []).length === 0 ? (
          <p className="mt-4 rounded-md border border-slate-200 p-3 text-sm text-slate-500">No saved listings yet.</p>
        ) : (
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {savedListings?.map((saved) => {
              const listing = Array.isArray(saved.marketplace_listings) ? saved.marketplace_listings[0] : saved.marketplace_listings;
              const animal = Array.isArray(listing?.animals) ? listing?.animals[0] : listing?.animals;
              const species = Array.isArray(animal?.species) ? animal?.species[0] : animal?.species;
              const photos = Array.isArray(animal?.animal_media)
                ? animal.animal_media
                    .filter((item) => item.media_type === "photo")
                    .sort((a, b) => Number(Boolean(b.is_profile)) - Number(Boolean(a.is_profile)) || String(b.created_at).localeCompare(String(a.created_at)))
                : [];
              const photo = photos[0];
              const location = listing?.approximate_location || [listing?.town, listing?.province].filter(Boolean).join(", ") || "Approximate location hidden";

              return listing ? (
                <a key={saved.id} href={`/marketplace/${listing.id}`} className="overflow-hidden rounded-md border border-slate-200 transition hover:border-brand-green">
                  {photo?.storage_path ? (
                    <img src={publicStorageUrl("animal-media", photo.storage_path)} alt={listing.title} className="h-32 w-full object-cover" />
                  ) : (
                    <div className="grid h-32 place-items-center bg-green-50 text-sm font-semibold text-brand-green">No photo yet</div>
                  )}
                  <div className="p-3">
                    <h4 className="font-bold">{listing.title}</h4>
                    <p className="mt-1 text-sm text-slate-600">{species?.name ?? "Livestock"}{animal?.breed ? ` · ${animal.breed}` : ""}{animal?.gender ? ` · ${animal.gender}` : ""}</p>
                    <p className="mt-1 text-sm text-slate-600">{location}</p>
                    <p className="mt-2 font-bold text-brand-green">{formatRand(listing.price)}</p>
                  </div>
                </a>
              ) : null;
            })}
          </div>
        )}
      </section>
    </AppShell>
  );
}
