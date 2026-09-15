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
  const [productsError, setProductsError] = useState<string | null>(null);

  const getProducts = useCallback(async (): Promise<BillingProductRow[]> => {
    setLoading(true);
    setProductsError(null);
    try {
      const { configured } = ensurePurchasesConfigured();
      if (!configured) {
        throw new Error(
          'RevenueCat API key missing. Add REVENUECAT_API_KEY_IOS and REVENUECAT_API_KEY_ANDROID to .env, then rebuild the native app (yarn android or yarn ios).'
        );
      }
      const offering = await getOfferingsUseCase.execute();
      const list = mapOfferingPackagesToRows(offering);
      if (list.length === 0) {
        setProductsError(
          'No plans returned from RevenueCat. Check offering "default" in the RevenueCat dashboard.'
        );
      }
      setProducts(list);
      return list;
    } catch (e) {
      const message =
        e instanceof Error ? e.message : 'Could not load subscription plans.';
      setProductsError(message);
      setProducts([]);
      if (__DEV__) {
        console.warn('[usePurchase] getProducts failed:', message);
      }
      return [];
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
    productsError,
    offeringsReady: products.length > 0,
    getProducts,
    requestPurchase,
    restorePurchases,
    handlePurchaseUpdate,
    productIds: BILLING_PRODUCT_IDS,
  };
}
