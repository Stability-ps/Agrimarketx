# AgriMarketX Demo Content

These files are for development and testing only.

## Add demo content

Run `supabase/seed/demo_content.sql` in the Supabase SQL editor.

Before running it, create or sign into at least one AgriMarketX account. The seed uses the first existing profile as the demo owner, because Supabase Auth users cannot safely be created from a normal SQL seed.

The seed creates realistic South African demo data for:

- Marketplace listings across all main categories
- Listing photos
- Featured farms and seller profiles
- Wanted listings / buyer requests
- Animals, herds, camps and species
- Health, breeding, weight and finance records
- Notifications
- Messages
- Support tickets
- Offers, enquiries and reports
- Province and town data

## Remove demo content

Run `supabase/seed/remove_demo_content.sql`.

Demo rows are marked with `[DEMO]`, `DEMO-*`, or fixed demo UUIDs, so they are easy to find and remove without touching normal platform data.

## Image note

The demo seed uses public agricultural image URLs for realistic testing. Real user uploads still use Supabase Storage.
