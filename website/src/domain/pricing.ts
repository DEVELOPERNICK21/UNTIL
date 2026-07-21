/**
 * Website pricing SSOT — mirrors live Play Store (see src/config/monetization.ts in app).
 */

export const WEBSITE_PRICING = {
  monthlyInr: 99,
  yearlyInr: 499,
  lifetimeInr: 1499,
  yearlyStudentInr: 249,
  trialDays: 5,
  yearlyPerDayDisplay: '₹1.37',
  yearlySavingsVsMonthlyDisplay: '₹692',
} as const;

export function formatInr(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

export const yearlySavePercentVsMonthly = Math.round(
  ((WEBSITE_PRICING.monthlyInr * 12 - WEBSITE_PRICING.yearlyInr) /
    (WEBSITE_PRICING.monthlyInr * 12)) *
    100
);

export const PRICING_DISPLAY = {
  monthly: `${formatInr(WEBSITE_PRICING.monthlyInr)}/month`,
  yearly: `${formatInr(WEBSITE_PRICING.yearlyInr)}/year`,
  lifetime: `${formatInr(WEBSITE_PRICING.lifetimeInr)} once`,
  studentYearly: `${formatInr(WEBSITE_PRICING.yearlyStudentInr)}/year student`,
  yearlyPerDay: `Less than ${WEBSITE_PRICING.yearlyPerDayDisplay}/day on yearly`,
  yearlySavings: `Save ${WEBSITE_PRICING.yearlySavingsVsMonthlyDisplay}/year vs monthly`,
  trialLine: `${WEBSITE_PRICING.trialDays}-day free Premium app preview (no Google Play charge)`,
  introLine: `Start free. Premium: ${WEBSITE_PRICING.trialDays}-day app preview, then ${formatInr(WEBSITE_PRICING.yearlyInr)}/year, ${formatInr(WEBSITE_PRICING.lifetimeInr)} lifetime, ${formatInr(WEBSITE_PRICING.monthlyInr)}/month, or ${formatInr(WEBSITE_PRICING.yearlyStudentInr)}/year student on Android.`,
} as const;

export type PricingPlanId = 'free' | 'monthly' | 'yearly' | 'lifetime';

export type PricingPlanCard = {
  id: PricingPlanId;
  name: string;
  tagline: string;
  priceLabel: string;
  priceHint?: string;
  ctaLabel: string;
  ctaVariant: 'primary' | 'secondary';
  includesLabel: string;
  features: readonly string[];
  badge?: string;
};

/** Cursor-style plan cards for the landing pricing section. */
export const PRICING_PLAN_CARDS: readonly PricingPlanCard[] = [
  {
    id: 'free',
    name: 'Free',
    tagline: 'Keep the basics forever',
    priceLabel: 'Free',
    priceHint: 'No credit card required',
    ctaLabel: 'Get on Google Play',
    ctaVariant: 'secondary',
    includesLabel: 'Includes:',
    features: [
      'Day & year home screen widgets',
      'Share snapshot',
      'Custom counters & countdowns',
      `${WEBSITE_PRICING.trialDays}-day Premium preview in-app`,
    ],
  },
  {
    id: 'monthly',
    name: 'Monthly',
    tagline: 'Flexible Premium',
    priceLabel: `${formatInr(WEBSITE_PRICING.monthlyInr)}/mo.`,
    priceHint: 'Cancel anytime in Google Play',
    ctaLabel: 'Get Monthly',
    ctaVariant: 'secondary',
    includesLabel: 'Everything in Free, plus:',
    features: [
      'Month & Life widgets',
      'Full Life progress screen',
      'Floating overlay (Android)',
      'Lost-time alerts',
      'Widget accent colors',
    ],
  },
  {
    id: 'yearly',
    name: 'Yearly',
    tagline: 'Best value for Premium',
    priceLabel: `${formatInr(WEBSITE_PRICING.yearlyInr)}/yr.`,
    priceHint: `${PRICING_DISPLAY.yearlyPerDay} · save ${yearlySavePercentVsMonthly}% vs monthly`,
    ctaLabel: 'Get Yearly',
    ctaVariant: 'primary',
    badge: 'Best value',
    includesLabel: 'Everything in Monthly:',
    features: [
      'Month & Life widgets, Life screen, overlay, alerts',
      `Student option: ${PRICING_DISPLAY.studentYearly}`,
      'Billed once a year in Google Play',
      'Cancel before renewal anytime',
    ],
  },
  {
    id: 'lifetime',
    name: 'Lifetime',
    tagline: 'Pay once, keep Premium',
    priceLabel: `${formatInr(WEBSITE_PRICING.lifetimeInr)}`,
    priceHint: 'One-time · no renewal',
    ctaLabel: 'Get Lifetime',
    ctaVariant: 'secondary',
    includesLabel: 'Everything in Yearly, plus:',
    features: [
      'All Premium features forever',
      'No subscription to manage',
      'One Google Play purchase',
    ],
  },
] as const;
