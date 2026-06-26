import crypto from "crypto";

export type SellerVerificationStatus = "not_started" | "pending" | "approved" | "declined" | "resubmission_required";

type DiditSessionInput = {
  userId: string;
  email?: string | null;
  fullName?: string | null;
};

type DiditStatusResult = {
  sessionId: string | null;
  userId: string | null;
  eventId: string | null;
  eventType: string | null;
  status: SellerVerificationStatus;
  decision: string | null;
  score: number | null;
};

function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://agrimarketx.co.za").replace(/\/$/, "");
}

function apiBaseUrl() {
  return (process.env.DIDIT_API_BASE_URL || "https://verification.didit.me").replace(/\/$/, "");
}

function workflowId() {
  return process.env.DIDIT_WORKFLOW_ID || process.env.DIDIT_VERIFICATION_WORKFLOW_ID;
}

function requireDiditConfig() {
  const apiKey = process.env.DIDIT_API_KEY;
  const configuredWorkflowId = workflowId();

  if (!apiKey) {
    throw new Error("Missing DIDIT_API_KEY.");
  }

  if (!configuredWorkflowId) {
    throw new Error("Missing DIDIT_WORKFLOW_ID.");
  }

  return { apiKey, workflowId: configuredWorkflowId };
}

function pickString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function valueFromPath(payload: Record<string, unknown>, paths: string[]) {
  for (const path of paths) {
    const value = path.split(".").reduce<unknown>((current, key) => {
      if (!current || typeof current !== "object") {
        return null;
      }

      return (current as Record<string, unknown>)[key];
    }, payload);

    const text = pickString(value);
    if (text) {
      return text;
    }
  }

  return null;
}

