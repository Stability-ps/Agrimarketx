# AgriMarketX Public Content Audit

Date: 2026-06-24

Goal: reposition public AgriMarketX pages as an agricultural marketplace first, with farm management and livestock records as part of the wider platform.

## Replacements Applied

| Route / Area | Component / File | Previous Text | Replacement |
| --- | --- | --- | --- |
| `/` | `src/app/page.tsx` | Modern livestock management platform positioning | Agricultural Marketplace & Farm Management Platform |
| `/` | `src/app/page.tsx` | Manage, track and trade livestock with confidence | Buy, Sell, Manage and Grow Your Agricultural Business |
| `/` | `src/app/page.tsx` | Everything a livestock operation checks daily | Everything a modern agricultural business manages daily |
| `/` | `src/app/page.tsx` | Species and animal-only feature framing | Marketplace Ready, Farm Management, Buyer & Seller Network, Digital Records, Verified Sellers, Wanted Listings |
| Global metadata | `src/app/layout.tsx` | Livestock management platform for Africa | Agricultural marketplace and farm management platform for Africa |
| Marketing content | `src/lib/marketing-data.ts` | Animal Records | Farm Records & Marketplace Activity |
| Marketing content | `src/lib/marketing-data.ts` | 8 Default Species | Multiple Agricultural Categories |
| Marketing content | `src/lib/marketing-data.ts` | Livestock-only feature descriptions | Broader wording including livestock, feed, crops, equipment, vehicles, infrastructure and services |
| `/features` | `src/app/features/page.tsx` | Livestock software feature framing | Marketplace and farm operations feature framing |
| `/pricing` | `src/app/pricing/page.tsx` | Livestock-focused plan introduction | Agricultural marketplace and farm management plan introduction |
| `/faq` | `src/app/faq/page.tsx` | Livestock-only FAQ framing | Marketplace, selling, farm management and support FAQ framing |
| `/login` | `src/app/login/page.tsx` | Livestock records and trading tools | Agricultural marketplace, farm records and trading tools |
| `/signup` | `src/app/signup/page.tsx` | Manage livestock and publish listings | Manage operations and publish marketplace listings |
| `/account/type` | `src/app/account/type/page.tsx` | Manage livestock records and sell | Manage farm records and sell agricultural products or services |
| `/about` | `src/app/about/page.tsx` | Livestock platform overview | Agricultural marketplace and farm management overview |
| `/account/about` | `src/app/account/about/page.tsx` | Livestock-only description | Broader marketplace and farm management description |
| `/onboarding` | `src/app/onboarding/page.tsx` | Default species settings | Livestock species settings, within farm setup context |
| `/province/[slug]` | `src/app/province/[slug]/page.tsx` | Province livestock marketplace SEO | Province agricultural marketplace SEO |
| `/city/[slug]` | `src/app/city/[slug]/page.tsx` | City livestock marketplace SEO | City agricultural marketplace SEO |
| Email templates | `src/lib/email-templates.ts` | Sell livestock and agricultural products | Sell agricultural products, livestock, equipment or services |
| Share text | `src/components/MarketplaceShareButton.tsx` | View this livestock listing | View this marketplace listing |

## Intentional Keeps

Some livestock wording remains where it is functionally correct:

- Animal profiles
- Health records
- Breeding records
- Species setup
- Livestock listing category
- QR animal passport

These are not public positioning problems; they are real farm-management features.

## Marketplace Detail Improvements Applied

- Listing cards now open proper listing detail pages instead of old anchor jumps.
- Saved listings, farm profile listings and admin report links now open the detail page.
- Detail pages show main image, gallery, full description, category details, seller summary and contact actions.
- Contact details stay hidden until the buyer clicks Contact Seller.
- Guest users can send a chat enquiry without signing in.
- Logged-in users can open marketplace message threads.
- Similar Ads show beneath listing detail pages.
- Back to Marketplace preserves the marketplace return path when supplied.
- Save/share/report actions stay separate from card navigation.
- Share, chat, similar-ad and view tracking are wired through the marketplace metrics function.

## SQL Required

Run this migration in Supabase if it has not been run yet:

`supabase/migrations/022_marketplace_detail_analytics.sql`

It adds analytics counters and updates the listing metric function for:

- Views
- Contact clicks
- Chat clicks
- Share clicks
- Similar ad clicks

## Verification

- TypeScript check passed with the bundled Node runtime.
- Text scan found no remaining old public-positioning phrases such as `AgriStockX`, `Modern Livestock`, `Livestock Management Platform`, `Default Species`, `marketplace#listing`, or `livestock listing`.
