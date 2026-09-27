import { checkRateLimit, clientIp } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";

export const LISTING_METRICS = ["view", "contact", "whatsapp", "call", "chat", "share", "similar"] as const;
export type ListingMetric = (typeof LISTING_METRICS)[number];

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isListingMetric(value: unknown): value is ListingMetric {
  return typeof value === "string" && (LISTING_METRICS as readonly string[]).includes(value);
}

/**
 * Records a listing analytics event server-side. increment_listing_metric is
 * callable only by the service role, so clients cannot inflate counters
 * directly; each IP may count a given metric on a given listing a limited
 * number of times per hour. Never throws: analytics must not break pages.
 */
export async function recordListingMetric(listingId: unknown, metric: unknown) {
  if (typeof listingId !== "string" || !UUID_PATTERN.test(listingId) || !isListingMetric(metric)) {
    return false;
  }

  const allowed = await checkRateLimit("listingMetric", `${await clientIp()}:${listingId}:${metric}`);

  if (!allowed) {
    return false;
  }

  try {
    const { error } = await createAdminClient().rpc("increment_listing_metric", {
      listing_id: listingId,
      metric
    });

    if (error) {
      console.error(`[listing-metric] ${metric}: ${error.message}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error(`[listing-metric] ${metric}:`, error);
    return false;
  }
}
