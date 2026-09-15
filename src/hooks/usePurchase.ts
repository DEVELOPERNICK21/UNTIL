/**
 * usePurchase — RevenueCat offerings surface for the custom paywall.
 */

import { useCallback, useState } from 'react';
import {
  ensurePurchasesConfigured,
  getOfferingsUseCase,
  purchasePackageUseCase,
  restorePurchasesUseCase,
} from '../di';
import { BILLING_PRODUCT_IDS } from '../config/billing';
import {
  mapOfferingPackagesToRows,
  type OfferingProductRow,
} from '../domain/billing/mapOfferingPackages';
import type { PurchasePackageResult } from '../domain/useCases/PurchasePackageUseCase';

export type BillingProductRow = OfferingProductRow;

export type { PurchasePackageResult };

export function usePurchase() {
  const [products, setProducts] = useState<BillingProductRow[]>([]);
  const [loading, setLoading] = useState(false);

  const getProducts = useCallback(async (): Promise<BillingProductRow[]> => {
    setLoading(true);
    try {
      ensurePurchasesConfigured();
      const offering = await getOfferingsUseCase.execute();
      const list = mapOfferingPackagesToRows(offering);
      setProducts(list);
      return list;
    } finally {
      setLoading(false);
    }
  }, []);

  const requestPurchase = useCallback(
    async (productId: string): Promise<PurchasePackageResult> => {
      ensurePurchasesConfigured();
      return purchasePackageUseCase.execute(productId);
    },
    []
  );

  const restorePurchases = useCallback(async (): Promise<{ restored: boolean }> => {
    ensurePurchasesConfigured();
    return restorePurchasesUseCase.execute();
  }, []);

  const handlePurchaseUpdate = useCallback(() => {}, []);

  return {
    products,
    loading,
    getProducts,
    requestPurchase,
    restorePurchases,
    handlePurchaseUpdate,
    productIds: BILLING_PRODUCT_IDS,
  };
}
