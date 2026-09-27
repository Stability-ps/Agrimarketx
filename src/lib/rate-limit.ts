import { createHash } from "crypto";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Abuse limits for public / high-cost flows. Counters live in Postgres
 * (public.rate_limit_buckets via consume_rate_limit), so they are shared by
 * every serverless instance. Keys are SHA-256 hashes of action + IP/user, so
 * no raw IP addresses, emails or phone numbers are stored.
 *
 * Documented limits (per window, per client IP unless noted):
 *   phoneOtpSend      5 / hour   per user
 *   phoneOtpVerify   10 / hour   per user
 *   diditSession      5 / hour   per user
 *   contactForm       5 / hour
 *   guestEnquiry     10 / hour
 *   listingReport    10 / hour
 *   contactReveal    30 / hour
 *   listingMetric    10 / hour   per IP + listing + metric
 *   signup            5 / hour
 */
export const RATE_LIMITS = {
  phoneOtpSend: { limit: 5, windowSeconds: 3600 },
  phoneOtpVerify: { limit: 10, windowSeconds: 3600 },
  diditSession: { limit: 5, windowSeconds: 3600 },
  contactForm: { limit: 5, windowSeconds: 3600 },
  guestEnquiry: { limit: 10, windowSeconds: 3600 },
  listingReport: { limit: 10, windowSeconds: 3600 },
  contactReveal: { limit: 30, windowSeconds: 3600 },
  listingMetric: { limit: 10, windowSeconds: 3600 },
  signup: { limit: 5, windowSeconds: 3600 }
} as const;

export type RateLimitAction = keyof typeof RATE_LIMITS;

export const RATE_LIMIT_MESSAGE = "Too many attempts. Please wait a while and try again.";

export async function clientIp() {
  const headerStore = await headers();
  const forwarded = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim();

  return forwarded || headerStore.get("x-real-ip") || "unknown";
}

/**
 * Consumes one hit for `action`. Returns false when the caller is over the
 * limit. `subject` defaults to the client IP; pass a user id for per-user
 * limits. Fails open (returns true) if the limiter itself is unavailable so a
 * database hiccup never locks legitimate users out.
 */
export async function checkRateLimit(action: RateLimitAction, subject?: string) {
  const { limit, windowSeconds } = RATE_LIMITS[action];
  const identity = subject ?? (await clientIp());
  const keyHash = createHash("sha256").update(`${action}:${identity}`).digest("hex");

  try {
    const { data, error } = await createAdminClient().rpc("consume_rate_limit", {
      p_key_hash: keyHash,
      p_limit: limit,
      p_window_seconds: windowSeconds
    });

    if (error) {
      console.error(`[rate-limit] ${action}: ${error.message}`);
      return true;
    }

    return data !== false;
  } catch (error) {
    console.error(`[rate-limit] ${action}:`, error);
    return true;
  }
}
