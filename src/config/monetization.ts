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

export const MONETIZATION_TRIAL_DAYS = 14;

/** Trial reminder schedule (day of trial, 1-based). */
export const TRIAL_REMINDER_DAYS = [10, 13, 14] as const;

export const PAYWALL_DISMISS_COOLDOWN_MS = 48 * 60 * 60 * 1000;

export const MONETIZATION_PAYWALL_COPY = {
  headline: 'Your life is passing. Start watching it.',
  subheadline:
    'See every day, month, and year of your life — live on your home screen and overlay.',
  yearlyCta: 'Start 14-day free trial',
  yearlyCtaSub:
    'Then billed yearly. Cancel anytime in Google Play before renewal — no surprise charges.',
  monthlyCta: 'Monthly',
  monthlySub: 'Flexible · cancel anytime in Google Play',
  lifetimeCta: 'Own it forever',
  lifetimeSub: 'One-time payment · all Premium features · no renewal',
  studentCta: 'Student yearly',
  studentSub: 'Verify with student email in a future update · same Premium features',
  regionalNote:
    'Prices in your currency are set by Google Play (regional pricing may apply).',
  lifeUnlockEndedTitle: 'Keep your life progress visible',
  lifeUnlockEndedMessage:
    'Your 24-hour Life preview ended. Premium keeps your life %, month widget, and overlay on every day.',
  onboardingPaywallTitle: 'You have seen your life in weeks.',
  onboardingPaywallSub:
    'Keep month & life widgets, overlay, and your full Life screen — with a 14-day trial on yearly.',
  freeForeverLine: 'Day & year widgets and Share stay free forever.',
  trialReminderDay10:
    '4 days left in your Premium trial. Keep your Life screen and widgets.',
  trialReminderDay13:
    'Last day tomorrow — renew to keep month & life widgets without interruption.',
  trialReminderDay14:
    'Your trial ends today. ₹499/year keeps everything — less than ₹1.37/day.',
} as const;

export const PREMIUM_BENEFITS = [
  'Month & Life home screen widgets',
  'Full Life progress screen',
  'Floating overlay — month & life (Android)',
  'Dynamic Island — month & life (iOS)',
  'Activity intervention alerts',
  `${MONETIZATION_TRIAL_DAYS}-day trial on yearly plan`,
] as const;

export const PAYWALL_TRUST_SIGNALS = [
  'Cancel anytime in Google Play',
  'Day + Year widgets free forever',
  'Secure payment via Google Play',
  '14-day trial on yearly',
] as const;

export function formatInr(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

export const FALLBACK_MONTHLY_PRICE = formatInr(MONETIZATION_PRICING.monthlyInr);
export const FALLBACK_YEARLY_PRICE = formatInr(MONETIZATION_PRICING.yearlyInr);
export const FALLBACK_LIFETIME_PRICE = formatInr(MONETIZATION_PRICING.lifetimeInr);
export const FALLBACK_STUDENT_YEARLY_PRICE = formatInr(
  MONETIZATION_PRICING.yearlyStudentInr
);
