/**
 * RegisterDeviceUseCase — claim one of the account's device slots for this device.
 * A device that is already active keeps its slot, so re-signing in on the same
 * device never consumes a new one.
 *
 * Desktops (Mac / Windows) share one slot: if another desktop is active, the
 * result asks to replace it, and nothing is written until the caller passes
 * `replaceConfirmed` after the user agrees.
 *
 * Fails closed: if the device list cannot be read, or the slot cannot be
 * written, the device is not registered and the reason says the cloud call
 * failed. Callers use isConclusiveRegistration() to tell that apart from a real
 * `limit_reached` answer.
 */

import type { IAccountCloudStore } from '../ports/IAccountCloudStore';
import type { IDeviceIdProvider } from '../../../../shared/ports/IDeviceIdProvider';
import type {
  AccountDevice,
  DevicePlatform,
  RegisterDeviceResult,
} from '../../../../shared/types';
import {
  canRegisterDevice,
  isDesktopPlatform,
  planDesktopRegister,
} from '../deviceLimit';

export interface RegisterDeviceOptions {
  replaceConfirmed?: boolean;
}

export class RegisterDeviceUseCase {
  constructor(
    private readonly cloud: IAccountCloudStore,
    private readonly deviceIdProvider: IDeviceIdProvider,
    private readonly getPlatform: () => DevicePlatform,
    private readonly getDeviceLabel?: () => string | null,
    private readonly onError?: (error: unknown, context: string) => void,
    private readonly getAppVersion?: () => string | null
  ) {}

  async execute(
    uid: string,
    now: number = Date.now(),
    options: RegisterDeviceOptions = {}
  ): Promise<RegisterDeviceResult> {
    const deviceId = await this.deviceIdProvider.getDeviceId();
    const platform = this.getPlatform();

    let devices: AccountDevice[];
    try {
      devices = await this.cloud.listDevices(uid);
    } catch (e) {
      this.onError?.(e, 'RegisterDeviceUseCase.listDevices');
      return { registered: false, deviceId, reason: 'read_failed' };
    }

    if (isDesktopPlatform(platform)) {
      const plan = planDesktopRegister(devices, deviceId, now);
      if (plan.kind === 'limit_reached') {
        return { registered: false, deviceId, reason: 'limit_reached' };
      }
      if (plan.kind === 'needs_replace') {
        if (!options.replaceConfirmed) {
          return {
            registered: false,
            deviceId,
            needsReplace: true,
            existing: plan.existing,
          };
        }
        try {
          await this.cloud.setDeviceActive(uid, plan.existing.id, false);
        } catch (e) {
          this.onError?.(e, 'RegisterDeviceUseCase.replaceDesktop');
          return { registered: false, deviceId, reason: 'write_failed' };
        }
      }
    } else {
      const decision = canRegisterDevice(devices, deviceId, now);
      if (!decision.ok) {
        return { registered: false, deviceId, reason: decision.reason };
      }
    }

    const existing = devices.find(d => d.id === deviceId);
    const device: AccountDevice = {
      id: deviceId,
      platform,
      label: this.getDeviceLabel?.() ?? existing?.label ?? null,
      appVersion: this.getAppVersion?.() ?? existing?.appVersion ?? null,
      lastSeenAt: now,
      createdAt: existing?.createdAt ?? now,
      active: true,
    };

    try {
      await this.cloud.upsertDevice(uid, device);
    } catch (e) {
      this.onError?.(e, 'RegisterDeviceUseCase.upsertDevice');
      return { registered: false, deviceId, reason: 'write_failed' };
    }

    return { registered: true, deviceId };
  }
}
