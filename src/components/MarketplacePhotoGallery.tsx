"use client";

import { useState } from "react";
import { X } from "lucide-react";

type MarketplacePhoto = {
  url: string;
  alt: string;
};

export function MarketplacePhotoGallery({
  title,
  photos
}: {
  title: string;
  photos: MarketplacePhoto[];
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(0);
  const count = photos.length || 1;

  return (
    <>
      <button
        className="absolute bottom-3 left-3 rounded-full bg-black/70 px-3 py-1 text-xs font-bold text-white transition hover:bg-black"
        type="button"
        onClick={() => setOpen(true)}
      >
        {count} photo{count === 1 ? "" : "s"}
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 bg-black/75 p-4">
          <div className="mx-auto flex h-full max-w-5xl flex-col rounded-lg bg-white">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-slate-500">{count} photo{count === 1 ? "" : "s"}</p>
                <h3 className="font-bold text-brand-navy">{title}</h3>
              </div>
              <button
                className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 text-slate-600 hover:border-brand-green hover:text-brand-green"
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close photos"
              >
                <X size={20} />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-auto p-4">
              {photos[selected] ? (
                <img
                  src={photos[selected].url}
                  alt={photos[selected].alt}
                  className="mx-auto max-h-[62vh] w-full rounded-lg object-contain"
                />
              ) : null}
              {photos.length > 1 ? (
                <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
                  {photos.map((photo, index) => (
                    <button
                      key={photo.url}
                      className={`overflow-hidden rounded-md border bg-white ${selected === index ? "border-brand-green ring-2 ring-green-100" : "border-slate-200"}`}
                      type="button"
                      onClick={() => setSelected(index)}
                    >
                      <img src={photo.url} alt={photo.alt} className="h-20 w-full object-cover" />
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
