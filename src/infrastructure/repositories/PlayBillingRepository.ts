/**
 * Google Play Billing via react-native-iap (Android only).
 */

import { Platform } from 'react-native';
import type { Purchase, ProductSubscriptionAndroid, ProductAndroid } from 'react-native-iap';
import {
  initConnection,
  endConnection,
  fetchProducts,
  requestPurchase,
  getAvailablePurchases,
  finishTransaction,
  purchaseUpdatedListener,
  purchaseErrorListener,
} from 'react-native-iap';
import type { IPlayBillingRepository } from '../../domain/repository/IPlayBillingRepository';
import {
  BILLING_INAPP_IDS,
  BILLING_SUBSCRIPTION_IDS,
  isLifetimeProductId,
  isSubscriptionProductId,
} from '../../config/billing';

type PurchaseListener = (purchase: Purchase) => void;
type ErrorListener = (message: string, code?: string) => void;

function firstSubscriptionOfferToken(
  product: ProductSubscriptionAndroid
): string | null {
  const offers = product.subscriptionOffers;
  if (offers?.length) {
    const t = offers[0]?.offerTokenAndroid;
    if (t) return t;
  }
  const legacy = product.subscriptionOfferDetailsAndroid;
  if (legacy?.length) {
    return legacy[0]?.offerToken ?? null;
  }
  return null;
}

export class PlayBillingRepository implements IPlayBillingRepository {
  private offerTokenBySku = new Map<string, string>();
  private connectionStarted = false;
  private listenersAttached = false;
  private purchaseSub: { remove(): void } | null = null;
  private errorSub: { remove(): void } | null = null;

  constructor(
    private readonly onPurchaseUpdate: (purchase: Purchase) => Promise<void>,
    private readonly onPurchaseError?: ErrorListener
  ) {}

  async initConnection(): Promise<void> {
    if (Platform.OS !== 'android') return;
    if (this.connectionStarted) return;
    await initConnection();
    this.connectionStarted = true;
  }

  async endConnection(): Promise<void> {
    if (Platform.OS !== 'android') return;
    this.detachListeners();
    if (!this.connectionStarted) return;
    await endConnection();
    this.connectionStarted = false;
  }

  /**
   * Attach global purchase listeners once (call after initConnection).
   */
  attachPurchaseListeners(): void {
    if (Platform.OS !== 'android' || this.listenersAttached) return;
    this.listenersAttached = true;

    this.purchaseSub = purchaseUpdatedListener(purchase => {
      void this.onPurchaseUpdate(purchase);
    });

    this.errorSub = purchaseErrorListener(err => {
      this.onPurchaseError?.(err.message, String(err.code));
    });
  }

  private detachListeners(): void {
    this.purchaseSub?.remove();
    this.errorSub?.remove();
    this.purchaseSub = null;
    this.errorSub = null;
    this.listenersAttached = false;
  }

  async getProducts(
    productIds: string[]
  ): Promise<
    Array<{
      productId: string;
      title: string;
      description?: string;
      price: string;
      currency?: string;
    }>
  > {
    if (Platform.OS !== 'android') return [];

    const subSkus = productIds.filter(id => BILLING_SUBSCRIPTION_IDS.includes(id));
    const inAppSkus = productIds.filter(id => BILLING_INAPP_IDS.includes(id));

    const out: Array<{
      productId: string;
      title: string;
      description?: string;
      price: string;
      currency?: string;
    }> = [];

    if (subSkus.length > 0) {
      const subs = await fetchProducts({ skus: subSkus, type: 'subs' });
      const list = (subs ?? []) as ProductSubscriptionAndroid[];
      for (const p of list) {
        const token = firstSubscriptionOfferToken(p);
        if (token) this.offerTokenBySku.set(p.id, token);
        out.push({
          productId: p.id,
          title: p.title,
          description: p.description,
          price: p.displayPrice,
          currency: p.currency,
        });
      }
    }

    if (inAppSkus.length > 0) {
      const apps = await fetchProducts({ skus: inAppSkus, type: 'in-app' });
      const list = (apps ?? []) as ProductAndroid[];
      for (const p of list) {
        out.push({
          productId: p.id,
          title: p.title,
          description: p.description,
          price: p.displayPrice,
          currency: p.currency,
        });
      }
    }

    return out;
  }

  async requestPurchase(productId: string): Promise<void> {
    if (Platform.OS !== 'android') return;

    if (isSubscriptionProductId(productId)) {
      const offerToken = this.offerTokenBySku.get(productId);
      if (!offerToken) {
        await this.getProducts([productId]);
      }
      const token = this.offerTokenBySku.get(productId);
      if (!token) {
        throw new Error('Subscription offer not available. Check Play Console product setup.');
      }
      await requestPurchase({
        type: 'subs',
        request: {
          google: {
            skus: [productId],
            subscriptionOffers: [{ sku: productId, offerToken: token }],
          },
        },
      });
      return;
    }

    if (isLifetimeProductId(productId)) {
      await requestPurchase({
        type: 'in-app',
        request: {
          google: { skus: [productId] },
        },
      });
      return;
    }

    throw new Error(`Unknown product: ${productId}`);
  }

  async restorePurchases(): Promise<
    Array<{ productId: string; purchaseToken?: string; transactionDate?: number }>
  > {
    if (Platform.OS !== 'android') return [];

    const purchases = await getAvailablePurchases({
      alsoPublishToEventListenerIOS: false,
    });
    const list = (purchases ?? []) as Purchase[];
    return list.map(p => ({
      productId: p.productId,
      purchaseToken: p.purchaseToken ?? undefined,
      transactionDate: p.transactionDate,
    }));
  }

  /** Complete the transaction after entitlement was written (subscriptions / non-consumables). */
  async finalizePurchase(purchase: Purchase): Promise<void> {
    if (Platform.OS !== 'android') return;
    await finishTransaction({ purchase, isConsumable: false });
  }
}
