/**
 * The plan cards of the custom paywall: yearly (primary), monthly, weekly.
 * Pure, so the "no figure we cannot back" rule is testable: the per-day line, the struck-through
 * anchor and the saving badge appear only when the store gave numbers to compute them from.
 */

import type { BILLING_PRODUCT_IDS } from '../../../config/billing';
import type { TranslateParams } from '../../../shared/i18n/translate';
import type { TranslationKey } from '../../../shared/i18n/resources';
import type { usePaywallPrices } from '../hooks/usePaywallPrices';
import type { PaywallPlanOption } from './PaywallPlanCards';

type Translate = (key: TranslationKey, params?: TranslateParams) => string;

export function buildPaywallPlans(
  productIds: typeof BILLING_PRODUCT_IDS,
  prices: ReturnType<typeof usePaywallPrices>,
  t: Translate,
): PaywallPlanOption[] {
  const plans: PaywallPlanOption[] = [
    {
      productId: productIds.yearly,
      title: t('premium.plan.yearly'),
      subtitle: prices.yearlyPerDay
        ? t('premium.plan.yearlySub', { price: prices.yearlyPerDay })
        : undefined,
      price: prices.yearly,
      periodLabel: t('premium.period.year'),
      renewalInterval: 'year',
      comparePrice: prices.monthlyAnchorYearly
        ? `${prices.monthlyAnchorYearly}${t('premium.period.year')}`
        : undefined,
      badge: prices.yearlySavings
        ? t('premium.plan.save', { amount: prices.yearlySavings })
        : undefined,
    },
    {
      productId: productIds.monthly,
      title: t('premium.plan.monthly'),
      subtitle: t('premium.plan.monthlySub'),
      price: prices.monthly,
      periodLabel: t('premium.period.month'),
      renewalInterval: 'month',
    },
  ];

  if (productIds.weekly) {
    plans.push({
      productId: productIds.weekly,
      title: t('premium.plan.weekly'),
      subtitle: t('premium.plan.weeklySub'),
      price: prices.weekly,
      periodLabel: t('premium.period.week'),
      renewalInterval: 'week',
    });
  }

  return plans;
}
