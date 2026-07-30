/**
 * RemoveAccountDeviceUseCase — free one of the account's device slots.
 * Devices are deactivated, not deleted, so their createdAt history survives.
 * When the freed slot lets this phone in, it registers and rebinds entitlement.
 */

import type { IAccountCloudStore } from '../ports/IAccountCloudStore';
import type { IDeviceIdProvider } from '../ports/IDeviceIdProvider';
import type { IAuthSessionRepository } from '../repository/IAuthSessionRepository';
import type { RegisterDeviceUseCase } from './RegisterDeviceUseCase';
import type { BindEntitlementToAccountUseCase } from './BindEntitlementToAccountUseCase';
import { isConclusiveRegistration } from '../../core/account/deviceLimit';

export interface RemoveAccountDeviceResult {
  removed: boolean;
  devicePremiumAllowed: boolean;
  wasCurrentDevice: boolean;
}

export class RemoveAccountDeviceUseCase {
  constructor(
    private readonly cloud: IAccountCloudStore,
    private readonly authSession: IAuthSessionRepository,
    private readonly deviceIdProvider: IDeviceIdProvider,
    private readonly registerDevice: RegisterDeviceUseCase,
    private readonly bindEntitlement: BindEntitlementToAccountUseCase,
    private readonly onDeviceAccessChanged?: () => void
  ) {}

  async execute(uid: string, deviceId: string): Promise<RemoveAccountDeviceResult> {
    await this.cloud.setDeviceActive(uid, deviceId, false);
    const currentDeviceId = await this.deviceIdProvider.getDeviceId();

    if (deviceId === currentDeviceId) {
      this.authSession.setDevicePremiumAllowed(false);
      this.onDeviceAccessChanged?.();
      return { removed: true, devicePremiumAllowed: false, wasCurrentDevice: true };
    }

    if (this.authSession.getDevicePremiumAllowed()) {
      return { removed: true, devicePremiumAllowed: true, wasCurrentDevice: false };
    }

    const registration = await this.registerDevice.execute(uid);
    if (!isConclusiveRegistration(registration)) {
      return {
        removed: true,
        devicePremiumAllowed: this.authSession.getDevicePremiumAllowed(),
        wasCurrentDevice: false,
      };
    }

    this.authSession.setDevicePremiumAllowed(registration.registered);
    this.onDeviceAccessChanged?.();
    if (registration.registered) {
      await this.bindEntitlement.execute(uid);
    }

    return {
      removed: true,
      devicePremiumAllowed: registration.registered,
      wasCurrentDevice: false,
    };
  }
}
