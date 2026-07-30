/**
 * BindEntitlementToAccountUseCase — move premium from "this device" to "this
 * account" and mirror the account entitlement back down.
 *
 * Rules:
 * - Local purchase proof (store purchase or license) writes cloud active: true.
 * - Cloud active is mirrored to local premium only while this device holds one
 *   of the account's device slots.
 * - Signed in with no local proof and no cloud entitlement clears local premium,
 *   which can only have come from an earlier cloud mirror.
 */

import type { IAccountCloudStore } from '../ports/IAccountCloudStore';
import type { IAuthSessionRepository } from '../repository/IAuthSessionRepository';
import type { ISubscriptionRepository } from '../repository/ISubscriptionRepository';
import type { CloudEntitlement } from '../../types';
import { hasLocalPurchaseProof } from '../../core/account/entitlementProof';

/** Existing purchase use cases, kept as narrow shapes to avoid a dependency cycle. */
export interface EntitlementProofRefreshers {
  restorePurchases?: { execute(): Promise<{ restored: boolean }> };
  verifySubscription?: { execute(): Promise<{ valid: boolean }> };
}

export interface BindEntitlementResult {
  cloudActive: boolean;
  localPremium: boolean;
  source: CloudEntitlement['source'];
}

export class BindEntitlementToAccountUseCase {
  constructor(
    private readonly subscriptionRepository: ISubscriptionRepository,
    private readonly authSession: IAuthSessionRepository,
    private readonly cloud: IAccountCloudStore,
    private readonly getPlatform: () => 'ios' | 'android',
    private readonly proof?: EntitlementProofRefreshers,
    private readonly onEntitlementChanged?: () => void,
    private readonly onError?: (error: unknown, context: string) => void
  ) {}

  async execute(uid: string, now: number = Date.now()): Promise<BindEntitlementResult> {
    await this.refreshLocalProof();

    const purchaseType = this.subscriptionRepository.getPurchaseType();
    const licenseKey = this.subscriptionRepository.getLicenseKey();

    if (hasLocalPurchaseProof({ purchaseType, licenseKey })) {
      const source: CloudEntitlement['source'] =
        purchaseType != null
          ? this.getPlatform() === 'ios'
            ? 'app_store'
            : 'play'
          : 'license';
      await this.cloud.setEntitlement(uid, {
        active: true,
        source,
        purchaseType,
        lastValidatedAt: now,
      });
      this.applyLocalPremium(true);
      return {
        cloudActive: true,
        localPremium: this.subscriptionRepository.getIsPremium(),
        source,
      };
    }

    const cloudEntitlement = await this.cloud.getEntitlement(uid);

    if (cloudEntitlement?.active) {
      /**
       * Mirror premium down but leave purchaseType alone: purchaseType is the
       * local purchase proof, and writing it from cloud would make the mirror
       * look like a purchase made here.
       */
      this.applyLocalPremium(true);
      return {
        cloudActive: true,
        localPremium: this.subscriptionRepository.getIsPremium(),
        source: cloudEntitlement.source,
      };
    }

    if (this.subscriptionRepository.getIsPremium()) {
      this.subscriptionRepository.setIsPremium(false);
      this.onEntitlementChanged?.();
    }
    return { cloudActive: false, localPremium: false, source: 'none' };
  }

  /** Re-check the store/license before trusting the local premium flag alone. */
  private async refreshLocalProof(): Promise<void> {
    try {
      if (this.subscriptionRepository.getLicenseKey()) {
        await this.proof?.verifySubscription?.execute();
        return;
      }
      if (this.subscriptionRepository.getPurchaseType() == null) {
        await this.proof?.restorePurchases?.execute();
      }
    } catch (e) {
      this.onError?.(e, 'BindEntitlementToAccountUseCase.refreshLocalProof');
    }
  }

  private applyLocalPremium(active: boolean): void {
    if (!this.authSession.getDevicePremiumAllowed()) return;
    if (this.subscriptionRepository.getIsPremium() === active) return;
    this.subscriptionRepository.setIsPremium(active);
    this.onEntitlementChanged?.();
  }
}
