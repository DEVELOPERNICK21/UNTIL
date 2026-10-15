import type { IDeviceIdProvider } from '@until/shared/platform/device/IDeviceIdProvider';
import type { DevicePlatform } from '@until/shared/types';

const DEVICE_ID_KEY = 'until.desktop.deviceId';

/** Random per install; survives restarts, resets on reinstall like the phone's. */
export class LocalStorageDeviceIdProvider implements IDeviceIdProvider {
  async getDeviceId(): Promise<string> {
    const existing = localStorage.getItem(DEVICE_ID_KEY);
    if (existing) return existing;
    const id = `desktop-${crypto.randomUUID()}`;
    localStorage.setItem(DEVICE_ID_KEY, id);
    return id;
  }
}

export function getDesktopPlatform(): DevicePlatform {
  return /Windows/i.test(navigator.userAgent) ? 'windows' : 'macos';
}
