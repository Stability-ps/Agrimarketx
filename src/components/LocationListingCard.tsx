import Link from "next/link";
import { MapPin } from "lucide-react";
import { publicStorageUrl } from "@/lib/files";
import { formatRand } from "@/lib/format";
import { marketplaceCategoryLabel } from "@/lib/marketplace-categories";

export function LocationListingCard({ listing }: { listing: any }) {
  const animal = Array.isArray(listing.animals) ? listing.animals[0] : listing.animals;
  const species = Array.isArray(animal?.species) ? animal?.species[0] : animal?.species;
  const listingMedia = Array.isArray(listing.marketplace_listing_media) ? listing.marketplace_listing_media : [];
  const animalPhotos = Array.isArray(animal?.animal_media)
    ? animal.animal_media
        .filter((item: any) => item.media_type === "photo")
        .sort((a: any, b: any) => Number(Boolean(b.is_profile)) - Number(Boolean(a.is_profile)) || String(b.created_at).localeCompare(String(a.created_at)))
    : [];
  const photo = listingMedia.find((item: any) => item.media_type === "photo" && item.is_primary) ?? listingMedia.find((item: any) => item.media_type === "photo") ?? animalPhotos[0];
  const bucket = listingMedia.includes(photo) ? "farm-assets" : "animal-media";
  const location = listing.approximate_location || [listing.town, listing.province].filter(Boolean).join(", ") || "Location not set";

  return (
    <Link href={`/marketplace/${listing.id}` as never} className="overflow-hidden rounded-md border border-slate-200 bg-white transition hover:border-brand-green">
      {photo?.storage_path ? (
        <img src={publicStorageUrl(bucket, photo.storage_path)} alt={listing.title} className="h-36 w-full object-cover" />
      ) : (
        <div className="grid h-36 place-items-center bg-green-50 text-sm font-bold text-brand-green">No photo</div>
      )}
      <div className="p-3">
        <p className="line-clamp-2 font-bold text-brand-navy">{listing.title}</p>
        <p className="mt-1 line-clamp-1 text-sm text-slate-600">
          {marketplaceCategoryLabel(listing.category)}{species?.name ? ` · ${species.name}` : ""}
        </p>
        <p className="mt-1 flex min-w-0 items-start gap-1 text-sm text-slate-600">
          <MapPin className="mt-0.5 shrink-0" size={14} />
          <span className="break-words">{location}</span>
        </p>
        <p className="mt-2 font-bold text-brand-green">{formatRand(listing.price)}</p>
      </div>
    </Link>
  );
}
