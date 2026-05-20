/**
 * usePurchase — Play Billing surface for paywall (Android). Listeners are attached via ensurePlayBillingSession.
 */

import { useCallback, useState } from 'react';
import {
  ensurePlayBillingSession,
  playBillingRepository,
  restorePurchasesUseCase,
} from '../di';
import { BILLING_PAYWALL_IDS, BILLING_PRODUCT_IDS } from '../config/billing';

export type BillingProductRow = {
  productId: string;
  title: string;
  description?: string;
  price: string;
  currency?: string;
};

const PAYWALL_PRODUCT_IDS = BILLING_PAYWALL_IDS;

export function usePurchase() {
  const [products, setProducts] = useState<BillingProductRow[]>([]);
  const [loading, setLoading] = useState(false);

  const getProducts = useCallback(async (): Promise<BillingProductRow[]> => {
    setLoading(true);
    try {
      await ensurePlayBillingSession();
      const list = await playBillingRepository.getProducts(PAYWALL_PRODUCT_IDS);
      setProducts(list);
      return list;
    } finally {
      setLoading(false);
    }
  }, []);

  const requestPurchase = useCallback(async (productId: string): Promise<void> => {
    await ensurePlayBillingSession();
    await playBillingRepository.requestPurchase(productId);
  }, []);

  const restorePurchases = useCallback(async (): Promise<{ restored: boolean }> => {
    await ensurePlayBillingSession();
    return restorePurchasesUseCase.execute();
  }, []);

  /** Reserved for parity with spec; purchase updates run through PlayBillingRepository listeners. */
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
