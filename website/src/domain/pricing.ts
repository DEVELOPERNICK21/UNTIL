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
