/**
 * VerifySubscriptionUseCase - Verifies license is still valid.
 * Call on app launch and periodically. On failure, revokes premium.
 */

import type { ISubscriptionRepository } from '../repository/ISubscriptionRepository';
import type { IDeviceIdProvider } from '../ports/IDeviceIdProvider';
import type { ILicenseVerificationService } from '../ports/ILicenseVerificationService';
import type { VerificationResult } from '../../types/subscription';

/** Offline grace period: if last verification was within this ms, trust cached premium. */
const OFFLINE_GRACE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export class VerifySubscriptionUseCase {
  constructor(
    private readonly subscriptionRepository: ISubscriptionRepository,
    private readonly deviceIdProvider: IDeviceIdProvider,
    private readonly licenseService: ILicenseVerificationService
  ) {}

  async execute(): Promise<VerificationResult> {
    const licenseKey = this.subscriptionRepository.getLicenseKey();
    const storedDeviceId = this.subscriptionRepository.getDeviceId();
    const lastVerified = this.subscriptionRepository.getLastVerifiedAt();

    if (!licenseKey) {
      /** Play Billing entitlement (Android): no web license; trust stored store purchase metadata. */
      if (this.subscriptionRepository.getPurchaseType() != null) {
        return { valid: true };
      }
      // No license — ensure premium is off
      if (this.subscriptionRepository.getIsPremium()) {
        this.subscriptionRepository.setIsPremium(false);
      }
      return { valid: false, code: 'invalid', message: 'No license' };
    }

    const deviceId = await this.deviceIdProvider.getDeviceId();

    // Device mismatch: user switched device without deactivating
    if (storedDeviceId && storedDeviceId !== deviceId) {
      this.subscriptionRepository.setIsPremium(false);
      this.subscriptionRepository.setLicenseKey(null);
      this.subscriptionRepository.setDeviceId(null);
      this.subscriptionRepository.setLastVerifiedAt(0);
      return { valid: false, code: 'device_mismatch', message: 'License is bound to another device' };
    }

    const result = await this.licenseService.verify(licenseKey, deviceId);

    if (result.valid) {
      this.subscriptionRepository.setIsPremium(true);
      this.subscriptionRepository.setDeviceId(deviceId);
      this.subscriptionRepository.setLastVerifiedAt(Date.now());
      return result;
    }

    // Network error: use offline grace — trust cache if last verified within grace period
    if (result.code === 'network_error' && lastVerified && Date.now() - lastVerified < OFFLINE_GRACE_MS) {
      return { valid: true };
    }

    this.revokePremium();
    return result;
  }

  /** Trust cached premium when offline and last verification was within grace period. */
  isPremiumWithOfflineGrace(): boolean {
    if (!this.subscriptionRepository.getIsPremium()) return false;
    const lastVerified = this.subscriptionRepository.getLastVerifiedAt();
    if (!lastVerified) return false;
    return Date.now() - lastVerified < OFFLINE_GRACE_MS;
  }

  private revokePremium(): void {
    this.subscriptionRepository.setIsPremium(false);
    this.subscriptionRepository.setLicenseKey(null);
    this.subscriptionRepository.setDeviceId(null);
    this.subscriptionRepository.setLastVerifiedAt(0);
    this.subscriptionRepository.setPurchaseType(null);
    this.subscriptionRepository.setPurchaseDate(null);
    this.subscriptionRepository.setPurchaseToken(null);
  }
}
