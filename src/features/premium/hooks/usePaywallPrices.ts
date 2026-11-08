import { useMemo } from 'react';
import { BILLING_PRODUCT_IDS } from '../../../config/billing';
import {
  FALLBACK_LIFETIME_PRICE,
  FALLBACK_MONTHLY_PRICE,
  FALLBACK_STUDENT_YEARLY_PRICE,
  FALLBACK_WEEKLY_PRICE,
  FALLBACK_YEARLY_PRICE,
} from '../../../config/monetization';
import { useTranslation } from '../../../shared/i18n/useTranslation';
import {
  monthlyTimesTwelve,
  toMoney,
  yearlyPerDay,
  yearlySavingPercent,
  type Money,
} from '../domain/paywallMoney';

type ProductRow = {
  productId: string;
  price: string;
  amount?: number;
  currency?: string;
};

/** The store's own price string for a product (already in the person's currency), else a fallback. */
export function priceLabel(
  products: ProductRow[],
  productId: string,
  fallback: string,
): string {
  const p = products.find(x => x.productId === productId);
  return p?.price ?? fallback;
}

function moneyOf(products: ProductRow[], productId: string): Money | null {
  return toMoney(products.find(x => x.productId === productId));
}

type FormatNumber = ReturnType<typeof useTranslation>['formatNumber'];

/** `money` in its own currency, in the app language; null if the runtime cannot format it. */
function formatMoney(fmt: FormatNumber, money: Money | null): string | null {
  if (!money) return null;
  try {
    return fmt(money.amount, { style: 'currency', currency: money.currency });
  } catch {
    return null;
  }
}

/** Whole percent as the app language writes it ("72%"); null when there is no saving. */
function formatPercent(fmt: FormatNumber, percent: number | null): string | null {
  if (percent == null) return null;
  try {
    return fmt(percent / 100, { style: 'percent' });
  } catch {
    return `${percent}%`;
  }
}

/**
 * Display prices for every plan on the paywall. Store prices are shown as the store formats them.
 * The lines derived from them (per day, struck-through anchor, saving) are computed in the store's
 * currency and are null when the store gave no number to compute from.
 */
export function usePaywallPrices(
  products: ProductRow[],
  productIds: typeof BILLING_PRODUCT_IDS,
) {
  const { formatNumber } = useTranslation();
  return useMemo(() => {
    const yearlyMoney = moneyOf(products, productIds.yearly);
    const monthlyMoney = moneyOf(products, productIds.monthly);
    return {
      yearly: priceLabel(products, productIds.yearly, FALLBACK_YEARLY_PRICE),
      monthly: priceLabel(products, productIds.monthly, FALLBACK_MONTHLY_PRICE),
      weekly: priceLabel(
        products,
        productIds.weekly ?? 'weekly_subscription',
        FALLBACK_WEEKLY_PRICE,
      ),
      lifetime: priceLabel(
        products,
        productIds.lifetime,
        FALLBACK_LIFETIME_PRICE,
      ),
      student: priceLabel(
        products,
        productIds.yearlyStudent ?? 'yearly_subscription_student',
        FALLBACK_STUDENT_YEARLY_PRICE,
      ),
      /** "Less than {price}/day" for the yearly plan. */
      yearlyPerDay: formatMoney(formatNumber, yearlyPerDay(yearlyMoney)),
      /** The monthly price × 12, struck through next to the yearly price; null unless higher. */
      monthlyAnchorYearly: formatMoney(formatNumber, monthlyTimesTwelve(monthlyMoney, yearlyMoney)),
      /** Saving of yearly against twelve monthly payments, e.g. "72%". */
      yearlySavings: formatPercent(formatNumber, yearlySavingPercent(monthlyMoney, yearlyMoney)),
    };
  }, [products, productIds, formatNumber]);
}
