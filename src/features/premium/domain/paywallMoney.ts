/**
 * Paywall price maths, in the store's own currency.
 *
 * The store reports a numeric price and an ISO currency per product. Everything the paywall
 * shows beside a price (per day, the struck-through monthly × 12, the saving) is derived from
 * those numbers here, so a US, Indian or Japanese viewer sees figures in their own currency.
 * When a number or a currency is missing, or the comparison would not be true, the function
 * returns null and the caller leaves that line out instead of guessing.
 */

export type Money = { amount: number; currency: string };

const DAYS_PER_YEAR = 365;
const MONTHS_PER_YEAR = 12;

export function toMoney(
  row: { amount?: number; currency?: string } | undefined,
): Money | null {
  if (!row?.currency) return null;
  if (typeof row.amount !== 'number' || !Number.isFinite(row.amount)) return null;
  if (row.amount <= 0) return null;
  return { amount: row.amount, currency: row.currency };
}

/** Smallest-unit digits for a currency (JPY 0, USD 2). Falls back to 2 if Intl cannot say. */
export function currencyFractionDigits(currency: string): number {
  try {
    return new Intl.NumberFormat('en', { style: 'currency', currency })
      .resolvedOptions().maximumFractionDigits ?? 2;
  } catch {
    return 2;
  }
}

/**
 * The yearly price per day, rounded UP to the currency's smallest unit, so the paywall's
 * "Less than X/day" is always true (499 / 365 = 1.367 → 1.37; exact figures go one unit above).
 */
export function yearlyPerDay(yearly: Money | null): Money | null {
  if (!yearly) return null;
  const factor = 10 ** currencyFractionDigits(yearly.currency);
  const perDay = Math.floor((yearly.amount / DAYS_PER_YEAR) * factor + 1e-9) + 1;
  return { amount: perDay / factor, currency: yearly.currency };
}

/** Twelve monthly payments, shown struck through next to the yearly price. Null unless it is higher. */
export function monthlyTimesTwelve(
  monthly: Money | null,
  yearly: Money | null,
): Money | null {
  if (!monthly || !yearly || monthly.currency !== yearly.currency) return null;
  const anchor = monthly.amount * MONTHS_PER_YEAR;
  if (anchor <= yearly.amount) return null;
  return { amount: anchor, currency: monthly.currency };
}

/** Whole-percent saving of yearly against twelve monthly payments, rounded down. Null below 1%. */
export function yearlySavingPercent(
  monthly: Money | null,
  yearly: Money | null,
): number | null {
  const anchor = monthlyTimesTwelve(monthly, yearly);
  if (!anchor || !yearly) return null;
  const percent = Math.floor((1 - yearly.amount / anchor.amount) * 100);
  return percent >= 1 ? percent : null;
}
