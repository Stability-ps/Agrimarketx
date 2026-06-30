"use client";

import Link from "next/link";
import type { Route } from "next";
import { MapPin, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { MarketplaceShareButton } from "@/components/MarketplaceShareButton";
import { SaveListingButton } from "@/components/SaveListingButton";
import { formatRand } from "@/lib/format";
import { publicStorageUrl } from "@/lib/files";
import { formatDistanceKm } from "@/lib/location-distance";
import { marketplaceCategoryLabel } from "@/lib/marketplace-categories";

type FeaturedListing = {
  id: string;
  title: string;
  price: number | null;
  category: string | null;
  province: string | null;
  town: string | null;
  approximate_location: string | null;
  distance_km?: number | null;
  marketplace_listing_media?: Array<{
    storage_path: string | null;
    media_type: string | null;
    is_primary: boolean | null;
  }> | null;
  animals?: {
    breed?: string | null;
    gender?: string | null;
    animal_media?: Array<{
      storage_path: string | null;
      media_type: string | null;
      is_profile: boolean | null;
    }> | null;
  } | Array<{
    breed?: string | null;
    gender?: string | null;
    animal_media?: Array<{
      storage_path: string | null;
      media_type: string | null;
      is_profile: boolean | null;
    }> | null;
  }> | null;
};

function firstPhoto(listing: FeaturedListing) {
  const listingMedia = Array.isArray(listing.marketplace_listing_media) ? listing.marketplace_listing_media : [];
  const animal = Array.isArray(listing.animals) ? listing.animals[0] : listing.animals;
  const animalPhotos = Array.isArray(animal?.animal_media)
    ? animal.animal_media.filter((item) => item.media_type === "photo")
    : [];
  const photo = listingMedia.find((item) => item.media_type === "photo" && item.is_primary) ?? listingMedia.find((item) => item.media_type === "photo") ?? animalPhotos[0];
  const bucket = listingMedia.includes(photo as never) ? "farm-assets" : "animal-media";

  return photo?.storage_path ? publicStorageUrl(bucket, photo.storage_path) : "";
}

function promoBadge(index: number) {
  if (index % 3 === 0) {
    return { label: "Urgent", className: "bg-red-600 text-white" };
  }

  if (index % 3 === 1) {
    return { label: "Premium", className: "bg-blue-600 text-white" };
  }

  return { label: "Featured", className: "bg-brand-green text-white" };
}

export function FeaturedListingsCarousel({
  listings,
  returnPath
}: {
  listings: FeaturedListing[];
  returnPath: string;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const featuredListings = useMemo(() => listings.slice(0, 8), [listings]);

  useEffect(() => {
    if (paused || featuredListings.length < 2) {
      return;
    }

    const timer = window.setInterval(() => {
      const scroller = scrollerRef.current;
      if (!scroller) {
        return;
      }

      const firstCard = scroller.querySelector<HTMLElement>("[data-featured-card]");
      const scrollBy = firstCard ? firstCard.offsetWidth + 8 : Math.round(scroller.clientWidth * 0.32);
      const nearEnd = scroller.scrollLeft + scroller.clientWidth + scrollBy >= scroller.scrollWidth;

      scroller.scrollTo({
        left: nearEnd ? 0 : scroller.scrollLeft + scrollBy,
        behavior: "smooth"
      });
    }, 3000);

    return () => window.clearInterval(timer);
  }, [featuredListings.length, paused]);

  if (featuredListings.length === 0) {
    return null;
  }

  return (
    <section className="mb-5 overflow-hidden border-b border-slate-200 bg-white pb-4 lg:rounded-xl lg:border lg:border-green-100 lg:bg-[#F8F9FA] lg:p-4 lg:shadow-soft">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-brand-navy">Featured Listings</h2>
          <p className="mt-1 hidden text-sm text-slate-600 sm:block">Premium marketplace picks from verified sellers.</p>
        </div>
        <Link href="/marketplace?featured=1" className="text-sm font-bold text-brand-green">See all</Link>
      </div>
      <div
        ref={scrollerRef}
        className="no-scrollbar flex snap-x snap-mandatory gap-2 overflow-x-auto scroll-smooth pb-1 [-webkit-overflow-scrolling:touch] lg:gap-4"
        onPointerDown={() => setPaused(true)}
        onPointerUp={() => setPaused(false)}
        onPointerCancel={() => setPaused(false)}
        onTouchStart={() => setPaused(true)}
        onTouchEnd={() => setPaused(false)}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {featuredListings.map((listing, index) => {
          const imageUrl = firstPhoto(listing);
          const location = listing.approximate_location || [listing.town, listing.province].filter(Boolean).join(", ") || "South Africa";
          const detailHref = `/marketplace/${listing.id}?returnTo=${encodeURIComponent(returnPath)}`;
          const promo = promoBadge(index);

          return (
            <article
              key={listing.id}
              data-featured-card
              className="group relative min-w-[31%] max-w-[31%] snap-start overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-0.5 hover:scale-[1.01] hover:border-green-200 hover:shadow-[0_14px_32px_rgba(46,125,50,0.12)] sm:min-w-[30%] sm:max-w-[30%] lg:min-w-[31%] lg:max-w-none xl:min-w-[24%]"
            >
              <Link href={detailHref as Route} className="absolute inset-0 z-10" aria-label={`Open ${listing.title}`} />
              <div className="relative">
                {imageUrl ? (
                  <img src={imageUrl} alt={listing.title} className="h-24 w-full object-cover sm:h-28 lg:h-44" loading={index < 3 ? "eager" : "lazy"} decoding="async" />
                ) : (
                  <div className="grid h-24 place-items-center bg-green-50 px-2 text-center text-[11px] font-bold text-brand-green sm:h-28 lg:h-44">Featured listing</div>
                )}
                <span className={`absolute left-1.5 top-1.5 z-20 rounded-md px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide shadow-sm sm:left-2 sm:top-2 sm:text-[10px] ${promo.className}`}>
                  {promo.label}
                </span>
                <span className="absolute bottom-1.5 left-1.5 z-20 inline-flex items-center gap-0.5 rounded-full bg-brand-green px-1.5 py-0.5 text-[9px] font-bold text-white sm:left-2 sm:text-[10px]">
                  <ShieldCheck size={10} />
                  <span className="hidden sm:inline">Verified</span>
                </span>
                <div className="absolute right-1 top-1 z-20 flex origin-top-right scale-75 gap-1 sm:right-2 sm:top-2 sm:scale-90 lg:scale-100 lg:gap-2">
                  <MarketplaceShareButton title={listing.title} url={`/marketplace/${listing.id}`} listingId={listing.id} />
                  <SaveListingButton listingId={listing.id} />
                </div>
              </div>
              <div className="relative p-2 sm:p-3 lg:p-4">
                <p className="line-clamp-2 text-xs font-bold leading-snug text-brand-navy group-hover:text-brand-green sm:text-sm lg:text-base">{listing.title}</p>
                <p className="mt-1 flex min-w-0 items-center gap-1 text-[10px] text-slate-600 sm:text-xs lg:text-sm">
                  <MapPin size={12} className="shrink-0" />
                  <span className="truncate">{location}</span>
                </p>
                {listing.distance_km !== null && listing.distance_km !== undefined ? (
                  <p className="mt-1 text-[10px] font-bold text-brand-green sm:text-xs">{formatDistanceKm(listing.distance_km)}</p>
                ) : null}
                <p className="mt-1 line-clamp-1 text-[10px] text-slate-500 sm:text-xs lg:text-sm">{marketplaceCategoryLabel(listing.category)}</p>
                <p className="mt-2 text-sm font-black text-brand-green sm:text-base lg:text-xl">{formatRand(listing.price)}</p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
