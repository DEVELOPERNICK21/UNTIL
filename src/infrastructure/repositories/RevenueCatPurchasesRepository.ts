/**
 * RevenueCat purchases adapter via react-native-purchases.
 * Surfaces and use cases must not import the SDK; they consume IPurchasesRepository.
 *
 * User cancel: purchasePackage rejects with PurchasesError where
 * `userCancelled === true` (code PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR = "1").
 * This adapter rethrows PurchaseCancelledError so Task 6 can call
 * isPurchaseCancelledError(e) → `{ status: 'cancelled' }` without importing the SDK.
 */

import Purchases, {
  LOG_LEVEL,
  PURCHASES_ERROR_CODE,
  type CustomerInfo,
  type CustomerInfoUpdateListener,
  type PurchasesOffering,
  type PurchasesPackage,
} from 'react-native-purchases';
import type { IPurchasesRepository } from '../../domain/repository/IPurchasesRepository';
import {
  PurchaseCancelledError,
  isPurchaseCancelledError,
} from '../../domain/errors/purchasesErrors';
import { storeProductIdsMatch, normalizeStoreProductId } from '../../domain/billing/mapProductId';
import { BILLING_PRODUCT_IDS } from '../../config/billing';
import type {
  CustomerInfoDTO,
  PurchasesOfferingDTO,
  PurchasesPackageDTO,
} from '../../types/purchases';

/** Map app product ids → RevenueCat package lookup keys. */
const PACKAGE_LOOKUP_BY_PRODUCT: Record<string, string> = {
  [BILLING_PRODUCT_IDS.weekly]: '$rc_weekly',
  [BILLING_PRODUCT_IDS.monthly]: '$rc_monthly',
  [BILLING_PRODUCT_IDS.yearly]: '$rc_annual',
  [BILLING_PRODUCT_IDS.lifetime]: '$rc_lifetime',
  [BILLING_PRODUCT_IDS.yearlyStudent]: 'student_yearly',
};

function toDTO(info: CustomerInfo): CustomerInfoDTO {
  const active = Object.entries(info.entitlements.active).map(([id, e]) => ({
    identifier: id,
    productIdentifier: e.productIdentifier,
    latestPurchaseDateMs: e.latestPurchaseDate
      ? Date.parse(e.latestPurchaseDate)
      : null,
    expirationDateMs: e.expirationDate ? Date.parse(e.expirationDate) : null,
    willRenew: e.willRenew,
  }));
  return {
    activeEntitlements: active,
    allPurchasedProductIds: info.allPurchasedProductIdentifiers ?? [],
  };
}

function toPackageDTO(pkg: PurchasesPackage): PurchasesPackageDTO {
  return {
    identifier: pkg.identifier,
    // Custom paywall keys off base product ids (yearly_subscription), not base-plan suffixes.
    productId: normalizeStoreProductId(pkg.product.identifier),
    title: pkg.product.title,
    description: pkg.product.description,
    priceString: pkg.product.priceString,
  };
}

function toOfferingDTO(offering: PurchasesOffering): PurchasesOfferingDTO {
  return {
    identifier: offering.identifier,
    packages: offering.availablePackages.map(toPackageDTO),
  };
}

function findPackageByProductId(
  productId: string,
  offering: PurchasesOffering | null | undefined,
): PurchasesPackage | undefined {
  if (!offering) return undefined;

  const normalized = normalizeStoreProductId(productId);
  const packageKey = PACKAGE_LOOKUP_BY_PRODUCT[normalized];

  const byProduct = offering.availablePackages.find(pkg =>
    storeProductIdsMatch(pkg.product.identifier, productId),
  );
  if (byProduct) return byProduct;

  if (packageKey) {
    const byPackageId = offering.availablePackages.find(
      pkg => pkg.identifier === packageKey,
    );
    if (byPackageId) return byPackageId;
  }

  // Convenience accessors from the SDK
  if (normalized === BILLING_PRODUCT_IDS.yearly && offering.annual) {
    return offering.annual;
  }
  if (normalized === BILLING_PRODUCT_IDS.monthly && offering.monthly) {
    return offering.monthly;
  }
  if (normalized === BILLING_PRODUCT_IDS.weekly && offering.weekly) {
    return offering.weekly;
  }
  if (normalized === BILLING_PRODUCT_IDS.lifetime && offering.lifetime) {
    return offering.lifetime;
  }

  return undefined;
}

