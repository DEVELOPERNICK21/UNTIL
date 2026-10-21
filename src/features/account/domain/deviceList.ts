/**
 * What the Account screen shows for "which devices is UNTIL signed in on": ordered rows with a kind,
 * a title and one plain subtitle each, plus how many slots are in use. Pure, so it is easy to test.
 */

import type { AccountDevice, DevicePlatform } from '../../../shared/types';
import { MS_PER_DAY, MS_PER_HOUR } from '../../../shared/time/constants';
import { formatAccountDeviceLabel } from './accountCopy';
import {
  MAX_ACTIVE_DEVICES,
  countActiveDevices,
  isDeviceStale,
} from './deviceLimit';

export type DeviceKind = 'phone' | 'tablet' | 'computer';

export interface DeviceRow {
  id: string;
  kind: DeviceKind;
  title: string;
  subtitle: string;
  isCurrent: boolean;
  /** Not opened for a long time, so it no longer uses a slot. */
  stale: boolean;
  /** The current device signs out instead of being removed from here. */
  canRemove: boolean;
}

export interface DeviceListView {
  rows: DeviceRow[];
  used: number;
  max: number;
}

const PLATFORM_NAME: Record<DevicePlatform, string> = {
  ios: 'iOS',
  android: 'Android',
  macos: 'macOS',
  windows: 'Windows',
};

export function deviceKind(
  device: Pick<AccountDevice, 'platform' | 'label'>,
): DeviceKind {
  if (device.platform === 'macos' || device.platform === 'windows') {
    return 'computer';
  }
  return /ipad|tablet|\btab\b|fold/i.test(device.label ?? '')
    ? 'tablet'
    : 'phone';
}

export function formatLastActive(lastSeenAt: number, now: number): string {
  const elapsed = Math.max(0, now - lastSeenAt);
  if (elapsed < MS_PER_HOUR) return 'Active now';
  const days = Math.floor(elapsed / MS_PER_DAY);
  if (days < 1) return 'Active today';
  if (days === 1) return 'Active yesterday';
  if (days < 14) return `Active ${days} days ago`;
  if (days < 60) return `Active ${Math.floor(days / 7)} weeks ago`;
  return `Active ${Math.floor(days / 30)} months ago`;
}

function subtitleFor(
  device: AccountDevice,
  isCurrent: boolean,
  stale: boolean,
  now: number,
): string {
  const parts: string[] = [PLATFORM_NAME[device.platform]];
  if (device.appVersion) parts.push(`UNTIL ${device.appVersion}`);
  if (isCurrent) {
    parts.push('Active now');
  } else if (stale) {
    const days = Math.floor((now - device.lastSeenAt) / MS_PER_DAY);
    parts.push(`Not opened in ${days} days`);
  } else {
    parts.push(formatLastActive(device.lastSeenAt, now));
  }
  return parts.join(' · ');
}

/** This device first, then the most recently used, with devices that gave up their slot last. */
export function describeDevices(
  devices: AccountDevice[],
  currentDeviceId: string | null,
  now: number,
): DeviceListView {
  const active = devices.filter(d => d.active);
  const rank = (d: AccountDevice) =>
    d.id === currentDeviceId ? 0 : isDeviceStale(d, now) ? 2 : 1;
  const ordered = [...active].sort(
    (a, b) => rank(a) - rank(b) || b.lastSeenAt - a.lastSeenAt,
  );

  const titles = ordered.map(d => formatAccountDeviceLabel(d));
  const rows = ordered.map<DeviceRow>((device, i) => {
    const isCurrent = device.id === currentDeviceId;
    const stale = !isCurrent && isDeviceStale(device, now);
    const clashes = titles.filter(t => t === titles[i]).length > 1;
    const suffix = device.id.slice(-4).toUpperCase();
    return {
      id: device.id,
      kind: deviceKind(device),
      title:
        clashes && !titles[i].endsWith(suffix)
          ? `${titles[i]} · ${suffix}`
          : titles[i],
      subtitle: subtitleFor(device, isCurrent, stale, now),
      isCurrent,
      stale,
      canRemove: !isCurrent,
    };
  });

  return {
    rows,
    used: countActiveDevices(active, now),
    max: MAX_ACTIVE_DEVICES,
  };
}
