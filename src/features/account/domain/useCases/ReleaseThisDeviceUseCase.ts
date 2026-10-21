/**
 * ReleaseThisDeviceUseCase — give this device's slot back when the person signs out, so signing
 * out here is how a premium account makes room for a new phone. Best effort: a slow or offline
 * cloud must never stop a sign-out, and the slot then frees itself once the device goes stale.
 */

import type { IAccountCloudStore } from '../ports/IAccountCloudStore';
import type { IDeviceIdProvider } from '../../../../shared/ports/IDeviceIdProvider';
import { withTimeout } from '../../../../shared/utils/withTimeout';

export const RELEASE_DEVICE_BUDGET_MS = 5000;

export class ReleaseThisDeviceUseCase {
  constructor(
    private readonly cloud: Pick<
      IAccountCloudStore,
      'listDevices' | 'setDeviceActive'
    >,
    private readonly deviceIdProvider: IDeviceIdProvider,
    private readonly onError?: (error: unknown, context: string) => void,
  ) {}

  /** True when the slot is free afterwards (released, or it never held one). */
  async execute(uid: string): Promise<boolean> {
    try {
      return await withTimeout(
        this.release(uid),
        RELEASE_DEVICE_BUDGET_MS,
        'releaseDevice',
      );
    } catch (e) {
      this.onError?.(e, 'ReleaseThisDeviceUseCase.execute');
      return false;
    }
  }

  private async release(uid: string): Promise<boolean> {
    const deviceId = await this.deviceIdProvider.getDeviceId();
    const devices = await this.cloud.listDevices(uid);
    // Never write for a device the account has not registered: that would create a bare doc.
    if (!devices.some(d => d.id === deviceId && d.active)) return true;
    await this.cloud.setDeviceActive(uid, deviceId, false);
    return true;
  }
}
