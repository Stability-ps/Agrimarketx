# AgriMarketX

AgriMarketX is a modern livestock management and marketplace SaaS platform for African farms. This first build uses Next.js 15, TypeScript, Tailwind CSS, Supabase and Stripe-ready configuration.

## What is included

- Email and Google login screen ready for Supabase Auth wiring
- Farm onboarding with owner, location, GPS, facilities, farm type and species selection
- Farm-aware app shell showing the AgriMarketX brand and active farm name
- Dashboard, animals list, add animal, animal profile, health, breeding, finance, reports, subscription and admin screens
- Supabase schema for companies, farms, members, species, camps, herds, animals, passports, health, breeding, finance, marketplace, transfers, subscriptions and disputes
- RLS policies for multi-farm access and roles: Owner, Manager, Worker, Vet, Accountant and Viewer
- Default livestock species seed data for cattle, goats, sheep, poultry, rabbits, pigs, horses and donkeys
- Stripe-ready subscription plan tables and UI placeholders

## Getting started

```bash
npm install
npm run dev
```

Create `.env.local` from `.env.example` and add your Supabase and Stripe keys.

Protected app routes now use Supabase Auth. Until `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set, the public website remains available and protected pages redirect to login with a setup message.

## Supabase

Apply the schema in:

```text
supabase/migrations/001_initial_schema.sql
```

Then seed default species and plans with:

```text
supabase/seed/default_species.sql
```

The schema includes automatic animal age categorisation from species settings, plus RLS helper functions for farm membership and role-based access.
