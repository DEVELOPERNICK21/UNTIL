/**
 * Monetization SSOT — pricing, paywall copy, and plan positioning.
 * See docs/MONETIZATION_STRATEGY.md and docs/MONETIZATION_SETUP.md.
 */

export const MONETIZATION_PRICING = {
  monthlyInr: 99,
  yearlyInr: 499,
  lifetimeInr: 1499,
  yearlyStudentInr: 249,
  yearlyRegionalTier2Inr: 399,
  yearlyPerDayDisplay: '₹1.37',
  yearlySavingsVsMonthlyDisplay: '₹692',
} as const;

/** Optional Play products — enable when created in Console. */
export const MONETIZATION_FEATURE_FLAGS = {
  studentPlanEnabled: true,
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

export const PAYWALL_DISMISS_COOLDOWN_MS = 48 * 60 * 60 * 1000;

export const MONETIZATION_PAYWALL_COPY = {
  headline: 'Your life is passing. Start watching it.',
  subheadline:
    'See every day, month, and year of your life — live on your home screen and overlay.',
  /** Shown on yearly plan — subscription bills immediately via Google Play (no Play free trial). */
  yearlyCta: 'Subscribe yearly',
  yearlyCtaSub:
    'Billed at the yearly price shown when you subscribe in Google Play. Cancel anytime in Google Play → Subscriptions before renewal.',
  yearlyCtaSubDuringPreview:
    'Your free app preview does not charge you. Subscribing bills the yearly price in Google Play. Cancel anytime in Google Play → Subscriptions.',
  monthlyCta: 'Monthly',
  monthlySub:
    'Billed monthly in Google Play when you subscribe. Cancel anytime in Google Play → Subscriptions.',
  lifetimeCta: 'Own it forever',
  lifetimeSub: 'One-time payment in Google Play · all Premium features · no renewal',
  studentCta: 'Student yearly',
  studentSub: 'Verify with student email in a future update · same Premium features',
  regionalNote:
    'Prices in your currency are set by Google Play (regional pricing may apply).',
  previewActiveTitle: 'Free app preview active',
  previewActiveBody:
    'Premium features unlocked for {days} days — no subscription or payment yet.',
  lifeUnlockEndedTitle: 'Keep your life progress visible',
  lifeUnlockEndedMessage:
    'Your 24-hour Life preview ended. Premium keeps your life %, month widget, and overlay on every day.',
  onboardingPaywallTitle: 'You have seen your life in weeks.',
  onboardingPaywallSub:
    'Keep month & life widgets, overlay, and your full Life screen. Try Premium free for 5 days in the app, or subscribe anytime.',
  freeForeverLine: 'Day & year widgets and Share stay free forever.',
} as const;

export const PREMIUM_BENEFITS = [
  'Month & Life home screen widgets',
  'Full Life progress screen',
  'Floating overlay — month & life (Android)',
  'Dynamic Island — month & life (iOS)',
  'Activity intervention alerts',
  `${MONETIZATION_TRIAL_DAYS}-day free app preview (no payment)`,
] as const;

export const PAYWALL_TRUST_SIGNALS = [
  'Cancel subscriptions in Google Play → Subscriptions',
  'Day + Year widgets free forever',
  'Secure payment via Google Play',
  `${MONETIZATION_TRIAL_DAYS}-day app preview before you subscribe`,
] as const;

/** Days left in the in-app preview (ceil), 0 if ended or unknown. */
export function trialPreviewDaysLeft(
  trialEndsAtMs: number | null,
  nowMs: number = Date.now()
): number {
  if (trialEndsAtMs == null || nowMs >= trialEndsAtMs) return 0;
  return Math.ceil((trialEndsAtMs - nowMs) / (24 * 60 * 60 * 1000));
}

export function formatPreviewActiveBody(trialEndsAtMs: number | null): string {
  const days = trialPreviewDaysLeft(trialEndsAtMs);
  const dayLabel = days === 1 ? '1 day' : `${days} days`;
  return MONETIZATION_PAYWALL_COPY.previewActiveBody.replace('{days}', dayLabel);
}

export function formatInr(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

export const FALLBACK_MONTHLY_PRICE = formatInr(MONETIZATION_PRICING.monthlyInr);
export const FALLBACK_YEARLY_PRICE = formatInr(MONETIZATION_PRICING.yearlyInr);
export const FALLBACK_LIFETIME_PRICE = formatInr(MONETIZATION_PRICING.lifetimeInr);
export const FALLBACK_STUDENT_YEARLY_PRICE = formatInr(
  MONETIZATION_PRICING.yearlyStudentInr
);
