import { MS_PER_DAY, MS_PER_HOUR } from '../shared/time/constants';
import { SITE_URL } from './storeUrls';
/**
 * Monetization SSOT — pricing, trial rules and store links. The words on the paywall live in
 * the `premium` locale files and are assembled in ./paywallCopy.
 * See docs/MONETIZATION_STRATEGY.md and docs/MONETIZATION_SETUP.md.
 */

export const MONETIZATION_PRICING = {
  weeklyInr: 49,
  monthlyInr: 149,
  yearlyInr: 499,
  lifetimeInr: 1999,
  yearlyStudentInr: 249,
  yearlyRegionalTier2Inr: 399,
} as const;

/** Optional Play products — enable when created in Console. */
export const MONETIZATION_FEATURE_FLAGS = {
  studentPlanEnabled: true,
  /** Show social-proof line when a verified watcher count is set. */
  socialProofEnabled: true,
} as const;

/**
 * Social proof — only show a numeric claim when `verifiedActiveWatchers` is set
 * from a real source (Play Console / analytics). Do not invent counts.
 */
export const PAYWALL_SOCIAL_PROOF = {
  /** null until a verified figure is available — line stays hidden. */
  verifiedActiveWatchers: null as number | null,
} as const;

export const MONETIZATION_TRIAL_DAYS = 5;

/** Trial reminder schedule (day of trial, 1-based) — last 3 days of preview. */
export const TRIAL_REMINDER_DAYS: readonly number[] =
  MONETIZATION_TRIAL_DAYS >= 3
    ? [
        MONETIZATION_TRIAL_DAYS - 2,
        MONETIZATION_TRIAL_DAYS - 1,
        MONETIZATION_TRIAL_DAYS,
      ]
    : [MONETIZATION_TRIAL_DAYS];

export const PAYWALL_DISMISS_COOLDOWN_MS = 48 * MS_PER_HOUR;

/** Legal pages — must be live HTTPS pages used in App Store / Play listing. */
export const LEGAL_URLS = {
  privacy: `${SITE_URL}/privacy`,
  terms: `${SITE_URL}/terms`,
} as const;

/**
 * Desktop companion downloads (Mac .dmg, Windows setup). The phone opens the
 * installer link; finish the download on that computer.
 */
export const DESKTOP_DOWNLOAD_URLS = {
  page: `${SITE_URL}/#desktop`,
  mac: `${SITE_URL}/download/mac`,
  windows: `${SITE_URL}/download/windows`,
} as const;

/** Store pages where the user can cancel. Opened by Settings › Manage subscription. */
export const SUBSCRIPTION_MANAGE_URLS = {
  ios: 'https://apps.apple.com/account/subscriptions',
  android:
    'https://play.google.com/store/account/subscriptions?package=app.until.time',
} as const;

export type RenewalInterval = 'week' | 'month' | 'year';

/** Days left in the in-app preview (ceil), 0 if ended or unknown. */
export function trialPreviewDaysLeft(
  trialEndsAtMs: number | null,
  nowMs: number = Date.now()
): number {
  if (trialEndsAtMs == null || nowMs >= trialEndsAtMs) return 0;
  return Math.ceil((trialEndsAtMs - nowMs) / MS_PER_DAY);
}

export function formatInr(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

export const FALLBACK_WEEKLY_PRICE = formatInr(MONETIZATION_PRICING.weeklyInr);
export const FALLBACK_MONTHLY_PRICE = formatInr(MONETIZATION_PRICING.monthlyInr);
export const FALLBACK_YEARLY_PRICE = formatInr(MONETIZATION_PRICING.yearlyInr);
export const FALLBACK_LIFETIME_PRICE = formatInr(MONETIZATION_PRICING.lifetimeInr);
export const FALLBACK_STUDENT_YEARLY_PRICE = formatInr(
  MONETIZATION_PRICING.yearlyStudentInr
);
