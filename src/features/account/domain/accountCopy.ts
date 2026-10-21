import type { AccountDevice } from '../../../shared/types';
import { MAX_ACTIVE_DEVICES, STALE_DEVICE_DAYS } from './deviceLimit';

export const PREMIUM_DEVICES_BENEFIT = `Premium on up to ${MAX_ACTIVE_DEVICES} devices`;

export const DEVICE_LIMIT_BANNER_COPY = `This account is already used on ${MAX_ACTIVE_DEVICES} devices. Remove one to unlock premium here.`;

/** Under the device list: the two rules people can't guess. */
export const DEVICE_RULES_NOTE = `One Mac or Windows PC at a time. A device you haven't opened in ${STALE_DEVICE_DAYS} days stops using a slot.`;

export const DESKTOP_SLOT_NOTE = `Menu bar or tray. Counts as one of your ${MAX_ACTIVE_DEVICES} devices.`;

export function formatAccountDeviceLabel(
  device: Pick<AccountDevice, 'id' | 'platform' | 'label'>,
): string {
  if (device.label) return device.label;
  const suffix = device.id.slice(-4).toUpperCase();
  switch (device.platform) {
    case 'ios':
      return `iPhone · ${suffix}`;
    case 'android':
      return `Android phone · ${suffix}`;
    case 'macos':
      return 'Mac';
    case 'windows':
      return 'Windows';
  }
}

export function replaceDesktopBody(
  existing: Pick<AccountDevice, 'label' | 'platform'>,
): string {
  const label = existing.label?.trim();
  const name = label
    ? label
    : existing.platform === 'macos'
      ? 'Mac'
      : existing.platform === 'windows'
        ? 'Windows'
        : 'another computer';
  return `UNTIL is already signed in on ${name}. Signing in here turns that one off.`;
}
