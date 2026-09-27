import Link from "next/link";
import { getListingContact } from "@/lib/listing-contact";
import { notFound } from "next/navigation";
import { AppShell, PageHeader } from "@/components/AppShell";
import { DateField } from "@/components/DateField";
import { publicStorageUrl } from "@/lib/files";
import { createClient } from "@/lib/supabase/server";
import { getCurrentFarm, getFarmSpecies } from "@/lib/farm-server";
import { genderOptions, healthRecordOptions, optionLabel, originOptions, statusOptions } from "@/lib/animal-options";
import { addHealthRecord, addWeightRecord, updateAnimal } from "./actions";
import { createMarketplaceListing, updateMarketplaceListing } from "@/app/marketplace/actions";
import { advanceTransfer } from "./transfer-actions";
import { deleteAnimalPhoto, setAnimalProfilePhoto, uploadAnimalPhoto } from "./media-actions";

const breedingRecordOptions = [
  ["mating", "Mating"],
  ["exposure", "Exposure"],
  ["pregnancy_check", "Pregnancy check"],
  ["birth", "Birth record"],
  ["weaning", "Weaning"]
] as const;

const financeTransactionOptions = [
  ["sale", "Sale"],
  ["expense", "General expense"],
  ["feed_purchase", "Feed purchase"],
  ["medication_cost", "Medication cost"],
  ["transport_cost", "Transport cost"],
  ["labour_cost", "Labour cost"],
  ["valuation", "Herd valuation"],
  ["payment", "Payment received"]
] as const;

const expenseTransactionTypes = new Set(["expense", "feed_purchase", "medication_cost", "transport_cost", "labour_cost"]);

function money(amount: number) {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    maximumFractionDigits: 0
  }).format(amount);
}

