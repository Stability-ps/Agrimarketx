"use client";

import { Share2 } from "lucide-react";

export function MarketplaceShareButton({
  title,
  url,
  listingId
}: {
  title: string;
  url: string;
  listingId?: string;
}) {
  async function shareListing() {
    const shareUrl = new URL(url, window.location.origin).toString();

    if (listingId) {
      await fetch("/api/marketplace/metrics", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ listingId, metric: "share" })
      }).catch(() => null);
    }

    if (navigator.share) {
      await navigator.share({
        title,
        text: `View this marketplace listing on AgriMarketX: ${title}`,
        url: shareUrl
      });
      return;
    }

    await navigator.clipboard.writeText(shareUrl);
    window.alert("Listing link copied.");
  }

  return (
    <button
      className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-white/95 text-slate-700 shadow-soft transition hover:border-brand-green hover:text-brand-green"
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        void shareListing();
      }}
      aria-label="Share listing"
    >
      <Share2 size={18} />
    </button>
  );
}
