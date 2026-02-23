/**
 * App & website configuration — Single Source of Truth.
 * All URLs, app name, and contact info in one place.
 */

export const APP_NAME = 'Until: Days left' as const;

export const SITE_CONFIG = {
  /** Base URL for canonical links and sitemap (replace with your domain) */
  baseUrl: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://until-app.com',
  appName: APP_NAME,
  tagline: 'Days left. Day, month, year, life.',
  /** Contact email for privacy/legal inquiries (required for store listings) */
  contactEmail: 'support@until-app.com',
  /** Placeholder; replace with real store URLs when published */
  playStoreUrl: 'https://play.google.com/store/apps/details?id=app.until.time',
  appStoreUrl: 'https://apps.apple.com/app/until/id000000000',
  /** Pricing for landing page (SSOT). Add wasPrice & savePercent for intro-offer style. */
  pricing: {
    introLabel: 'Free to use',
    oneTimeLabel: 'Optional Premium — one-time, no subscription',
    price: '$4.99',
    wasPrice: '' as string, // e.g. '$9.99' for strikethrough; leave '' to hide
    savePercent: 0 as number, // e.g. 50; use 0 to hide save badge
    currencyNote: 'iPhone & Android',
  },
} as const;

export const ROUTES = {
  home: '/',
  terms: '/terms',
  privacy: '/privacy',
} as const;
