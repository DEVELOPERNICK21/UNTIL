/**
 * Infrastructure adapter: implements IDeviceIdProvider using react-native-device-info.
 */

import type { IDeviceIdProvider } from './IDeviceIdProvider';
import { getDeviceId } from './DeviceId';

export class DeviceIdProviderAdapter implements IDeviceIdProvider {
  async getDeviceId(): Promise<string> {
    return getDeviceId();
  }
}
