"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Maximize2, X } from "lucide-react";

export type ListingGalleryPhoto = {
  url: string;
  alt: string;
};

export function ListingImageGallery({ photos, title }: { photos: ListingGalleryPhoto[]; title: string }) {
  const safePhotos = useMemo(() => photos.filter((photo) => photo.url), [photos]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const activePhoto = safePhotos[activeIndex];

  function move(direction: -1 | 1) {
    if (safePhotos.length < 2) {
      return;
    }
    setActiveIndex((current) => (current + direction + safePhotos.length) % safePhotos.length);
  }

  useEffect(() => {
    if (!isLightboxOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsLightboxOpen(false);
      }
      if (event.key === "ArrowLeft") {
        move(-1);
      }
      if (event.key === "ArrowRight") {
        move(1);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isLightboxOpen, safePhotos.length]);

  if (!activePhoto) {
    return (
      <section className="overflow-hidden rounded-md border border-slate-200 bg-white">
        <div className="grid aspect-[4/3] place-items-center bg-green-50 text-sm font-bold text-brand-green sm:aspect-[16/10]">
          No photo uploaded
        </div>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-md border border-slate-200 bg-white">
      <div className="group relative aspect-[4/3] bg-slate-100 sm:aspect-[16/10]">
        <button
          type="button"
          onClick={() => setIsLightboxOpen(true)}
          className="block h-full w-full"
          aria-label={`Open photo gallery for ${title}`}
        >
          <img src={activePhoto.url} alt={activePhoto.alt || title} className="h-full w-full object-cover" />
        </button>
        <div className="absolute left-3 top-3 rounded-full bg-black/65 px-3 py-1 text-xs font-bold text-white">
          {activeIndex + 1} / {safePhotos.length}
        </div>
        <button
          type="button"
          onClick={() => setIsLightboxOpen(true)}
          className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-white/95 text-brand-navy shadow-soft"
          aria-label="View fullscreen"
        >
          <Maximize2 size={18} />
        </button>
        {safePhotos.length > 1 ? (
          <>
            <button
              type="button"
              onClick={() => move(-1)}
              className="absolute left-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-brand-navy shadow-soft"
              aria-label="Previous photo"
            >
              <ChevronLeft size={22} />
            </button>
            <button
              type="button"
              onClick={() => move(1)}
              className="absolute right-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-brand-navy shadow-soft"
              aria-label="Next photo"
            >
              <ChevronRight size={22} />
            </button>
          </>
        ) : null}
      </div>
      {safePhotos.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto p-3">
          {safePhotos.map((photo, index) => (
            <button
              key={`${photo.url}-${index}`}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`h-20 w-24 shrink-0 overflow-hidden rounded-md border ${
                index === activeIndex ? "border-brand-green ring-2 ring-green-100" : "border-slate-200"
              }`}
              aria-label={`Show photo ${index + 1}`}
            >
              <img src={photo.url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      ) : null}

      {isLightboxOpen ? (
        <div className="fixed inset-0 z-[90] bg-black/95 p-4 text-white" role="dialog" aria-modal="true">
          <div className="mx-auto flex h-full max-w-6xl flex-col">
            <div className="flex items-center justify-between gap-3 pb-3">
              <p className="text-sm font-bold">{activeIndex + 1} / {safePhotos.length}</p>
              <button
                type="button"
                onClick={() => setIsLightboxOpen(false)}
                className="grid h-11 w-11 place-items-center rounded-full bg-white/10"
                aria-label="Close gallery"
              >
                <X size={22} />
              </button>
            </div>
            <div className="relative min-h-0 flex-1">
              <img src={activePhoto.url} alt={activePhoto.alt || title} className="h-full w-full object-contain" />
              {safePhotos.length > 1 ? (
                <>
                  <button
                    type="button"
                    onClick={() => move(-1)}
                    className="absolute left-0 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/15"
                    aria-label="Previous photo"
                  >
                    <ChevronLeft size={26} />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(1)}
                    className="absolute right-0 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/15"
                    aria-label="Next photo"
                  >
                    <ChevronRight size={26} />
                  </button>
                </>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
