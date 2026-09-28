/**
 * Privacy Policy — Single Source of Truth for store listings and website.
 * Suitable for Play Store and App Store "Privacy Policy" link.
 */

import { SITE_CONFIG } from '../config';

const { appName, baseUrl, contactEmail } = SITE_CONFIG;

export const PRIVACY_TITLE = `Privacy Policy · ${appName}`;

export const PRIVACY_LAST_UPDATED = '2026-09-28';

export const PRIVACY_SECTIONS = [
  {
    id: 'intro',
    title: '1. Introduction',
    body: `${appName} ("we," "our," or "the App") respects your privacy. This Privacy Policy explains what data we collect, how we use it, and your choices. It applies to the ${appName} mobile application and the website at ${baseUrl}.`,
  },
  {
    id: 'data-we-collect',
    title: '2. Data We Collect',
    body: `**Data you enter:** Your birth date, expected lifespan, countdowns, counters, tasks, goals and settings. This may count as health-related data because it relates to your well‑being, even though you type it in yourself. We do not read data from Google Fit, Apple Health or any medical provider.

**If you create an account (optional):** We use Google Firebase Authentication to sign you in with Google or with email and password. We store your email address and a Firebase user ID. In Google Cloud Firestore we store your birth date, expected lifespan, theme, a record that you confirmed you are 13 or older, the devices signed in to your account (device ID, platform, device name, last seen date), and your Premium status (active or not, plan type, store). Without an account, this data stays on your device.

**Purchases:** Payments are handled by Google Play or the Apple App Store. We never see your card details. We use RevenueCat (RevenueCat, Inc.) to check your subscription. RevenueCat receives an anonymous app user ID (or your account user ID if you sign in) and your purchase receipts.

**Free preview:** To stop the free preview restarting after a reinstall, the App sends a device ID to our server. We store only a salted hash of that ID and the preview start date, in a database run by Vercel KV (Upstash, Inc.).

**Usage stats:** We use PostHog (PostHog, Inc.) and Google Firebase Analytics to see which screens and features are used and where the purchase flow fails. Events are tied to an anonymous device ID, not your name or email. They never include the text you type, your email or your birth date. You can turn this off in Settings → Share usage stats.

**Crash reports:** We use Google Firebase Crashlytics to receive crash reports (device model, OS version, app version and an anonymous ID) so we can fix bugs.

**No session recording:** We do not record your screen, taps or keystrokes, and we do not use heatmaps.`,
  },
  {
    id: 'health-data-use',
    title: '3. How We Use Your Data',
    body: `We use the data you enter only to run the App: calculating day, month, year and life progress, countdowns and goals, and showing widgets and overlays. If you sign in, we use your synced data only to restore it on your devices and to apply Premium on up to 3 devices. We do not use your data for advertising, we do not sell it, and we do not build profiles across other apps or services.`,
  },
  {
    id: 'local-storage',
    title: '4. Local Storage',
    body: `The App stores your data and settings on your device (MMKV and similar local storage), including any health-related data you enter. Without an account, this data is not sent to us.`,
  },
  {
    id: 'website',
    title: '5. Website',
    body: `Our website (${baseUrl}) is hosted on Vercel. Like any web host, Vercel receives technical data such as your IP address and browser type when you load a page. The website does not use analytics, advertising cookies or third-party scripts, and all fonts and images load from our own domain.`,
  },
  {
    id: 'no-sale',
    title: '6. We Do Not Sell Your Data',
    body: `We do not sell or rent your personal data, and we do not share it for targeted advertising.`,
  },
  {
    id: 'sharing',
    title: '7. Service Providers',
    body: `We share data only with the providers that run parts of the App for us: Google Firebase (sign-in, account database, analytics, crash reports), PostHog (usage stats), RevenueCat (subscription checks), Google Play and the Apple App Store (payments), Vercel (website and preview server) and Upstash through Vercel KV (stores the hashed preview ID). Each one processes data only to provide its service. We may also share data if the law requires it, to protect our rights or safety, or with your consent.`,
  },
  {
    id: 'retention',
    title: '8. How Long We Keep Data',
    body: `Account data is kept until you delete your account. Usage stats and crash reports are kept by PostHog and Firebase for their standard retention periods, then deleted. Local data stays on your device until you delete it or uninstall the App.`,
  },
  {
    id: 'security',
    title: '9. Security',
    body: `Data stored on your device is protected by your device's security. Account data is stored in Google Cloud and protected by access rules so that only you can read or change your own account data. Data is sent over encrypted connections (HTTPS).`,
  },
  {
    id: 'children',
    title: '10. Children',
    body: `The App is not directed at children under 13. You must confirm you are 13 or older to create an account or verify a student email. If the birth date you enter shows you are under 13, the App will not create an account, will not store an email, and turns off usage stats and crash reports on that device. If you believe a child under 13 has given us personal data, contact us at ${contactEmail} and we will delete it.`,
  },
  {
    id: 'rights',
    title: '11. Your Choices and Rights',
    body: `**Usage stats:** Turn them off anytime in Settings → Share usage stats. The choice is saved and you can change it later.

**Delete your account:** In the App, go to Settings → Account → Delete account. This removes your account and all data stored in Firestore.

**Other requests:** Depending on where you live (for example under GDPR or CCPA), you may have the right to access, correct, delete or export your data, or to object to its processing. Email ${contactEmail} and we will reply within 30 days. You can also uninstall the App to remove all local data.`,
  },
  {
    id: 'changes',
    title: '12. Changes to This Policy',
    body: `We may update this Privacy Policy. The "Last updated" date at the top will change. We will tell you about important changes in the App or on ${baseUrl}/privacy.`,
  },
  {
    id: 'contact',
    title: '13. Contact',
    body: `For privacy questions or requests, contact us at ${contactEmail}.`,
  },
] as const;
