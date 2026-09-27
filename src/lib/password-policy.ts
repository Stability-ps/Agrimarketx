/**
 * Shared password rule for signup and password reset. Keep in sync with the
 * Supabase dashboard (Authentication -> Sign In / Providers -> Email ->
 * Password security): minimum length 8, "Lowercase, uppercase letters and
 * digits", and leaked password protection enabled.
 */
export const PASSWORD_REQUIREMENTS = "At least 8 characters, with an uppercase letter, a lowercase letter and a number.";

export function passwordPolicyError(password: string) {
  if (password.length < 8) {
    return "Password must be at least 8 characters.";
  }

  if (!/[A-Z]/.test(password)) {
    return "Password must have at least one uppercase character.";
  }

  if (!/[a-z]/.test(password)) {
    return "Password must have at least one lowercase character.";
  }

  if (!/[0-9]/.test(password)) {
    return "Password must have at least one number.";
  }

  return null;
}
