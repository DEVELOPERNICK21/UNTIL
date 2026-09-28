/**
 * Terms of Service — Single Source of Truth for store listings and website.
 * Suitable for Play Store and App Store "Terms of Use" link.
 */

import { SITE_CONFIG } from '../config';
import { WEBSITE_PRICING } from '../pricing';

const { appName, baseUrl, contactEmail } = SITE_CONFIG;

export const TERMS_TITLE = `Terms of Service · ${appName}`;

export const TERMS_LAST_UPDATED = '2026-09-28';

export const TERMS_SECTIONS = [
  {
    id: 'acceptance',
    title: '1. Acceptance of Terms',
    body: `By downloading, installing, or using the ${appName} application ("App") and/or visiting ${baseUrl} ("Site"), you agree to these Terms of Service ("Terms"). If you do not agree, do not use the App or Site.`,
  },
  {
    id: 'description',
    title: '2. Description of Service',
    body: `${appName} is a time-awareness application that displays progress through day, month, year, and life based on user-provided data (e.g., birth date, expected lifespan). The App and Site are for personal, non-commercial use.`,
  },
  {
    id: 'eligibility',
    title: '3. Eligibility',
    body: `You must be at least 13 years old to create an account or buy a subscription. If a higher minimum age applies where you live, that age applies. By using the App, you confirm you meet this requirement.`,
  },
  {
    id: 'privacy',
    title: '4. Privacy',
    body: `Your use of the App is also governed by our Privacy Policy, which is part of these Terms. Read it at ${baseUrl}/privacy.`,
  },
  {
    id: 'user-data',
    title: '5. Your Data',
    body: `You are responsible for the accuracy of data you enter (e.g., birth date). We do not verify it. Without an account, this data stays on your device. If you sign in, your profile and settings are stored in your account so they sync across devices. The Privacy Policy lists what is stored and who processes it. You can delete your account in Settings › Account.`,
  },
  {
    id: 'subscriptions',
    title: '6. Subscriptions and Automatic Renewal',
    body: `Premium is sold as a weekly, monthly or yearly subscription, or as a one-time lifetime purchase. Payment is handled by Google Play or the App Store.

Subscriptions renew automatically at the price and interval shown when you subscribe, until you cancel. You are charged when you subscribe and again at the start of each new period.

You can cancel any time in the App (Settings › Manage subscription) or in your Google Play or App Store subscriptions. Cancel at least 24 hours before the renewal date to avoid the next charge. After you cancel, Premium stays active until the end of the period you paid for.

The ${WEBSITE_PRICING.trialDays}-day free app preview is not a store trial. It never charges you and does not turn into a subscription.

The store sends your purchase receipt. Refunds are handled under Google Play or App Store refund policies. If we change the price of a subscription, the store will tell you before the new price applies, and you can cancel before it does.`,
  },
  {
    id: 'acceptable-use',
    title: '7. Acceptable Use',
    body: `You agree not to use the App or Site for any unlawful purpose, to distribute malware, to infringe anyone's copyright, or to try to gain unauthorized access to any system or data. We may suspend or end access for violation of these Terms.`,
  },
  {
    id: 'copyright',
    title: '8. Copyright',
    body: `We respond to copyright notices under the DMCA and close the accounts of repeat infringers. See our Copyright & DMCA Policy at ${baseUrl}/copyright for how to send a notice.`,
  },
  {
    id: 'disclaimer',
    title: '9. Disclaimer of Warranties',
    body: `THE APP AND SITE ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. WE DO NOT GUARANTEE ACCURACY, AVAILABILITY, OR FITNESS FOR A PARTICULAR PURPOSE.`,
  },
  {
    id: 'limitation',
    title: '10. Limitation of Liability',
    body: `TO THE MAXIMUM EXTENT PERMITTED BY LAW, ${appName} AND ITS PROVIDERS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR LOSS OF DATA OR PROFITS, ARISING FROM YOUR USE OF THE APP OR SITE.`,
  },
  {
    id: 'changes',
    title: '11. Changes to Terms',
    body: `We may update these Terms. The "Last updated" date at the top will change. If you keep using the App after a change, you accept the new Terms.`,
  },
  {
    id: 'contact',
    title: '12. Contact',
    body: `For questions about these Terms, email ${contactEmail}.`,
  },
] as const;
