import { createAdminClient } from "@/lib/supabase/admin";

export type AuthUserLookup = {
  emailConfirmedAt: string | null;
  id: string;
} | null;

export async function findAuthUserByEmail(email: string): Promise<AuthUserLookup | undefined> {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail) {
    return null;
  }

  try {
    const admin = createAdminClient();
    let page = 1;
    const perPage = 1000;

    while (page <= 10) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage });

      if (error) {
        return undefined;
      }

      const match = data.users.find((user) => user.email?.toLowerCase() === normalizedEmail);

      if (match) {
        return {
          emailConfirmedAt: match.email_confirmed_at ?? null,
          id: match.id
        };
      }

      if (data.users.length < perPage) {
        return null;
      }

      page += 1;
    }
  } catch {
    return undefined;
  }

  return null;
}
