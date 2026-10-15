import type { AccountDevice } from '../../types';

export const PREMIUM_DEVICES_BENEFIT = 'Premium on up to 3 devices';

export const DEVICE_LIMIT_BANNER_COPY =
  'This account is already used on 3 devices. Remove one to unlock premium here.';

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
