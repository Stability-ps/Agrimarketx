export function userSafeErrorMessage(error: unknown, fallback = "We could not complete that action. Please try again.") {
  const message = error instanceof Error
    ? error.message
    : typeof error === "object" && error && "message" in error
      ? String((error as { message?: unknown }).message ?? "")
      : "";

  if (message) {
    console.error("[agrimarketx-action-error]", message);
  }

  const normalized = message.toLowerCase();

  if (normalized.includes("invalid login credentials")) return "The email address or password is incorrect.";
  if (normalized.includes("email not confirmed")) return "Confirm your email address before signing in.";
  if (normalized.includes("user already registered")) return "An account already exists for this email address.";
  if (normalized.includes("rate limit") || normalized.includes("too many requests")) return "Too many attempts. Please wait a moment and try again.";
  if (normalized.includes("network") || normalized.includes("fetch failed")) return "We could not reach the service. Check your connection and try again.";
  if (normalized.includes("file") && normalized.includes("large")) return "That file is too large. Choose a smaller file and try again.";

  return fallback;
}
