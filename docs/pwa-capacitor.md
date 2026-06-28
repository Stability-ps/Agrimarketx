# AgriMarketX PWA and Capacitor Notes

AgriMarketX remains a Next.js 15, Supabase and Vercel application. The mobile-first path is:

1. Installable PWA for browsers.
2. Capacitor wrapper that loads the production web app.
3. Native Android/iOS features can be added later when needed.

## PWA Setup

Implemented files:

- `public/manifest.webmanifest`
- `public/sw.js`
- `public/offline.html`
- `public/icons/*`
- `public/splash/*`
- `src/components/PwaRegistrar.tsx`
- PWA metadata in `src/app/layout.tsx`

The service worker is intentionally conservative:

- It caches only safe shell assets, icons, logo and the offline page.
- It does not cache Supabase, auth, API, Twilio or Didit requests.
- Navigation requests fall back to `offline.html` only when the network is unavailable.

This avoids showing stale private data or breaking login, uploads, verification or marketplace actions.

## Add To Home Screen

Browsers can offer install prompts when:

- The site is served over HTTPS.
- `manifest.webmanifest` is reachable.
- `sw.js` registers successfully.
- Required icons are available.

Production URL:

```text
https://agrimarketx.co.za
```

## Android Build Preparation

Capacitor is configured in:

```text
capacitor.config.ts
```

Current configuration:

```text
App name: AgriMarketX
App ID: za.co.agrimarketx.app
Server URL: https://agrimarketx.co.za
```

Install Android platform later:

```bash
pnpm add -D @capacitor/android
pnpm exec cap add android
pnpm run cap:sync
pnpm run cap:open:android
```

The Android app will initially load the production web app. This is correct for the current server-rendered Next.js architecture.

## iOS Build Preparation

Install iOS platform later on macOS with Xcode installed:

```bash
pnpm add -D @capacitor/ios
pnpm exec cap add ios
pnpm run cap:sync
pnpm run cap:open:ios
```

The iOS app will initially load the production web app. Apple review may require clear native-app value over a simple web wrapper before App Store release.

## Required Environment Variables

These remain server-side or Vercel-side values. Do not hardcode secrets inside Capacitor or client code.

Public:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_SITE_URL
```

Server-only:

```text
SUPABASE_SERVICE_ROLE_KEY
DIDIT_API_KEY
DIDIT_WEBHOOK_SECRET
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
TWILIO_VERIFY_SERVICE_SID
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
```

## Known Limitations

- Offline mode is only a safe fallback page, not offline marketplace/farm data sync.
- Image uploads, OTP, Didit verification, chat and Supabase auth require network access.
- Capacitor is configured as a remote app wrapper because this Next.js app uses server-rendered pages and live Supabase data.
- A fully bundled native app would require a separate static/mobile shell or API-driven client architecture.

## Verification Checklist

Before shipping mobile builds:

- `pnpm run build`
- Confirm `/manifest.webmanifest` opens in production.
- Confirm `/sw.js` opens in production.
- Install from Chrome/Android and confirm the app opens standalone.
- Add to Home Screen on iOS Safari and confirm icon/splash behavior.
- Test login persistence on mobile Safari and Chrome.
- Test image upload from camera/gallery.
- Test OTP send and verify.
- Test marketplace browsing, listing details and seller contact.
