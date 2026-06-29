"use client";

import Link from "next/link";
import type { Route } from "next";
import { MapPin, ShieldCheck, Sparkles } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { MarketplaceShareButton } from "@/components/MarketplaceShareButton";
import { SaveListingButton } from "@/components/SaveListingButton";
import { formatRand } from "@/lib/format";
import { publicStorageUrl } from "@/lib/files";
import { marketplaceCategoryLabel } from "@/lib/marketplace-categories";

type FeaturedListing = {
  id: string;
  title: string;
  price: number | null;
  category: string | null;
  province: string | null;
  town: string | null;
  approximate_location: string | null;
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
      const scrollBy = firstCard ? firstCard.offsetWidth + 16 : Math.round(scroller.clientWidth * 0.85);
      const nearEnd = scroller.scrollLeft + scroller.clientWidth + scrollBy >= scroller.scrollWidth;

      scroller.scrollTo({
        left: nearEnd ? 0 : scroller.scrollLeft + scrollBy,
        behavior: "smooth"
      });
    }, 5000);

    return () => window.clearInterval(timer);
  }, [featuredListings.length, paused]);

  if (featuredListings.length === 0) {
    return null;
  }

  return (
    <section className="mb-5 overflow-hidden rounded-xl border border-green-100 bg-gradient-to-br from-[#F8F9FA] via-white to-green-50 p-4 shadow-soft">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-xs font-bold text-amber-800">
            <Sparkles size={13} />
            Featured
          </p>
          <h2 className="mt-2 text-xl font-bold text-brand-navy">Featured Listings</h2>
          <p className="mt-1 text-sm text-slate-600">Premium marketplace picks from verified sellers.</p>
        </div>
        <Link href="/marketplace?featured=1" className="hidden text-sm font-bold text-brand-green sm:block">View all</Link>
      </div>
      <div
        ref={scrollerRef}
        className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-1 [-webkit-overflow-scrolling:touch]"
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

          return (
            <article
              key={listing.id}
              data-featured-card
              className="group relative min-w-[82%] snap-start overflow-hidden rounded-xl border border-amber-200 bg-white shadow-[0_18px_45px_rgba(46,125,50,0.12)] ring-1 ring-green-100 transition duration-300 hover:-translate-y-0.5 hover:scale-[1.01] hover:shadow-[0_22px_55px_rgba(46,125,50,0.18)] sm:min-w-[45%] lg:min-w-[31%] xl:min-w-[24%]"
            >
              <Link href={detailHref as Route} className="absolute inset-0 z-10" aria-label={`Open ${listing.title}`} />
              <div className="relative">
                {imageUrl ? (
                  <img src={imageUrl} alt={listing.title} className="h-44 w-full object-cover" loading={index < 2 ? "eager" : "lazy"} decoding="async" />
                ) : (
                  <div className="grid h-44 place-items-center bg-green-50 text-sm font-bold text-brand-green">Featured listing</div>
                )}
                <span className="absolute left-3 top-3 z-20 rounded-r-full bg-amber-400 px-3 py-1 text-xs font-black uppercase tracking-wide text-amber-950 shadow-sm">
                  Featured
                </span>
                <span className="absolute left-3 top-11 z-20 inline-flex items-center gap-1 rounded-full bg-brand-green px-2 py-1 text-xs font-bold text-white">
                  <ShieldCheck size={13} />
                  Verified
                </span>
                <div className="absolute right-3 top-3 z-20 flex gap-2">
                  <MarketplaceShareButton title={listing.title} url={`/marketplace/${listing.id}`} listingId={listing.id} />
                  <SaveListingButton listingId={listing.id} />
                </div>
              </div>
              <div className="relative p-4">
                <p className="line-clamp-2 font-bold text-brand-navy group-hover:text-brand-green">{listing.title}</p>
                <p className="mt-2 flex min-w-0 items-center gap-1 text-sm text-slate-600">
                  <MapPin size={14} className="shrink-0" />
                  <span className="truncate">{location}</span>
                </p>
                <p className="mt-2 line-clamp-1 text-sm text-slate-500">{marketplaceCategoryLabel(listing.category)}</p>
                <p className="mt-3 text-xl font-black text-brand-green">{formatRand(listing.price)}</p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
