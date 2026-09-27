import { NextResponse } from "next/server";
import { recordListingMetric } from "@/lib/listing-metrics";

export async function POST(request: Request) {
  const { listingId, metric } = await request.json().catch(() => ({}));

  if (!listingId || !metric) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  // Validation, per-client rate limiting and the privileged RPC call all
  // happen server-side; over-limit events are silently not counted.
  await recordListingMetric(listingId, metric);

  return NextResponse.json({ ok: true });
}
