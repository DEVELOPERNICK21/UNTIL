/**
 * App & website configuration — Single Source of Truth.
 * All URLs, app name, and contact info in one place.
 */

export const APP_NAME = 'UNTIL' as const;

export const SITE_CONFIG = {
  /** Base URL for canonical links and sitemap (replace with your domain) */
  baseUrl: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://until-app.com',
  appName: APP_NAME,
  tagline: 'See your time. Day, month, year, life.',
  /** Contact email for privacy/legal inquiries (required for store listings) */
  contactEmail: 'support@until-app.com',
  /** Placeholder; replace with real store URLs when published */
  playStoreUrl: 'https://play.google.com/store/apps/details?id=com.until',
  appStoreUrl: 'https://apps.apple.com/app/until/id000000000',
} as const;

export const ROUTES = {
  home: '/',
  terms: '/terms',
  privacy: '/privacy',
} as const;
