/**
 * ActivateLicenseUseCase - Activates a license key on this device.
 * One device only: backend rejects if license already bound to another device.
 */

import type { ISubscriptionRepository } from '../repository/ISubscriptionRepository';
import type { IDeviceIdProvider } from '../ports/IDeviceIdProvider';
import type { ILicenseVerificationService } from '../ports/ILicenseVerificationService';
import type { ActivationResult } from '../../types/subscription';

export class ActivateLicenseUseCase {
  constructor(
    private readonly subscriptionRepository: ISubscriptionRepository,
    private readonly deviceIdProvider: IDeviceIdProvider,
    private readonly licenseService: ILicenseVerificationService
  ) {}

  async execute(licenseKey: string): Promise<ActivationResult> {
    const key = licenseKey?.trim();
    if (!key) {
      return { success: false, code: 'invalid_license', message: 'License key is required' };
    }

    const deviceId = await this.deviceIdProvider.getDeviceId();
    const result = await this.licenseService.activate(key, deviceId);

    if (!result.success) {
      return result;
    }

    this.subscriptionRepository.setLicenseKey(key);
    this.subscriptionRepository.setDeviceId(deviceId);
    this.subscriptionRepository.setIsPremium(true);
    this.subscriptionRepository.setLastVerifiedAt(Date.now());

    return { success: true };
  }
}
