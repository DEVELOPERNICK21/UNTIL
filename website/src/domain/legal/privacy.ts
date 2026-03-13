/**
 * Privacy Policy — Single Source of Truth for store listings and website.
 * Suitable for Play Store and App Store "Privacy Policy" link.
 */

import { SITE_CONFIG } from '../config';

const { appName, baseUrl, contactEmail } = SITE_CONFIG;

export const PRIVACY_TITLE = `Privacy Policy — ${appName}`;

export const PRIVACY_LAST_UPDATED = '2026-03-14';

export const PRIVACY_SECTIONS = [
  {
    id: 'intro',
    title: '1. Introduction',
    body: `${appName} ("we," "our," or "the App") respects your privacy. This Privacy Policy explains what data we collect, how we use it, and your choices. It applies to the ${appName} mobile application and the website at ${baseUrl}.`,
  },
  {
    id: 'data-we-collect',
    title: '2. Data We Collect',
    body: `**Data you provide (including health-related information):** Information you enter in the App (e.g., birth date, expected lifespan, countdown titles and dates, custom counter names and values, and any goals or countdowns related to your health, habits, or well‑being) is stored locally on your device. This information may be considered "Health Data" because it relates to your physical or mental well‑being, even though it is manually entered by you. We do not access Health Data from external services (such as Google Fit, Apple Health, or your medical provider), and we do not transmit your in‑app Health Data to our servers unless you use a feature that explicitly syncs data (e.g., cloud backup), in which case we will describe that feature and its data use in the App.`,
  },
  {
    id: 'health-data-use',
    title: '3. How We Use Health Data',
    body: `We use the Health Data you enter only to provide core App functionality, such as calculating and displaying time‑based progress (for example, day/month/year progress, countdowns, and habit/goal tracking) and showing widgets or overlays on your device. We do not use Health Data for advertising, we do not sell it, and we do not use it to build profiles across different apps or services. If we introduce optional cloud backup or sync, Health Data included in your backup will only be used to restore your account or sync your devices, and we will update this policy with additional details before enabling such a feature.`,
  },
  {
    id: 'local-storage',
    title: '4. Local Storage',
    body: `The App uses local storage (e.g., device storage such as MMKV or similar) to persist your settings and data, including any Health Data you enter. This data stays on your device and is not sent to us by default.`,
  },
  {
    id: 'website',
    title: '5. Website',
    body: `When you visit our website (${baseUrl}), we may collect standard technical information such as IP address, browser type, and pages visited. We may use cookies or similar technologies only as needed for site operation (e.g., security, analytics if we add them). We will update this policy if we introduce significant analytics or third-party services.`,
  },
  {
    id: 'no-sale',
    title: '6. We Do Not Sell Your Data',
    body: `We do not sell your personal data to third parties.`,
  },
  {
    id: 'sharing',
    title: '7. Sharing of Data',
    body: `We do not share your personal data with third parties except: (a) if required by law or legal process; (b) to protect our rights or safety; (c) with your consent; or (d) with service providers who process data on our behalf under strict confidentiality (e.g., hosting). If we use such providers, we ensure they comply with applicable privacy laws.`,
  },
  {
    id: 'security',
    title: '8. Security',
    body: `We take reasonable steps to protect your data. Data stored on your device is subject to your device’s security. If we store any data on our servers, we use industry-standard measures to protect it.`,
  },
  {
    id: 'children',
    title: '9. Children',
    body: `The App is not directed at children under 13. We do not knowingly collect personal data from children under 13. If you believe we have collected such data, please contact us at ${contactEmail} and we will delete it.`,
  },
  {
    id: 'rights',
    title: '10. Your Rights',
    body: `Depending on your location, you may have rights to access, correct, delete, or port your data, or to object to or restrict processing. To exercise these rights, contact us at ${contactEmail}. You can also delete your data by uninstalling the App and clearing local storage.`,
  },
  {
    id: 'changes',
    title: '11. Changes to This Policy',
    body: `We may update this Privacy Policy from time to time. The "Last updated" date at the top will change. We will notify you of material changes via the App or by posting the new policy on ${baseUrl}/privacy. Continued use after changes constitutes acceptance.`,
  },
  {
    id: 'contact',
    title: '12. Contact',
    body: `For privacy-related questions or requests, contact us at ${contactEmail}.`,
  },
] as const;