export class RevenueCatPurchasesRepository implements IPurchasesRepository {
  configure(apiKey: string): void {
    Purchases.configure({ apiKey });
  }

  setDebugLogs(enabled: boolean): void {
    void Purchases.setLogLevel(enabled ? LOG_LEVEL.DEBUG : LOG_LEVEL.INFO);
  }

  async getOfferings(): Promise<PurchasesOfferingDTO | null> {
    const offerings = await Purchases.getOfferings();
    const offering = offerings.current ?? offerings.all?.['default'] ?? null;
    if (!offering) return null;
    return toOfferingDTO(offering);
  }

  async purchaseProductId(productId: string): Promise<CustomerInfoDTO> {
    const pkg = await this.findPackage(productId);
    if (!pkg) {
      throw new Error(`No RevenueCat package found for product id: ${productId}`);
    }
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      return toDTO(customerInfo);
    } catch (error) {
      throw wrapPurchaseError(error);
    }
  }

  async restorePurchases(): Promise<CustomerInfoDTO> {
    const info = await Purchases.restorePurchases();
    return toDTO(info);
  }

  async getCustomerInfo(): Promise<CustomerInfoDTO> {
    const info = await Purchases.getCustomerInfo();
    return toDTO(info);
  }

  addCustomerInfoListener(
    listener: (info: CustomerInfoDTO) => void,
  ): () => void {
    const wrapped: CustomerInfoUpdateListener = info => {
      listener(toDTO(info));
    };
    Purchases.addCustomerInfoUpdateListener(wrapped);
    return () => {
      Purchases.removeCustomerInfoUpdateListener(wrapped);
    };
  }

  async logIn(appUserId: string): Promise<CustomerInfoDTO> {
    const { customerInfo } = await Purchases.logIn(appUserId);
    return toDTO(customerInfo);
  }

  async logOut(): Promise<CustomerInfoDTO> {
    const info = await Purchases.logOut();
    return toDTO(info);
  }

  private async findPackage(productId: string): Promise<PurchasesPackage | null> {
    const offerings = await Purchases.getOfferings();
    const fromCurrent = findPackageByProductId(productId, offerings.current);
    if (fromCurrent) return fromCurrent;
    for (const offering of Object.values(offerings.all ?? {})) {
      const found = findPackageByProductId(productId, offering);
      if (found) return found;
    }
    return null;
  }
}

function formatPurchasesError(error: unknown): string {
  if (error == null) return 'Purchase failed';
  if (typeof error === 'string') return error;

  const e = error as {
    message?: unknown;
    underlyingErrorMessage?: unknown;
    userInfo?: { underlyingErrorMessage?: unknown; message?: unknown };
    code?: unknown;
  };
  const message =
    (typeof e.message === 'string' && e.message) ||
    (typeof e.userInfo?.message === 'string' && e.userInfo.message) ||
    'Purchase failed';
  const underlying =
    (typeof e.underlyingErrorMessage === 'string' &&
      e.underlyingErrorMessage) ||
    (typeof e.userInfo?.underlyingErrorMessage === 'string' &&
      e.userInfo.underlyingErrorMessage) ||
    '';
  const code =
    e.code != null && String(e.code).length > 0 ? ` [${String(e.code)}]` : '';
  if (underlying && !message.includes(underlying)) {
    return `${message}${code}: ${underlying}`;
  }
  return `${message}${code}`;
}

function wrapPurchaseError(error: unknown): Error {
  if (isSdkUserCancelled(error) || isPurchaseCancelledError(error)) {
    return new PurchaseCancelledError();
  }
  if (error instanceof Error) {
    const detail = formatPurchasesError(error);
    if (detail !== error.message) {
      return new Error(detail);
    }
    return error;
  }
  return new Error(formatPurchasesError(error));
}

function isSdkUserCancelled(error: unknown): boolean {
  if (error == null || typeof error !== 'object') return false;
  const e = error as { userCancelled?: unknown; code?: unknown };
  if (e.userCancelled === true) return true;
  return String(e.code) === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR;
}
