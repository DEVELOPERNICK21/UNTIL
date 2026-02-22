/**
 * Terms of Service — Single Source of Truth for store listings and website.
 * Suitable for Play Store and App Store "Terms of Use" link.
 */

import { SITE_CONFIG } from '../config';

const { appName, baseUrl, contactEmail } = SITE_CONFIG;

export const TERMS_TITLE = `Terms of Service — ${appName}`;

export const TERMS_LAST_UPDATED = '2025-02-22';

export const TERMS_SECTIONS = [
  {
    id: 'acceptance',
    title: '1. Acceptance of Terms',
    body: `By downloading, installing, or using the ${appName} application ("App") and/or visiting ${baseUrl} ("Site"), you agree to these Terms of Service ("Terms"). If you do not agree, do not use the App or Site.`,
  },
  {
    id: 'description',
    title: '2. Description of Service',
    body: `${appName} is a time-awareness application that displays progress through day, month, year, and life based on user-provided data (e.g., birth date, expected lifespan). The App and Site are provided "as is" for personal, non-commercial use.`,
  },
  {
    id: 'eligibility',
    title: '3. Eligibility',
    body: `You must be at least 13 years of age (or the minimum age in your jurisdiction) to use the App. By using the App, you represent that you meet this requirement.`,
  },
  {
    id: 'privacy',
    title: '4. Privacy',
    body: `Your use of the App is also governed by our Privacy Policy, which is incorporated into these Terms. Please read it at ${baseUrl}/privacy.`,
  },
  {
    id: 'user-data',
    title: '5. User-Provided Data',
    body: `You are responsible for the accuracy of any data you enter (e.g., birth date). We do not verify this data. Data is stored locally on your device; we do not collect or store it on our servers unless otherwise stated in the Privacy Policy.`,
  },
  {
    id: 'acceptable-use',
    title: '6. Acceptable Use',
    body: `You agree not to use the App or Site for any unlawful purpose, to distribute malware, or to attempt to gain unauthorized access to any system or data. We may suspend or terminate access for violation of these Terms.`,
  },
  {
    id: 'disclaimer',
    title: '7. Disclaimer of Warranties',
    body: `THE APP AND SITE ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. WE DO NOT GUARANTEE ACCURACY, AVAILABILITY, OR FITNESS FOR A PARTICULAR PURPOSE.`,
  },
  {
    id: 'limitation',
    title: '8. Limitation of Liability',
    body: `TO THE MAXIMUM EXTENT PERMITTED BY LAW, ${appName} AND ITS PROVIDERS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR LOSS OF DATA OR PROFITS, ARISING FROM YOUR USE OF THE APP OR SITE.`,
  },
  {
    id: 'changes',
    title: '9. Changes to Terms',
    body: `We may update these Terms from time to time. The "Last updated" date at the top will change. Continued use of the App after changes constitutes acceptance. We encourage you to review the Terms periodically.`,
  },
  {
    id: 'contact',
    title: '10. Contact',
    body: `For questions about these Terms, contact us at ${contactEmail}.`,
  },
] as const;
