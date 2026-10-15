import type {
  AccountDevice,
  DevicePlatform,
  RegisterDeviceResult,
} from '../../types';

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

export function isDesktopPlatform(platform: DevicePlatform): boolean {
  return platform === 'macos' || platform === 'windows';
}

export type DesktopRegisterPlan =
  | { kind: 'register' }
  | { kind: 'needs_replace'; existing: AccountDevice }
  | { kind: 'limit_reached' };

/**
 * An account keeps at most one active desktop. A different active Mac or
 * Windows machine must be turned off (after the user confirms) before this one
 * registers, even when the account is under the cap. Phones are never replaced.
 */
export function planDesktopRegister(
  devices: AccountDevice[],
  deviceId: string
): DesktopRegisterPlan {
  if (devices.find(d => d.id === deviceId)?.active) return { kind: 'register' };

  const otherDesktop = devices.find(
    d => d.active && d.id !== deviceId && isDesktopPlatform(d.platform)
  );
  if (otherDesktop) return { kind: 'needs_replace', existing: otherDesktop };

  return canRegisterDevice(devices, deviceId).ok
    ? { kind: 'register' }
    : { kind: 'limit_reached' };
}

/**
 * True when the account actually answered: registered, or blocked by the cap.
 * A read/write failure tells us nothing, so callers must leave the device's
 * premium flag as it was instead of stripping premium on a network error.
 */
export function isConclusiveRegistration(result: RegisterDeviceResult): boolean {
  return result.registered || result.reason === 'limit_reached';
}
