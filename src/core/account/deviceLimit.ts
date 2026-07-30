import type { RegisterDeviceResult } from '../../types';

export const MAX_ACTIVE_DEVICES = 3;

export type AccountDeviceRef = { id: string; active: boolean };

export function countActiveDevices(devices: AccountDeviceRef[]): number {
  return devices.filter(d => d.active).length;
}

export function canRegisterDevice(
  devices: AccountDeviceRef[],
  deviceId: string
): { ok: true } | { ok: false; reason: 'limit_reached' } {
  const existing = devices.find(d => d.id === deviceId);
  if (existing?.active) return { ok: true };
  const active = countActiveDevices(devices);
  if (active >= MAX_ACTIVE_DEVICES) {
    return { ok: false, reason: 'limit_reached' };
  }
  return { ok: true };
}

/**
 * True when the account actually answered: registered, or blocked by the cap.
 * A read/write failure tells us nothing, so callers must leave the device's
 * premium flag as it was instead of stripping premium on a network error.
 */
export function isConclusiveRegistration(result: RegisterDeviceResult): boolean {
  return result.registered || result.reason === 'limit_reached';
}
