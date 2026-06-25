"use client";

import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function SaveListingButton({ listingId, initiallySaved = false }: { listingId: string; initiallySaved?: boolean }) {
  const router = useRouter();
  const [saved, setSaved] = useState(initiallySaved);
  const [busy, setBusy] = useState(false);

  async function toggleSaved(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();

    if (busy) {
      return;
    }

    setBusy(true);
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login?next=%2Fmarketplace");
      return;
    }

    if (saved) {
      await supabase
        .from("marketplace_saved_listings")
        .delete()
        .eq("user_id", user.id)
        .eq("listing_id", listingId);
      setSaved(false);
    } else {
      await supabase
        .from("marketplace_saved_listings")
        .upsert({ user_id: user.id, listing_id: listingId }, { onConflict: "user_id,listing_id" });
      setSaved(true);
    }

    setBusy(false);
  }

  return (
    <button
      className={`grid h-9 w-9 place-items-center rounded-full border bg-white/95 shadow-soft transition hover:border-brand-green ${
        saved ? "border-red-200 text-red-600" : "border-slate-200 text-slate-600"
      }`}
      type="button"
      disabled={busy}
      onClick={toggleSaved}
      aria-label={saved ? "Remove from favourites" : "Save to favourites"}
    >
      <Heart size={18} fill={saved ? "currentColor" : "none"} />
    </button>
  );
}
