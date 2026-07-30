/**
 * RegisterDeviceUseCase — claim one of the account's 3 device slots for this phone.
 * A device that is already active keeps its slot, so re-signing in on the same
 * phone never consumes a new one.
 */

import type { IAccountCloudStore } from '../ports/IAccountCloudStore';
import type { IDeviceIdProvider } from '../ports/IDeviceIdProvider';
import type { AccountDevice, RegisterDeviceResult } from '../../types';
import { canRegisterDevice } from '../../core/account/deviceLimit';

export class RegisterDeviceUseCase {
  constructor(
    private readonly cloud: IAccountCloudStore,
    private readonly deviceIdProvider: IDeviceIdProvider,
    private readonly getPlatform: () => 'ios' | 'android',
    private readonly getDeviceLabel?: () => string | null
  ) {}

  async execute(uid: string, now: number = Date.now()): Promise<RegisterDeviceResult> {
    const deviceId = await this.deviceIdProvider.getDeviceId();
    const devices = await this.cloud.listDevices(uid);
    const decision = canRegisterDevice(devices, deviceId);

    if (!decision.ok) {
      return { registered: false, deviceId, reason: decision.reason };
    }

    const existing = devices.find(d => d.id === deviceId);
    const device: AccountDevice = {
      id: deviceId,
      platform: this.getPlatform(),
      label: this.getDeviceLabel?.() ?? existing?.label ?? null,
      lastSeenAt: now,
      createdAt: existing?.createdAt ?? now,
      active: true,
    };
    await this.cloud.upsertDevice(uid, device);

    return { registered: true, deviceId };
  }
}
