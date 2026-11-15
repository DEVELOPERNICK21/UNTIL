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

const PLAY_STORE_LISTING = 'https://play.google.com/store/apps/details?id=app.until.time';
const APP_STORE_ID = '6813366004';
const APP_STORE_LISTING = `https://apps.apple.com/app/id${APP_STORE_ID}`;

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
  /** Store listings (plain links, for structured data and anywhere a tag is not wanted). */
  playStoreUrl: PLAY_STORE_LISTING,
  appStoreUrl: APP_STORE_LISTING,
  /** Numeric Apple ID: App Store Connect > App Information. Drives the iPhone Smart App Banner. */
  appStoreId: APP_STORE_ID,
  /**
   * The same links with a campaign, for the buttons on this site, so downloads that started on
   * the website show up as their own source (Play: referrer; App Store: ct, which also needs the
   * provider token in the link before App Store Connect groups it, see docs/ATTRIBUTION.md).
   */
  playStoreCtaUrl: `${PLAY_STORE_LISTING}&referrer=${encodeURIComponent(
    'utm_source=website&utm_medium=button',
  )}`,
  appStoreCtaUrl: `${APP_STORE_LISTING}?ct=website_button&mt=8`,
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
