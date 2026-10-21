import type {
  AccountDevice,
  DevicePlatform,
  RegisterDeviceResult,
} from '../../../shared/types';
import { MS_PER_DAY } from '../../../shared/time/constants';

/** Premium works on this many devices at once (phones, tablets and one Mac or Windows PC). */
export const MAX_ACTIVE_DEVICES = 5;

/**
 * A device that has not opened UNTIL for this long stops holding a slot, so a sold, lost or
 * wiped phone cannot block the account for ever. It claims a slot again the next time it opens.
 */
export const STALE_DEVICE_DAYS = 90;
const STALE_DEVICE_MS = STALE_DEVICE_DAYS * MS_PER_DAY;

export type AccountDeviceRef = {
  id: string;
  active: boolean;
  lastSeenAt?: number;
};

/** True when the device has been quiet long enough to give its slot up. Needs `now`; without it nothing is stale. */
export function isDeviceStale(
  device: Pick<AccountDeviceRef, 'lastSeenAt'>,
  now?: number
): boolean {
  if (now === undefined || device.lastSeenAt === undefined) return false;
  return now - device.lastSeenAt >= STALE_DEVICE_MS;
}

/** Active devices that really hold a slot. Pass `now` to leave out stale ones. */
export function countActiveDevices(
  devices: AccountDeviceRef[],
  now?: number
): number {
  return devices.filter(d => d.active && !isDeviceStale(d, now)).length;
}

/** The device already holds a current slot, so re-signing in never consumes another. */
function holdsSlot(devices: AccountDeviceRef[], deviceId: string, now?: number): boolean {
  const existing = devices.find(d => d.id === deviceId);
  return existing?.active === true && !isDeviceStale(existing, now);
}

export function canRegisterDevice(
  devices: AccountDeviceRef[],
  deviceId: string,
  now?: number
): { ok: true } | { ok: false; reason: 'limit_reached' } {
  if (holdsSlot(devices, deviceId, now)) return { ok: true };
  const others = devices.filter(d => d.id !== deviceId);
  if (countActiveDevices(others, now) >= MAX_ACTIVE_DEVICES) {
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
  deviceId: string,
  now?: number
): DesktopRegisterPlan {
  if (holdsSlot(devices, deviceId, now)) return { kind: 'register' };

  const otherDesktop = devices.find(
    d =>
      d.active &&
      d.id !== deviceId &&
      !isDeviceStale(d, now) &&
      isDesktopPlatform(d.platform)
  );
  if (otherDesktop) return { kind: 'needs_replace', existing: otherDesktop };

  return canRegisterDevice(devices, deviceId, now).ok
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
