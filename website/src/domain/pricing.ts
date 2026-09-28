/**
 * Website pricing SSOT — mirrors app `src/config/monetization.ts`.
 */

export const WEBSITE_PRICING = {
  weeklyInr: 49,
  monthlyInr: 149,
  yearlyInr: 499,
  lifetimeInr: 1999,
  yearlyStudentInr: 249,
  trialDays: 5,
  yearlyPerDayDisplay: '₹1.37',
  yearlySavingsVsMonthlyDisplay: '₹1,289',
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
  weekly: `${formatInr(WEBSITE_PRICING.weeklyInr)}/week`,
  monthly: `${formatInr(WEBSITE_PRICING.monthlyInr)}/month`,
  yearly: `${formatInr(WEBSITE_PRICING.yearlyInr)}/year`,
  lifetime: `${formatInr(WEBSITE_PRICING.lifetimeInr)} once`,
  studentYearly: `${formatInr(WEBSITE_PRICING.yearlyStudentInr)}/year student`,
  yearlyPerDay: `Less than ${WEBSITE_PRICING.yearlyPerDayDisplay}/day on yearly`,
  yearlySavings: `Save ${WEBSITE_PRICING.yearlySavingsVsMonthlyDisplay}/year vs monthly`,
  trialLine: `${WEBSITE_PRICING.trialDays}-day free Premium app preview (no store charge)`,
  introLine: `Start free. Premium: ${WEBSITE_PRICING.trialDays}-day app preview, then ${formatInr(WEBSITE_PRICING.yearlyInr)}/year, ${formatInr(WEBSITE_PRICING.monthlyInr)}/month, ${formatInr(WEBSITE_PRICING.weeklyInr)}/week, ${formatInr(WEBSITE_PRICING.lifetimeInr)} lifetime, or ${formatInr(WEBSITE_PRICING.yearlyStudentInr)}/year student.`,
} as const;

export type PricingPlanId = 'free' | 'weekly' | 'monthly' | 'yearly';

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

/** Landing cards: free + weekly · monthly · yearly (lifetime is secondary, not a 5th card). */
export const PRICING_PLAN_CARDS: readonly PricingPlanCard[] = [
  {
    id: 'free',
    name: 'Free',
    tagline: 'Keep the basics forever',
    priceLabel: 'Free',
    priceHint: 'No credit card required',
    ctaLabel: 'Get the app',
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
    id: 'weekly',
    name: 'Weekly',
    tagline: 'Try Premium for a week',
    priceLabel: `${formatInr(WEBSITE_PRICING.weeklyInr)}/wk.`,
    priceHint: 'Cancel anytime in your app store',
    ctaLabel: 'Get Weekly',
    ctaVariant: 'secondary',
    includesLabel: 'Everything in Free, plus:',
    features: [
      'Month & Life widgets',
      'Full Life progress screen',
      'Floating overlay (Android)',
      'Lost-time alerts',
    ],
  },
  {
    id: 'monthly',
    name: 'Monthly',
    tagline: 'Flexible Premium',
    priceLabel: `${formatInr(WEBSITE_PRICING.monthlyInr)}/mo.`,
    priceHint: 'Cancel anytime in your app store',
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
      `Or own it forever: ${PRICING_DISPLAY.lifetime}`,
      `Student option: ${PRICING_DISPLAY.studentYearly}`,
      'Cancel before renewal anytime',
    ],
  },
] as const;
