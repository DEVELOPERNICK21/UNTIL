import type { PurchasesOfferingDTO } from '../../types/purchases';

export type OfferingProductRow = {
  productId: string;
  title: string;
  description?: string;
  price: string;
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
    };
    if (pkg.description) {
      row.description = pkg.description;
    }
    return row;
  });
}