export default async function AnimalProfilePage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ edit?: string; action?: string; message?: string }>;
}) {
  const { id } = await params;
  const { edit, action, message } = await searchParams;
  const editHref = `/animals/${id}?edit=1#edit-animal`;
  const healthHref = `/animals/${id}?action=health#quick-action`;
  const weightHref = `/animals/${id}?action=weight#quick-action`;
  const listingHref = `/animals/${id}?action=listing#marketplace-listing`;
  const photoHref = `/animals/${id}?action=photo#animal-photos`;
  const viewPhotosHref = `/animals/${id}?action=photos#animal-photos`;
  const profileHref = `/animals/${id}`;
  const supabase = await createClient();
  const farm = await getCurrentFarm();
  const farmSpecies = await getFarmSpecies(farm.id);
  const { data: animal } = await supabase
    .from("animals")
    .select(`
      id,
      animal_code,
      passport_id,
      species_id,
      tag_number,
      rfid_nfc_tag,
      breed,
      gender,
      date_of_birth,
      age_category,
      current_weight_kg,
      status,
      origin,
      notes,
      species(name),
      sire:sire_id(animal_code),
      dam:dam_id(animal_code)
    `)
    .eq("id", id)
    .eq("farm_id", farm.id)
    .maybeSingle();

  const { data: weightRecords } = await supabase
    .from("weight_records")
    .select("id, weight_kg, measured_at, notes")
    .eq("animal_id", id)
    .order("measured_at", { ascending: false })
    .limit(5);

  const { data: healthRecords } = await supabase
    .from("health_records")
    .select("id, record_type, product_name, batch_number, dosage, withdrawal_period_days, administered_at, due_at, notes")
    .eq("farm_id", farm.id)
    .or(`animal_id.eq.${id},animal_id.is.null`)
    .order("administered_at", { ascending: false })
    .limit(5);

  const { data: animalMedia } = await supabase
    .from("animal_media")
    .select("id, storage_path, caption, is_profile, created_at")
    .eq("animal_id", id)
    .eq("media_type", "photo")
    .order("is_profile", { ascending: false })
    .order("created_at", { ascending: false });

  const { data: breedingRecords } = await supabase
    .from("breeding_records")
    .select(`
      id,
      record_type,
      event_date,
      pregnancy_status,
      expected_birth_date,
      notes,
      female:female_animal_id(animal_code, tag_number),
      male:male_animal_id(animal_code, tag_number)
    `)
    .eq("farm_id", farm.id)
    .or(`female_animal_id.eq.${id},male_animal_id.eq.${id}`)
    .order("event_date", { ascending: false })
    .limit(5);

  const { data: offspring } = await supabase
    .from("animals")
    .select("id, animal_code, tag_number, gender, date_of_birth, age_category, species(name)")
    .eq("farm_id", farm.id)
    .or(`dam_id.eq.${id},sire_id.eq.${id}`)
    .order("date_of_birth", { ascending: false })
    .limit(8);

  const { data: financeRecords } = await supabase
    .from("finance_transactions")
    .select("id, transaction_type, amount, description, invoice_number, paid_at, due_at")
    .eq("farm_id", farm.id)
    .eq("animal_id", id)
    .order("created_at", { ascending: false })
    .limit(5);

  const { data: activeListingRow } = await supabase
    .from("marketplace_listings")
    .select("id, title, description, price, status, province, town, approximate_location, price_negotiable, preferred_contact_method")
    .eq("animal_id", id)
    .eq("seller_farm_id", farm.id)
    .in("status", ["draft", "active", "reserved"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  // The listing belongs to the member's own (verified) farm, so its private
  // contact fields can be loaded server-side to pre-fill the edit form.
  const activeListing = activeListingRow
    ? { ...activeListingRow, ...(await getListingContact(activeListingRow.id, { viewerIsSeller: true })) }
    : null;

  const { data: activeTransfer } = await supabase
    .from("ownership_transfers")
    .select("id, status, delivery_method, buyer_user_id, seller_ready_at, in_transit_at, delivered_at, received_at")
    .eq("animal_id", id)
    .eq("seller_farm_id", farm.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!animal) {
    notFound();
  }

  const species = Array.isArray(animal.species) ? animal.species[0] : animal.species;
  const sire = Array.isArray(animal.sire) ? animal.sire[0] : animal.sire;
  const dam = Array.isArray(animal.dam) ? animal.dam[0] : animal.dam;
  const profilePhoto = animalMedia?.find((media) => media.is_profile) ?? animalMedia?.[0];

  return (
    <AppShell>
      <PageHeader
        title={animal.animal_code}
        description={`${species?.name ?? "Animal"} · ${animal.breed || "Breed not set"} · ${optionLabel(genderOptions, animal.gender)} · ${animal.age_category || "Age category pending"}`}
      />
      {message ? (
        <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm font-medium text-green-900">
          {message}
        </div>
      ) : null}
      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="panel p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-500">Digital animal passport</p>
              <h3 className="mt-1 text-xl font-bold">{animal.passport_id}</h3>
              <p className="mt-2 text-sm text-slate-600">Public/private passport view with QR code, full history and PDF export.</p>
              <div className="mt-4 max-w-xs overflow-hidden rounded-md border border-slate-200 bg-slate-50">
                {profilePhoto ? (
                  <img
                    src={publicStorageUrl("animal-media", profilePhoto.storage_path)}
                    alt={profilePhoto.caption ?? animal.animal_code}
                    className="h-48 w-full object-cover"
                  />
                ) : (
                  <div className="grid h-48 place-items-center px-4 text-center text-sm font-semibold text-slate-500">
                    No profile photo yet
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end gap-3">
              <div className="grid h-28 w-28 place-items-center rounded-lg border border-slate-300 bg-slate-50 text-center text-xs font-semibold text-slate-500">
                QR CODE
              </div>
              <Link href={listingHref as never} className="secondary-button">
                Create listing
              </Link>
              <Link href={photoHref as never} className="secondary-button">
                Change photo
              </Link>
              <Link href={viewPhotosHref as never} className="secondary-button">
                View all photos
              </Link>
            </div>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {[
              ["Animal ID", animal.animal_code],
              ["Passport ID", animal.passport_id],
              ["Species", species?.name ?? "Unknown"],
              ["Breed", animal.breed || "Not set"],
              ["Gender", optionLabel(genderOptions, animal.gender)],
              ["Age category", animal.age_category || "Pending"],
              ["Tag number", animal.tag_number || "Not set"],
              ["RFID / NFC", animal.rfid_nfc_tag || "Not set"],
              ["Date of birth", animal.date_of_birth || "Not set"],
              ["Weight", animal.current_weight_kg ? `${animal.current_weight_kg} kg` : "Not set"],
              ["Status", optionLabel(statusOptions, animal.status)],
              ["Origin", optionLabel(originOptions, animal.origin)],
              ["Location", farm.name],
              ["Sire / Dam", `${sire?.animal_code || "Not set"} / ${dam?.animal_code || "Not set"}`],
              ["Notes", animal.notes || "No notes"]
            ].map(([label, value]) => (
              <div key={label} className="rounded-md bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
                <p className="mt-1 font-semibold">{value}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-end">
            <Link href={editHref as never} className="primary-button">
              Edit animal details
            </Link>
          </div>
        </section>
        <aside className="space-y-4">
          <div className="panel p-5">
            <h3 className="font-bold">Ownership transfer</h3>
            {activeTransfer ? (
              <div className="mt-3 space-y-3 text-sm">
                <div className="rounded-md bg-slate-50 p-3">
                  <p className="font-semibold">Status: {String(activeTransfer.status).replace("_", " ")}</p>
                  <p className="mt-1 text-slate-600">Buyer selected from accepted marketplace offer.</p>
                </div>
                <form action={advanceTransfer} className="grid gap-2">
                  <input type="hidden" name="transferId" value={activeTransfer.id} />
                  <input type="hidden" name="animalId" value={animal.id} />
                  {activeTransfer.status === "seller_ready" || activeTransfer.status === "awaiting_collection" ? (
                    <>
                      <input type="hidden" name="nextStatus" value="in_transit" />
                      <button className="primary-button w-full" type="submit">Mark in transit</button>
                    </>
                  ) : null}
                  {activeTransfer.status === "in_transit" ? (
                    <>
                      <input type="hidden" name="nextStatus" value="delivered" />
                      <button className="primary-button w-full" type="submit">Mark delivered / sold</button>
                    </>
                  ) : null}
                </form>
              </div>
            ) : (
              <>
                <ol className="mt-3 space-y-2 text-sm text-slate-600">
                  <li>Create a listing from the animal profile.</li>
                  <li>Buyer sends an offer from marketplace.</li>
                  <li>Seller accepts and transfer starts.</li>
                  <li>Seller marks in transit and delivered.</li>
                </ol>
                <Link href={listingHref as never} className="primary-button mt-4 w-full">
                  Create marketplace listing
                </Link>
              </>
            )}
          </div>
        </aside>
      </div>
      <section id="animal-photos" className="mt-4">
        <div className="panel p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-bold">Animal photos</h3>
              <p className="mt-1 text-sm text-slate-600">Photos uploaded here can also be used by marketplace listings.</p>
            </div>
            {action === "photo" || action === "photos" ? (
              <Link href={profileHref as never} className="secondary-button">Close</Link>
            ) : (
              <div className="flex flex-wrap gap-2">
                <Link href={photoHref as never} className="primary-button">Change photo</Link>
                <Link href={viewPhotosHref as never} className="secondary-button">View all photos</Link>
              </div>
            )}
          </div>
          {action === "photo" ? (
            <form action={uploadAnimalPhoto} className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
              <input type="hidden" name="animalId" value={animal.id} />
              <input className="field" name="photo" type="file" accept="image/*" required />
              <input className="field" name="caption" placeholder="Caption, optional" />
              <button className="primary-button" type="submit">Save photo</button>
            </form>
          ) : null}
          {action === "photos" ? (
            <>
              <form action={uploadAnimalPhoto} className="mt-4 grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-3 sm:grid-cols-[1fr_1fr_auto]">
                <input type="hidden" name="animalId" value={animal.id} />
                <input className="field" name="photo" type="file" accept="image/*" required />
                <input className="field" name="caption" placeholder="Caption, optional" />
                <button className="primary-button" type="submit">Add photo</button>
              </form>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {(animalMedia ?? []).length === 0 ? (
                  <p className="text-sm text-slate-500">No animal photos uploaded yet.</p>
                ) : (
                animalMedia?.map((media) => (
                    <figure key={media.id} className="overflow-hidden rounded-md border border-slate-200">
                      <img src={publicStorageUrl("animal-media", media.storage_path)} alt={media.caption ?? animal.animal_code} className="h-44 w-full object-cover" />
                      <figcaption className="space-y-2 p-2 text-sm text-slate-600">
                        <div>{media.caption ?? (media.is_profile ? "Current profile photo" : "Animal photo")}</div>
                        <div className="grid gap-2">
                          {media.is_profile ? (
                            <span className="rounded-md bg-green-50 px-2 py-1 text-center text-xs font-bold text-green-900">Profile photo</span>
                          ) : (
                            <form action={setAnimalProfilePhoto}>
                              <input type="hidden" name="animalId" value={animal.id} />
                              <input type="hidden" name="mediaId" value={media.id} />
                              <button className="secondary-button w-full" type="submit">Set as profile picture</button>
                            </form>
                          )}
                          <form action={deleteAnimalPhoto}>
                            <input type="hidden" name="animalId" value={animal.id} />
                            <input type="hidden" name="mediaId" value={media.id} />
                            <button className="secondary-button w-full border-red-200 text-red-700 hover:border-red-300 hover:text-red-800" type="submit">Delete photo</button>
                          </form>
                        </div>
                      </figcaption>
                    </figure>
                  ))
                )}
              </div>
            </>
          ) : null}
        </div>
      </section>
      {edit === "1" ? (
        <section className="panel p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-brand-green">Edit animal details</h3>
              <p className="mt-1 text-sm text-slate-600">Update the core animal record. Weight has its own quick form below.</p>
            </div>
            <Link href={profileHref as never} className="secondary-button">Close</Link>
          </div>
          <form action={updateAnimal} className="grid gap-3 sm:grid-cols-2">
            <input type="hidden" name="animalId" value={animal.id} />
            <label>
              <span className="text-sm font-semibold">Animal ID</span>
              <input className="field mt-1" name="animalCode" defaultValue={animal.animal_code} />
            </label>
            <label>
              <span className="text-sm font-semibold">Species</span>
              <select className="field mt-1" name="speciesId" defaultValue={animal.species_id}>
                {farmSpecies.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            </label>
            <label>
              <span className="text-sm font-semibold">Tag number</span>
              <input className="field mt-1" name="tagNumber" defaultValue={animal.tag_number ?? ""} />
            </label>
            <label>
              <span className="text-sm font-semibold">RFID / NFC</span>
              <input className="field mt-1" name="rfidTag" defaultValue={animal.rfid_nfc_tag ?? ""} />
            </label>
            <label>
              <span className="text-sm font-semibold">Breed</span>
              <input className="field mt-1" name="breed" defaultValue={animal.breed ?? ""} />
            </label>
            <label>
              <span className="text-sm font-semibold">Gender</span>
              <select className="field mt-1" name="gender" defaultValue={animal.gender ?? "unknown"}>
                {genderOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <label>
              <span className="text-sm font-semibold">Date of birth</span>
              <DateField className="field mt-1" name="dateOfBirth" defaultValue={animal.date_of_birth ?? ""} />
            </label>
            <label>
              <span className="text-sm font-semibold">Status</span>
              <select className="field mt-1" name="status" defaultValue={animal.status ?? "alive"}>
                {statusOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <label>
              <span className="text-sm font-semibold">Origin</span>
              <select className="field mt-1" name="origin" defaultValue={animal.origin ?? "bred_on_farm"}>
                {originOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <label className="sm:col-span-2">
              <span className="text-sm font-semibold">Notes</span>
              <textarea className="field mt-1 min-h-24" name="notes" defaultValue={animal.notes ?? ""} />
            </label>
            <button className="primary-button sm:w-fit" type="submit">Save changes</button>
          </form>
        </section>
      ) : null}
      <section id="marketplace-listing" className="mt-4">
        {action === "listing" ? (
          <div className="panel p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-brand-green">{activeListing ? "Edit marketplace listing" : "Create marketplace listing"}</h3>
                <p className="mt-1 text-sm text-slate-600">
                  {activeListing ? "Update price, location, negotiation option or remove this listing." : "List this animal publicly with approximate location only."}
                </p>
              </div>
              <Link href={profileHref as never} className="secondary-button">Close</Link>
            </div>
            {activeListing ? (
              <form action={updateMarketplaceListing} className="grid gap-3 sm:grid-cols-2">
                <input type="hidden" name="listingId" value={activeListing.id} />
                <input type="hidden" name="animalId" value={animal.id} />
                <label>
                  <span className="text-sm font-semibold">Listing title</span>
                  <input className="field mt-1" name="title" defaultValue={activeListing.title ?? ""} />
                </label>
                <label>
                  <span className="text-sm font-semibold">Price</span>
                  <input className="field mt-1" name="price" defaultValue={String(activeListing.price ?? "")} />
                </label>
                <label>
                  <span className="text-sm font-semibold">Price option</span>
                  <select className="field mt-1" name="priceNegotiable" defaultValue={activeListing.price_negotiable ? "true" : "false"}>
                    <option value="true">Negotiable - buyers can make offers</option>
                    <option value="false">Not negotiable - buyers contact seller</option>
                  </select>
                </label>
                <label>
                  <span className="text-sm font-semibold">Listing status</span>
                  <select className="field mt-1" name="status" defaultValue={activeListing.status ?? "active"}>
                    <option value="under_review">Send listing</option>
                    <option value="draft">Draft</option>
                    <option value="removed">Remove listing</option>
                  </select>
                  {activeListing.status === "under_review" ? (
                    <span className="mt-1 block text-xs font-semibold text-amber-700">Current status: submitted</span>
                  ) : null}
                  {activeListing.status === "active" ? (
                    <span className="mt-1 block text-xs font-semibold text-green-700">Current status: live</span>
                  ) : null}
                </label>
                <label>
                  <span className="text-sm font-semibold">Province</span>
                  <input className="field mt-1" name="province" defaultValue={activeListing.province ?? ""} />
                </label>
                <label>
                  <span className="text-sm font-semibold">Town</span>
                  <input className="field mt-1" name="town" defaultValue={activeListing.town ?? ""} />
                </label>
                <div className="sm:col-span-2 mt-2 border-t border-slate-200 pt-4">
                  <h3 className="font-bold">Seller contact details</h3>
                  <p className="mt-1 text-sm text-slate-600">These details help buyers contact you quickly.</p>
                </div>
                <label>
                  <span className="text-sm font-semibold">Contact name</span>
                  <input className="field mt-1" name="sellerContactName" defaultValue={activeListing.seller_contact_name ?? ""} />
                </label>
                <label>
                  <span className="text-sm font-semibold">Phone number</span>
                  <input className="field mt-1" name="sellerContactPhone" defaultValue={activeListing.seller_contact_phone ?? ""} />
                </label>
                <label>
                  <span className="text-sm font-semibold">WhatsApp number</span>
                  <input className="field mt-1" name="sellerContactWhatsapp" defaultValue={activeListing.seller_contact_whatsapp ?? ""} />
                </label>
                <label>
                  <span className="text-sm font-semibold">Email address</span>
                  <input className="field mt-1" name="sellerContactEmail" type="email" defaultValue={activeListing.seller_contact_email ?? ""} />
                </label>
                <label className="sm:col-span-2">
                  <span className="text-sm font-semibold">Preferred contact method</span>
                  <select className="field mt-1" name="preferredContactMethod" defaultValue={activeListing.preferred_contact_method ?? "whatsapp"}>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="call">Call</option>
                    <option value="email">Email</option>
                  </select>
                </label>
                <label className="sm:col-span-2">
                  <span className="text-sm font-semibold">Approximate public location</span>
                  <input className="field mt-1" name="approximateLocation" defaultValue={activeListing.approximate_location ?? ""} />
                </label>
                <label className="sm:col-span-2">
                  <span className="text-sm font-semibold">Description</span>
                  <textarea className="field mt-1 min-h-24" name="description" defaultValue={activeListing.description ?? ""} />
                </label>
                <button className="primary-button sm:w-fit" type="submit">Send listing</button>
              </form>
            ) : (
              <form action={createMarketplaceListing} className="grid gap-3 sm:grid-cols-2">
                <input type="hidden" name="animalId" value={animal.id} />
                <label>
                  <span className="text-sm font-semibold">Listing title</span>
                  <input className="field mt-1" name="title" defaultValue={`${species?.name ?? "Animal"} ${animal.breed || ""} ${animal.gender || ""}`.trim()} />
                </label>
                <label>
                  <span className="text-sm font-semibold">Price</span>
                  <input className="field mt-1" name="price" placeholder="e.g. 4800" />
                </label>
                <label>
                  <span className="text-sm font-semibold">Price option</span>
                  <select className="field mt-1" name="priceNegotiable" defaultValue="true">
                    <option value="true">Negotiable - buyers can make offers</option>
                    <option value="false">Not negotiable - buyers contact seller</option>
                  </select>
                </label>
                <label>
                  <span className="text-sm font-semibold">Province</span>
                  <input className="field mt-1" name="province" />
                </label>
                <label>
                  <span className="text-sm font-semibold">Town</span>
                  <input className="field mt-1" name="town" />
                </label>
                <div className="sm:col-span-2 mt-2 border-t border-slate-200 pt-4">
                  <h3 className="font-bold">Seller contact details</h3>
                  <p className="mt-1 text-sm text-slate-600">These details help buyers contact you quickly.</p>
                </div>
                <label>
                  <span className="text-sm font-semibold">Contact name</span>
                  <input className="field mt-1" name="sellerContactName" placeholder="Your name or farm contact" />
                </label>
                <label>
                  <span className="text-sm font-semibold">Phone number</span>
                  <input className="field mt-1" name="sellerContactPhone" placeholder="+27 61 000 0000" />
                </label>
                <label>
                  <span className="text-sm font-semibold">WhatsApp number</span>
                  <input className="field mt-1" name="sellerContactWhatsapp" placeholder="+27 61 000 0000" />
                </label>
                <label>
                  <span className="text-sm font-semibold">Email address</span>
                  <input className="field mt-1" name="sellerContactEmail" type="email" placeholder="seller@example.com" />
                </label>
                <label className="sm:col-span-2">
                  <span className="text-sm font-semibold">Preferred contact method</span>
                  <select className="field mt-1" name="preferredContactMethod" defaultValue="whatsapp">
                    <option value="whatsapp">WhatsApp</option>
                    <option value="call">Call</option>
                    <option value="email">Email</option>
                  </select>
                </label>
                <label className="sm:col-span-2">
                  <span className="text-sm font-semibold">Approximate public location</span>
                  <input className="field mt-1" name="approximateLocation" placeholder="e.g. Limpopo, near Tzaneen" />
                </label>
                <label className="sm:col-span-2">
                  <span className="text-sm font-semibold">Description</span>
                  <textarea className="field mt-1 min-h-24" name="description" placeholder="Describe condition, breed, breeding status, transport notes or seller terms." />
                </label>
                <button className="primary-button sm:w-fit" type="submit">Submit listing</button>
              </form>
            )}
          </div>
        ) : null}
      </section>
      <div id="quick-action" className="mt-4 grid gap-4 lg:grid-cols-2">
        <section className="panel p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-bold">Health records</h3>
              <p className="mt-1 text-sm text-slate-600">Vaccines, treatments, deworming, dipping and vet visits.</p>
            </div>
            <Link href={healthHref as never} className="primary-button">Add health record</Link>
          </div>
          {action === "health" ? (
            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <h4 className="font-bold text-brand-green">New health record</h4>
                <Link href={profileHref as never} className="secondary-button">Close</Link>
              </div>
              <form action={addHealthRecord} className="grid gap-3 sm:grid-cols-2">
                <input type="hidden" name="animalId" value={animal.id} />
                <label>
                  <span className="text-sm font-semibold">Record type</span>
                  <select className="field mt-1" name="recordType">
                    {healthRecordOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </label>
                <label>
                  <span className="text-sm font-semibold">Product / medicine</span>
                  <input className="field mt-1" name="productName" placeholder="e.g. Multivax, Terramycin" />
                </label>
                <label>
                  <span className="text-sm font-semibold">Batch number</span>
                  <input className="field mt-1" name="batchNumber" placeholder="Batch number" />
                </label>
                <label>
                  <span className="text-sm font-semibold">Dosage</span>
                  <input className="field mt-1" name="dosage" placeholder="e.g. 2 ml" />
                </label>
                <label>
                  <span className="text-sm font-semibold">Administered date</span>
                  <DateField className="field mt-1" name="administeredAt" defaultValue={new Date().toISOString().slice(0, 10)} />
                </label>
                <label>
                  <span className="text-sm font-semibold">Next dose</span>
                  <DateField className="field mt-1" name="dueAt" />
                </label>
                <label>
                  <span className="text-sm font-semibold">Withdrawal days</span>
                  <input className="field mt-1" name="withdrawalDays" placeholder="e.g. 14" />
                </label>
                <label className="sm:col-span-2">
                  <span className="text-sm font-semibold">Notes</span>
                  <textarea className="field mt-1 min-h-20" name="notes" placeholder="Vet notes, symptoms, response or reminder details" />
                </label>
                <button className="primary-button sm:w-fit" type="submit">Save health record</button>
              </form>
            </div>
          ) : null}
        </section>
        <section className="panel p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-bold">Weight tracking</h3>
              <p className="mt-1 text-sm text-slate-600">
                Current weight: {animal.current_weight_kg ? `${animal.current_weight_kg} kg` : "Not set"}
              </p>
            </div>
            <Link href={weightHref as never} className="primary-button">Add weight</Link>
          </div>
          {action === "weight" ? (
            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <h4 className="font-bold text-brand-green">Record weight</h4>
                <Link href={profileHref as never} className="secondary-button">Close</Link>
              </div>
              <form action={addWeightRecord} className="space-y-3">
                <input type="hidden" name="animalId" value={animal.id} />
                <label className="block">
                  <span className="text-sm font-semibold">Weight in kg</span>
                  <input className="field mt-1" name="weightKg" placeholder="e.g. 82" />
                </label>
                <label className="block">
                  <span className="text-sm font-semibold">Measured date</span>
                  <DateField className="field mt-1" name="measuredAt" defaultValue={new Date().toISOString().slice(0, 10)} />
                </label>
                <label className="block">
                  <span className="text-sm font-semibold">Notes</span>
                  <input className="field mt-1" name="notes" placeholder="Optional" />
                </label>
                <button className="primary-button w-full" type="submit">Record weight</button>
              </form>
            </div>
          ) : null}
        </section>
      </div>
      <section className="panel mt-4 p-5">
        <h3 className="font-bold">History</h3>
        <div className="mt-4 grid gap-4 xl:grid-cols-3">
          <div>
            <h4 className="text-sm font-bold">Health history</h4>
            <div className="mt-2 space-y-2">
              {(healthRecords ?? []).length === 0 ? (
                <p className="rounded-md border border-slate-200 p-3 text-sm text-slate-500">No health records yet.</p>
              ) : (
                healthRecords?.map((record) => (
                  <div key={record.id} className="rounded-md border border-slate-200 p-3 text-sm">
                    <div className="font-semibold">{optionLabel(healthRecordOptions, record.record_type)} · Administered: {record.administered_at}</div>
                    <div className="mt-1 text-slate-600">
                      {[record.product_name, record.dosage, record.batch_number ? `Batch ${record.batch_number}` : null].filter(Boolean).join(" · ") || "No product details"}
                    </div>
                    <div className="mt-1 text-slate-500">
                      {record.withdrawal_period_days ? `Withdrawal: ${record.withdrawal_period_days} days` : "No withdrawal period"}
                      {record.due_at ? ` · Next dose: ${record.due_at}` : ""}
                    </div>
                    {record.notes ? <div className="mt-1 text-slate-500">{record.notes}</div> : null}
                  </div>
                ))
              )}
            </div>
          </div>
          <div>
            <h4 className="text-sm font-bold">Weight history</h4>
            <div className="mt-2 space-y-2">
              {(weightRecords ?? []).length === 0 ? (
                <p className="rounded-md border border-slate-200 p-3 text-sm text-slate-500">No weight history yet.</p>
              ) : (
                weightRecords?.map((record) => (
                  <div key={record.id} className="rounded-md border border-slate-200 p-3 text-sm">
                    <div className="font-semibold">{record.weight_kg} kg</div>
                    <div className="text-slate-500">{record.measured_at}{record.notes ? ` · ${record.notes}` : ""}</div>
                  </div>
                ))
              )}
            </div>
          </div>
          <div>
            <h4 className="text-sm font-bold">Breeding history</h4>
            <div className="mt-2 space-y-2">
              {(breedingRecords ?? []).length === 0 ? (
                <p className="rounded-md border border-slate-200 p-3 text-sm text-slate-500">No breeding history yet.</p>
              ) : (
                breedingRecords?.map((record) => {
                  const female = Array.isArray(record.female) ? record.female[0] : record.female;
                  const male = Array.isArray(record.male) ? record.male[0] : record.male;
                  return (
                    <div key={record.id} className="rounded-md border border-slate-200 p-3 text-sm">
                      <div className="font-semibold">{optionLabel(breedingRecordOptions, record.record_type)} · {record.event_date}</div>
                      <div className="mt-1 text-slate-600">
                        Dam: {female?.animal_code ?? "Not set"}
                        {male?.animal_code ? ` · Sire: ${male.animal_code}` : " · Sire: Not set"}
                      </div>
                      <div className="mt-1 text-slate-500">
                        {record.pregnancy_status ? `Pregnancy: ${record.pregnancy_status.replace("_", " ")}` : "Pregnancy: not checked"}
                        {record.expected_birth_date ? ` · Expected birth: ${record.expected_birth_date}` : ""}
                      </div>
                      {record.notes ? <div className="mt-1 text-slate-500">{record.notes}</div> : null}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </section>
      <section className="panel mt-4 p-5">
        <h3 className="font-bold">Offspring</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {(offspring ?? []).length === 0 ? (
            <p className="text-sm text-slate-500">No offspring linked to this animal yet.</p>
          ) : (
            offspring?.map((baby) => {
              const babySpecies = Array.isArray(baby.species) ? baby.species[0] : baby.species;
              return (
                <Link key={baby.id} href={`/animals/${baby.id}` as never} className="rounded-md border border-slate-200 p-3 text-sm transition hover:border-brand-green">
                  <div className="font-semibold">{baby.animal_code}</div>
                  <div className="mt-1 text-slate-600">
                    {babySpecies?.name ?? "Animal"} · {optionLabel(genderOptions, baby.gender)}
                  </div>
                  <div className="mt-1 text-slate-500">
                    {baby.age_category ?? "Young animal"}{baby.date_of_birth ? ` · Born ${baby.date_of_birth}` : ""}
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </section>
      <section className="panel mt-4 p-5">
        <h3 className="font-bold">Finance history</h3>
        <div className="mt-4 space-y-2">
          {(financeRecords ?? []).length === 0 ? (
            <p className="text-sm text-slate-500">No finance transactions linked to this animal yet.</p>
          ) : (
            financeRecords?.map((record) => {
              const isExpense = expenseTransactionTypes.has(record.transaction_type);
              return (
                <div key={record.id} className="rounded-md border border-slate-200 p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="font-semibold">{optionLabel(financeTransactionOptions, record.transaction_type)} · {record.description}</div>
                    <div className={isExpense ? "font-bold text-red-700" : "font-bold text-brand-green"}>
                      {isExpense ? "-" : "+"}{money(Number(record.amount))}
                    </div>
                  </div>
                  <div className="mt-1 text-slate-500">
                    {record.invoice_number ? `Invoice ${record.invoice_number}` : "No invoice"}
                    {record.paid_at ? ` · Paid ${record.paid_at}` : ""}
                    {record.due_at ? ` · Due ${record.due_at}` : ""}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </AppShell>
  );
}
