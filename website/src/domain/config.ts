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

export const SITE_CONFIG = {
  /** Base URL for canonical links and sitemap (replace with your domain) */
  baseUrl: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://until-app.com',
  appName: APP_NAME,
  tagline: 'Countdown & time left. Day, month, year, life.',
  /** Contact email for privacy/legal inquiries (required for store listings) */
  contactEmail: 'support@until-app.com',
  /** Placeholder; replace with real store URLs when published */
  playStoreUrl: 'https://play.google.com/store/apps/details?id=app.until.time',
  appStoreUrl: 'https://apps.apple.com/app/until/id000000000',
  /** Pricing for landing page — mirrors live Play Store */
  pricing: {
    introLabel: 'Android Premium',
    introBadge: 'Best value · yearly',
    oneTimeLabel: `Free day & year + ${WEBSITE_PRICING.trialDays}-day Premium preview`,
    price: PRICING_DISPLAY.yearly,
    wasPrice: `${formatInr(WEBSITE_PRICING.monthlyInr * 12)}/year at monthly`,
    secondaryLine: `${PRICING_DISPLAY.lifetime} · ${PRICING_DISPLAY.monthly} · ${PRICING_DISPLAY.studentYearly}`,
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
} as const;
