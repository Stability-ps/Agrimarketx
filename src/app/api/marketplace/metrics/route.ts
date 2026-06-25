import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const { listingId, metric } = await request.json().catch(() => ({}));

  if (!listingId || !metric) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const supabase = await createClient();
  await supabase.rpc("increment_listing_metric", {
    listing_id: listingId,
    metric
  });

  return NextResponse.json({ ok: true });
}
