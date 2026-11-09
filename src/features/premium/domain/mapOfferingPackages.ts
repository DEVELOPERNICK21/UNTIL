import type { PurchasesOfferingDTO } from '../../../shared/types/purchases';

export type OfferingProductRow = {
  productId: string;
  title: string;
  description?: string;
  price: string;
  /** Numeric store price and its ISO currency, when the store reports them. */
  amount?: number;
  currency?: string;
};

export function mapOfferingPackagesToRows(
  offering: PurchasesOfferingDTO | null | undefined
): OfferingProductRow[] {
  if (!offering?.packages.length) {
    return [];
  }
  return offering.packages.map(pkg => {
    const row: OfferingProductRow = {
      productId: pkg.productId,
      title: pkg.title,
      price: pkg.priceString,
      amount: pkg.price,
      currency: pkg.currencyCode,
    };
    if (pkg.description) {
      row.description = pkg.description;
    }
    return row;
  });
}
