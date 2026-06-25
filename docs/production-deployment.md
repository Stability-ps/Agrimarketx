# AgriMarketX Production Deployment

## Hosting

- Host: Vercel
- Database/Auth/Storage: Supabase
- Framework: Next.js
- Package manager: pnpm

## Required Vercel Environment Variables

Set these in Vercel Project Settings > Environment Variables for Production:

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SITE_URL=https://your-production-domain
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
```

Stripe values can stay empty only while subscription checkout is not used in production.

## Supabase Auth URLs

In Supabase Auth URL Configuration:

- Site URL: `https://your-production-domain`
- Redirect URLs:
  - `https://your-production-domain/auth/callback`
  - `https://your-production-domain/login`
  - `https://your-production-domain/signup`
  - `https://your-production-domain/onboarding`
  - `http://localhost:3000/auth/callback`
  - `http://127.0.0.1:3000/auth/callback`

Add the final Vercel preview URL only if preview auth testing is needed.

## Supabase SQL Migration Order

Run every file in `supabase/migrations` in number order:

1. `001_initial_schema.sql`
2. `002_auth_profile_trigger.sql`
3. `003_fix_farm_onboarding_rls.sql`
4. `004_fix_company_owner_policy_helper.sql`
5. `005_allow_company_owner_farm_read.sql`
6. `006_marketplace_offer_transfer_policies.sql`
7. `007_buyer_transfer_functions.sql`
8. `008_media_storage_and_farm_logo.sql`
9. `009_animal_profile_photo_flag.sql`
10. `010_marketplace_saved_listings.sql`
11. `011_marketplace_price_negotiable.sql`
12. `012_admin_listing_review.sql`
13. `013_universal_marketplace_listings.sql`
14. `014_marketplace_contacts_enquiries.sql`
15. `015_trust_support_marketplace.sql`
16. `016_messages_support_notifications.sql`
17. `017_account_roles.sql`
18. `018_signup_profile_metadata.sql`
19. `019_supply_categories_buyer_requests.sql`
20. `020_locations_wanted_media_admin_archive.sql`
21. `021_public_contact_enquiries.sql`
22. `022_marketplace_detail_analytics.sql`
23. `023_marketplace_category_structure.sql`
24. `024_marketplace_search_category_updates.sql`
25. `025_production_indexes.sql`

Then run:

```text
supabase/seed/default_species.sql
```

## Production Smoke Test

After deploy, confirm:

- Public marketplace loads without login.
- Search `car` shows vehicle/bakkie-style listings.
- Category and subcategory filters work.
- Listing cards open listing detail pages.
- Save and share buttons do not open the listing.
- Contact Seller reveals contact details only on the listing detail page.
- Guest Chat to Seller creates an inquiry.
- Signup, login, logout and Google auth work.
- Seller onboarding creates a farm and preserves active farm separation.
- Create listing uploads up to the configured photo limit.
- Seller My Listings shows listing images.
- Admin can approve, reject, remove, restore and archive listings.
- Admin dashboard, wanted requests, support tickets and reports load.
- Image uploads work for listings, farms and animal profiles.
- Draft form data survives refresh for the important forms already wired with local draft persistence.

## Performance Checks

Review these after production data grows:

- Marketplace listing query speed.
- Listing detail page similar ads query.
- Admin listing moderation query.
- Image sizes and storage URLs.
- Category count query on marketplace homepage.
- Missing Supabase indexes on `status`, `category`, `subcategory`, `province`, `town`, `seller_farm_id`, `created_at`.
