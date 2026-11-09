import { t } from '../../../shared/i18n/translate';
import type { AccountDevice } from '../../../shared/types';
import { MAX_ACTIVE_DEVICES, STALE_DEVICE_DAYS } from './deviceLimit';

// Functions, not constants: the text follows the language chosen in Settings.

export function premiumDevicesBenefit(): string {
  return t('account.benefit.devices', { max: MAX_ACTIVE_DEVICES });
}

/** The lines under the sign-in headline. The onboarding prompt uses the shorter birth-date wording. */
export function signInBenefits(options: { short?: boolean } = {}): string[] {
  return [
    t(options.short ? 'account.benefit.lifeShort' : 'account.benefit.life'),
    premiumDevicesBenefit(),
    t('account.benefit.restore'),
  ];
}

export function deviceLimitBannerCopy(): string {
  return t('account.deviceLimitBanner', { max: MAX_ACTIVE_DEVICES });
}

/** Under the device list: the two rules people can't guess. */
export function deviceRulesNote(): string {
  return t('account.devices.rules', { days: STALE_DEVICE_DAYS });
}

export function desktopSlotNote(): string {
  return t('account.desktop.slotNote', { max: MAX_ACTIVE_DEVICES });
}

export function formatAccountDeviceLabel(
  device: Pick<AccountDevice, 'id' | 'platform' | 'label'>,
): string {
  if (device.label) return device.label;
  const suffix = device.id.slice(-4).toUpperCase();
  switch (device.platform) {
    case 'ios':
      return t('account.device.iphone', { suffix });
    case 'android':
      return t('account.device.androidPhone', { suffix });
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
    : t('account.device.anotherComputer');
  return t('account.device.replaceDesktop', { name });
}