export async function createDiditVerificationSession(input: DiditSessionInput) {
  const config = requireDiditConfig();
  const response = await fetch(`${apiBaseUrl()}/v3/session/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": config.apiKey
    },
    body: JSON.stringify({
      workflow_id: config.workflowId,
      vendor_data: input.userId,
      callback: `${siteUrl()}/seller/verification?didit=return`,
      metadata: {
        user_id: input.userId,
        email: input.email,
        full_name: input.fullName,
        platform: "AgriMarketX"
      }
    })
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = typeof payload?.message === "string" ? payload.message : "Could not create Didit verification session.";
    throw new Error(message);
  }

  const sessionId = valueFromPath(payload, ["id", "session_id", "session.id", "data.id", "data.session_id"]);
  const verificationUrl = valueFromPath(payload, [
    "url",
    "verification_url",
    "session_url",
    "redirect_url",
    "data.url",
    "data.verification_url",
    "data.session_url",
    "data.redirect_url"
  ]);

  if (!sessionId || !verificationUrl) {
    throw new Error("Didit did not return a usable verification URL.");
  }

  return { sessionId, verificationUrl, payload };
}

function secureCompare(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);

  if (left.length !== right.length) {
    return false;
  }

  return crypto.timingSafeEqual(left, right);
}

function hmacHex(secret: string, value: string) {
  return crypto.createHmac("sha256", secret).update(value).digest("hex");
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableJson).join(",")}]`;
  }

  if (value && typeof value === "object") {
    return `{${Object.keys(value as Record<string, unknown>)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableJson((value as Record<string, unknown>)[key])}`)
      .join(",")}}`;
  }

  return JSON.stringify(value);
}

function cleanSignature(signature: string | null) {
  return signature?.replace(/^sha256=/, "").trim() ?? null;
}

export function verifyDiditWebhookSignature({
  rawBody,
  signatureV2,
  timestamp,
  signature,
  signatureSimple,
  secret
}: {
  rawBody: string;
  signatureV2: string | null;
  timestamp: string | null;
  signature: string | null;
  signatureSimple?: string | null;
  secret: string | undefined;
}) {
  if (!secret) {
    return { ok: false, reason: "Missing DIDIT_WEBHOOK_SECRET." };
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  const timestampSeconds = Number(timestamp);
  const cleanedV2 = cleanSignature(signatureV2);

  if (!timestamp || !Number.isFinite(timestampSeconds)) {
    return { ok: false, reason: "Missing or invalid Didit webhook timestamp." };
  }

  if (Math.abs(nowSeconds - timestampSeconds) > 300) {
    return { ok: false, reason: "Webhook timestamp is outside the replay protection window." };
  }

  if (cleanedV2) {
    try {
      const canonical = stableJson(JSON.parse(rawBody));
      const expected = hmacHex(secret, canonical);
      if (secureCompare(expected, cleanedV2)) {
        return { ok: true, reason: null };
      }
    } catch {
      return { ok: false, reason: "Invalid JSON payload." };
    }
  }

  const cleanedLegacy = cleanSignature(signature);
  if (cleanedLegacy) {
    const expected = hmacHex(secret, rawBody);
    if (secureCompare(expected, cleanedLegacy)) {
      return { ok: true, reason: null };
    }
  }

  const cleanedSimple = cleanSignature(signatureSimple ?? null);
  if (cleanedSimple) {
    try {
      const payload = JSON.parse(rawBody) as Record<string, unknown>;
      const sessionId = valueFromPath(payload, ["session_id", "data.session_id", "id"]) ?? "";
      const status = valueFromPath(payload, ["status", "data.status"]) ?? "";
      const webhookType = valueFromPath(payload, ["webhook_type", "event_type", "type"]) ?? "";
      const expected = hmacHex(secret, `${timestamp}:${sessionId}:${status}:${webhookType}`);
      if (secureCompare(expected, cleanedSimple)) {
        return { ok: true, reason: null };
      }
    } catch {
      return { ok: false, reason: "Invalid JSON payload." };
    }
  }

  return { ok: false, reason: "Invalid Didit webhook signature." };
}

export function verifyLegacyDiditWebhookSignature({
  rawBody,
  signatureV2,
  timestamp,
  signature,
  secret
}: {
  rawBody: string;
  signatureV2: string | null;
  timestamp: string | null;
  signature: string | null;
  secret: string | undefined;
}) {
  if (!secret) {
    return { ok: false, reason: "Missing DIDIT_WEBHOOK_SECRET." };
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  const timestampSeconds = Number(timestamp);
  const cleanedV2 = cleanSignature(signatureV2);

  if (cleanedV2 && timestamp && Number.isFinite(timestampSeconds)) {
    if (Math.abs(nowSeconds - timestampSeconds) > 300) {
      return { ok: false, reason: "Webhook timestamp is outside the replay protection window." };
    }

    const expected = hmacHex(secret, `${timestamp}.${rawBody}`);
    if (secureCompare(expected, cleanedV2)) {
      return { ok: true, reason: null };
    }
  }

  const cleanedLegacy = cleanSignature(signature);
  if (cleanedLegacy) {
    const expected = hmacHex(secret, rawBody);
    if (secureCompare(expected, cleanedLegacy)) {
      return { ok: true, reason: null };
    }
  }

  return { ok: false, reason: "Invalid Didit webhook signature." };
}

export function normalizeDiditWebhook(payload: Record<string, unknown>): DiditStatusResult {
  const sessionId = valueFromPath(payload, [
    "session_id",
    "sessionId",
    "verification_session_id",
    "id",
    "data.session_id",
    "data.sessionId",
    "data.id",
    "session.id"
  ]);
  const userId = valueFromPath(payload, ["vendor_data", "vendorData", "data.vendor_data", "data.vendorData", "metadata.user_id", "data.metadata.user_id"]);
  const eventId = valueFromPath(payload, ["event_id", "eventId", "id", "data.event_id"]);
  const eventType = valueFromPath(payload, ["event_type", "eventType", "type"]);
  const rawDecision = valueFromPath(payload, ["decision", "status", "result", "data.decision", "data.status", "data.result"]) ?? "pending";
  const decision = rawDecision.toLowerCase();
  const scoreValue = valueFromPath(payload, ["verification_score", "score", "data.verification_score", "data.score"]);
  const score = scoreValue ? Number(scoreValue) : null;
  let status: SellerVerificationStatus = "pending";

  if (["approved", "accepted", "verified", "success", "passed"].some((item) => decision.includes(item))) {
    status = "approved";
  } else if (["declined", "rejected", "failed", "denied"].some((item) => decision.includes(item))) {
    status = "declined";
  } else if (["resubmission", "retry", "resubmit", "manual_review_required"].some((item) => decision.includes(item))) {
    status = "resubmission_required";
  }

  return {
    sessionId,
    userId,
    eventId,
    eventType,
    status,
    decision: rawDecision,
    score: Number.isFinite(score) ? score : null
  };
}

export function identityTrustScore(status: SellerVerificationStatus | string | null | undefined) {
  return status === "approved" ? 60 : 0;
}
