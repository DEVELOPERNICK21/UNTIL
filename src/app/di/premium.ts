/**
 * Premium feature: subscription state, purchases, trial preview, access rules.
 */

import { SyncTrialPreviewUseCase } from '../../features/premium/domain/useCases/SyncTrialPreviewUseCase';
import { logAnalyticsEvent } from '../../shared/analytics/analytics';
import { getTrialDurationDays } from '../../shared/analytics/analyticsUserProperties';
import { ObserveSubscriptionUseCase } from '../../features/premium/domain/useCases/ObserveSubscriptionUseCase';
import { UpdateSubscriptionUseCase } from '../../features/premium/domain/useCases/UpdateSubscriptionUseCase';
import { GetAccessStateUseCase } from '../../features/premium/domain/useCases/GetAccessStateUseCase';
import { VerifyStudentEmailUseCase } from '../../features/premium/domain/useCases/VerifyStudentEmailUseCase';
import { SyncCustomerInfoUseCase } from '../../features/premium/domain/useCases/SyncCustomerInfoUseCase';
import { PresentRevenueCatPaywallUseCase } from '../../features/premium/domain/useCases/PresentRevenueCatPaywallUseCase';
import { ConfigurePurchasesUseCase } from '../../features/premium/domain/useCases/ConfigurePurchasesUseCase';
import { GetOfferingsUseCase } from '../../features/premium/domain/useCases/GetOfferingsUseCase';
import { PurchasePackageUseCase } from '../../features/premium/domain/useCases/PurchasePackageUseCase';
import { RestorePurchasesUseCase } from '../../features/premium/domain/useCases/RestorePurchasesUseCase';
import { IdentifyPurchasesUserUseCase } from '../../features/premium/domain/useCases/IdentifyPurchasesUserUseCase';
import { ResetPurchasesUserUseCase } from '../../features/premium/domain/useCases/ResetPurchasesUserUseCase';
import { ActivateLicenseUseCase } from '../../features/premium/domain/useCases/ActivateLicenseUseCase';
import { VerifySubscriptionUseCase } from '../../features/premium/domain/useCases/VerifySubscriptionUseCase';
import {
  authSessionRepository,
  deviceIdProvider,
  licenseVerificationService,
  paywallPresenter,
  purchasesRepository,
  studentVerificationRepository,
  subscriptionRepository,
  trialPreviewService,
} from './repositories';
import { syncPremiumAfterEntitlementChange } from './callbacks';
import { assertAccountAgeGateUseCase } from './ageGate';

export const syncTrialPreviewUseCase = new SyncTrialPreviewUseCase(
  subscriptionRepository,
  deviceIdProvider,
  trialPreviewService,
  syncPremiumAfterEntitlementChange,
  () => {
    void logAnalyticsEvent('trial_preview_started', {
      trial_days: getTrialDurationDays(),
      source: 'in_app_preview',
    });
  }
);

export const observeSubscriptionUseCase = new ObserveSubscriptionUseCase(subscriptionRepository);

export const updateSubscriptionUseCase = new UpdateSubscriptionUseCase(subscriptionRepository);

export const getAccessStateUseCase = new GetAccessStateUseCase(
  subscriptionRepository,
  authSessionRepository
);

export const verifyStudentEmailUseCase = new VerifyStudentEmailUseCase(
  studentVerificationRepository,
  assertAccountAgeGateUseCase
);

export const syncCustomerInfoUseCase = new SyncCustomerInfoUseCase(
  subscriptionRepository,
  syncPremiumAfterEntitlementChange
);

export const presentRevenueCatPaywallUseCase = new PresentRevenueCatPaywallUseCase(
  paywallPresenter,
  purchasesRepository,
  syncCustomerInfoUseCase
);

export const configurePurchasesUseCase = new ConfigurePurchasesUseCase(
  purchasesRepository
);

export const getOfferingsUseCase = new GetOfferingsUseCase(purchasesRepository);

export const purchasePackageUseCase = new PurchasePackageUseCase(
  purchasesRepository,
  syncCustomerInfoUseCase
);

export const restorePurchasesUseCase = new RestorePurchasesUseCase(
  purchasesRepository,
  syncCustomerInfoUseCase
);

export const identifyPurchasesUserUseCase = new IdentifyPurchasesUserUseCase(
  purchasesRepository,
  syncCustomerInfoUseCase
);

export const resetPurchasesUserUseCase = new ResetPurchasesUserUseCase(
  purchasesRepository,
  syncCustomerInfoUseCase
);

let purchasesConfigured = false;

export function ensurePurchasesConfigured(): { configured: boolean } {
  if (purchasesConfigured) {
    return { configured: true };
  }
  const result = configurePurchasesUseCase.execute();
  if (result.configured) {
    purchasesConfigured = true;
  }
  return result;
}

export const activateLicenseUseCase = new ActivateLicenseUseCase(
  subscriptionRepository,
  deviceIdProvider,
  licenseVerificationService
);

export const verifySubscriptionUseCase = new VerifySubscriptionUseCase(
  subscriptionRepository,
  deviceIdProvider,
  licenseVerificationService
);
