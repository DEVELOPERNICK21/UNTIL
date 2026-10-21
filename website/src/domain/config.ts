/**
 * App & website configuration — Single Source of Truth.
 * All URLs, app name, and contact info in one place.
 */

import {
  PRICING_DISPLAY,
  WEBSITE_PRICING,
  yearlySavePercentVsMonthly,
  formatInr,
} from './pricing';

export const APP_NAME = 'UNTIL : Countdown & Time Left' as const;

/**
 * The one address people write to for support, privacy requests and copyright notices.
 * The "+until" part lands in the same Gmail inbox but can be filtered into its own label.
 * Move to a custom-domain address (for example support@your-domain) once a domain is registered.
 */
const SUPPORT_EMAIL = 'developernick1+until@gmail.com';

export const SITE_CONFIG = {
  /** Base URL for canonical links and sitemap */
  baseUrl:
    process.env.NEXT_PUBLIC_SITE_URL ??
    'https://developernick1-until.vercel.app',
  appName: APP_NAME,
  tagline: 'Countdown & time left. Day, month, year, life.',
  /** Contact email for privacy/legal inquiries (required for store listings) */
  contactEmail: SUPPORT_EMAIL,
  /**
   * DMCA designated agent. Must match the registration at
   * https://www.copyright.gov/dmca-directory/ exactly. Fields left null are hidden on /copyright.
   */
  copyrightAgent: {
    name: null as string | null,
    postalAddress: null as string | null,
    phone: null as string | null,
    email: SUPPORT_EMAIL,
    registrationNumber: null as string | null,
  },
  /** Placeholder; replace with real store URLs when published */
  playStoreUrl: 'https://play.google.com/store/apps/details?id=app.until.time',
  appStoreUrl: 'https://apps.apple.com/app/until/id000000000',
  /** Desktop installers and updater manifest live on this repo's desktop-v* releases. */
  githubRepo: 'DEVELOPERNICK21/UNTIL',
  desktopDownload: {
    mac: '/download/mac',
    windows: '/download/windows',
  },
  /** Pricing for landing page — mirrors live Play Store */
  pricing: {
    introLabel: 'Android Premium',
    introBadge: 'Best value · yearly',
    oneTimeLabel: `Free day & year + ${WEBSITE_PRICING.trialDays}-day Premium preview`,
    price: PRICING_DISPLAY.yearly,
    wasPrice: `${formatInr(WEBSITE_PRICING.monthlyInr * 12)}/year at monthly`,
    secondaryLine: `${PRICING_DISPLAY.weekly} · ${PRICING_DISPLAY.monthly} · ${PRICING_DISPLAY.lifetime}`,
    savePercent: yearlySavePercentVsMonthly,
    perDayLine: PRICING_DISPLAY.yearlyPerDay,
    savingsLine: PRICING_DISPLAY.yearlySavings,
    currencyNote: 'Prices shown in INR. Google Play may show regional pricing.',
  },
} as const;

export const ROUTES = {
  home: '/',

  terms: '/terms',
  privacy: '/privacy',
  copyright: '/copyright',
  play: '/play',
} as const;
