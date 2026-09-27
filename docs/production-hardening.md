# Production hardening runbook (migrations 035–037)

This release closes public data exposure, storage exposure, seller
self-verification and abuse gaps. The database changes and the application
code must be rolled out **in this order**, because the restrictive migration
(036) removes access that the currently deployed code still uses.

## 0. Before anything: back up

Supabase Dashboard → Database → Backups: confirm a recent backup exists (or
take a manual one on plans that support it).

## 1. Migration history baseline (do this once)

**Why the live history only shows a recent migration:** migrations 001–034
were applied by pasting SQL into the dashboard SQL editor. That runs the SQL
but does not record it in `supabase_migrations.schema_migrations`; only
migrations applied via the CLI (`supabase db push`) or the MCP
`apply_migration` tool are recorded.

**Evidence the live schema already matches 001–034:** a local database built
only from 001–034 has exactly the tables, columns, policies and function
signatures that production exposes (checked for `farms`,
`marketplace_listings`, storage buckets and all 13 `SECURITY DEFINER`
functions), and all 34 migrations apply cleanly in order.

**Baseline without replaying anything:**

```bash
npx supabase login
npx supabase link --project-ref rtqvpnfdcxbkohybsyjl
# 1. Compare live schema with the repo's migrations (read-only).
npx supabase db diff --linked --schema public,storage
# 2. Only if step 1 shows no unexpected differences, RECORD 001-034 as applied.
#    `repair` writes history rows only; it does not execute any SQL.
npx supabase migration repair --status applied 001 002 003 004 005 006 007 008 009 010 \
  011 012 013 014 015 016 017 018 019 020 021 022 023 024 025 026 027 028 029 030 031 032 034
npx supabase migration list   # every local migration up to 034 should now show as applied
```

Note there is no `033`; that number was never used.

From then on, apply new migrations with `npx supabase db push` (or via the
SQL editor **and** `migration repair --status applied <n>` so history stays
accurate). Never re-run old migrations.

## 2. Rollout order

| Step | What | Safe with current live code? |
| --- | --- | --- |
| 1 | Apply **035** (additive: approx coordinates, private bucket, bucket limits, rate-limit store, indexes) | Yes |
| 2 | Apply **037** (trust-field triggers) | Yes (the old and new code only write fields sellers are allowed to change) |
| 3 | Deploy the web code (merge the hardening PR → Vercel production) | Yes (needs 035) |
| 4 | Run the document migration script (section 4) | Yes |
| 5 | Apply **036** (restrictive) | Only after step 3 is live |
| 6 | Run the checks in section 5 | |

Environment variables (Vercel → Project → Settings → Environment Variables):

- `SUPABASE_SERVICE_ROLE_KEY`: already required; now also used for contact
  reveals, rate limiting, metrics, notifications and admin reads.
- `ANDROID_SHA256_CERT_FINGERPRINTS`: comma-separated SHA-256 fingerprints
  for Android App Links (Play Console → Test and release → Setup → App
  integrity: copy **both** the *App signing key certificate* and the *Upload key
  certificate* SHA-256). Leave unset until you have them.

## 3. Rate limits

Stored in `public.rate_limit_buckets` (SHA-256 keys only, pruned after two
days) via `consume_rate_limit()`, so they work across all Vercel instances.
Over-limit requests get a friendly message (HTTP 429 for API routes). If the
limiter is unavailable it fails open and logs `[rate-limit]`.

| Action | Limit | Keyed by |
| --- | --- | --- |
| Phone OTP send | 5 / hour | user |
| Phone OTP verify | 10 / hour | user |
| Didit session start | 5 / hour | user |
| Contact form | 5 / hour | IP |
| Guest / signed-in enquiry | 10 / hour | IP or user |
| Listing report | 10 / hour | user or IP |
| Contact reveal (listing / farm phone) | 30 / hour | IP |
| Listing metric | 10 / hour | IP + listing + metric |
| Signup | 5 / hour | IP |

## 4. Move existing verification documents out of the public bucket

```bash
export NEXT_PUBLIC_SUPABASE_URL=https://rtqvpnfdcxbkohybsyjl.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=...   # from Supabase → Settings → API
node scripts/migrate-verification-documents.mjs                 # dry run: lists documents
node scripts/migrate-verification-documents.mjs --apply         # copy + checksum + update path
node scripts/migrate-verification-documents.mjs --apply --delete-source   # when happy
```

Each file is copied to `seller-verification-documents`, re-downloaded and
checksum-compared, and only then is `storage_path` updated. Public copies are
deleted only with `--delete-source`, and only for verified copies. Until a
document is migrated, admins can still open it (signed URL from the legacy
path).

## 5. Verify after 036

Run with the **anon** key (public, no user token). All of these must fail
with `permission denied`:

```bash
KEY=<anon key>; U=https://rtqvpnfdcxbkohybsyjl.supabase.co
curl "$U/rest/v1/farms?select=owner_phone&limit=1" -H "apikey: $KEY"
curl "$U/rest/v1/farms?select=gps_latitude&limit=1" -H "apikey: $KEY"
curl "$U/rest/v1/marketplace_listings?select=seller_contact_phone&limit=1" -H "apikey: $KEY"
curl "$U/rest/v1/marketplace_listings?select=latitude&limit=1" -H "apikey: $KEY"
curl -X POST "$U/rest/v1/rpc/increment_listing_metric" -H "apikey: $KEY" -H 'Content-Type: application/json' \
  -d '{"listing_id":"00000000-0000-0000-0000-000000000000","metric":"view"}'
```

These must still work: `farms?select=id,name,province`,
`marketplace_listings?select=id,title,approx_latitude,farms:seller_farm_id(name)`.

Then in the app: marketplace, a listing (Contact Seller shows the details),
a farm page (Show phone number), seller settings, seller verification, admin
verifications (View a document), creating a listing with photos.

Re-run **Advisors → Security** and **Advisors → Performance**.

## 6. Rollback

036 only changes privileges and policies, so it can be reverted quickly:

```sql
grant select on public.farms, public.marketplace_listings to anon, authenticated;
grant select on public.animals to anon;
grant execute on function public.increment_listing_metric(uuid, text) to anon, authenticated;
create policy "System creates notifications" on public.app_notifications for insert with check (true);
```

(Restore other dropped policies from migrations 008, 014/016 and 021 if
needed.) 037's triggers can be dropped with
`drop trigger protect_farm_trust_fields on public.farms;` and
`drop trigger protect_listing_trust_fields on public.marketplace_listings;`.

## 7. Supabase Auth settings (dashboard only)

Authentication → Sign In / Providers → Email:

- **Confirm email**: on.
- **Password security → Leaked password protection** (HaveIBeenPwned): on.
  Available on the Pro plan and above.
- **Minimum password length**: 8; **Password requirements**: "Lowercase,
  uppercase letters and digits" (matches `src/lib/password-policy.ts`).
- **Secure password change / Require current password when updating**: on.

Authentication → Rate Limits: keep email sends conservative (for example 30/hour)
and confirm a working custom SMTP is configured, because signups no longer
fall back to auto-confirmed accounts when email delivery fails.
