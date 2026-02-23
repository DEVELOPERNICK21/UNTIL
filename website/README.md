# Until: Days left — Landing Website

This is the **standalone** marketing/landing site for the Until: Days left app. It lives in the same repo as the React Native app but is **not** part of the app bundle — the app’s APK/AAB size is unchanged.

## Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Clean architecture**: domain (SSOT for copy, config, legal), presentation (app, components)

## Structure

- `src/domain/` — Single source of truth: config, copy, Terms of Service, Privacy Policy
- `src/app/` — Pages: home, `/terms`, `/privacy`
- `src/components/` — Header, Footer, PhoneMockup, AppScreenPreview

## Run

```bash
cd website
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Build

```bash
npm run build
npm run start
```

## Store listings

- **Terms of Service**: use `https://your-domain.com/terms` for Play Store and App Store.
- **Privacy Policy**: use `https://your-domain.com/privacy` for both stores.

Update `src/domain/config.ts` with your real `baseUrl`, `contactEmail`, and store URLs before going live.
