import {
  deviceKind,
  describeDevices,
  formatLastActive,
} from '../src/features/account/domain/deviceList';
import {
  MAX_ACTIVE_DEVICES,
  STALE_DEVICE_DAYS,
} from '../src/features/account/domain/deviceLimit';
import { MS_PER_DAY, MS_PER_HOUR } from '../src/shared/time/constants';
import type { AccountDevice } from '../src/shared/types';

const NOW = 500 * MS_PER_DAY;

function device(
  overrides: Partial<AccountDevice> & { id: string },
): AccountDevice {
  return {
    platform: 'ios',
    label: null,
    lastSeenAt: NOW - MS_PER_HOUR * 2,
    createdAt: 1,
    active: true,
    ...overrides,
  };
}

describe('deviceKind', () => {
  it('tells computers, tablets and phones apart', () => {
    expect(deviceKind({ platform: 'macos', label: null })).toBe('computer');
    expect(deviceKind({ platform: 'windows', label: 'Office PC' })).toBe(
      'computer',
    );
    expect(deviceKind({ platform: 'ios', label: 'iPad Air' })).toBe('tablet');
    expect(
      deviceKind({ platform: 'android', label: 'SM-X710 Galaxy Tab S9' }),
    ).toBe('tablet');
    expect(deviceKind({ platform: 'ios', label: 'iPhone 15' })).toBe('phone');
    expect(deviceKind({ platform: 'android', label: null })).toBe('phone');
  });
});

describe('formatLastActive', () => {
  it('reads like a person would say it', () => {
    expect(formatLastActive(NOW - 5 * 60_000, NOW)).toBe('Active now');
    expect(formatLastActive(NOW - 5 * MS_PER_HOUR, NOW)).toBe('Active today');
    expect(formatLastActive(NOW - 1.5 * MS_PER_DAY, NOW)).toBe(
      'Active yesterday',
    );
    expect(formatLastActive(NOW - 6 * MS_PER_DAY, NOW)).toBe(
      'Active 6 days ago',
    );
    expect(formatLastActive(NOW - 21 * MS_PER_DAY, NOW)).toBe(
      'Active 3 weeks ago',
    );
    expect(formatLastActive(NOW - 75 * MS_PER_DAY, NOW)).toBe(
      'Active 2 months ago',
    );
  });

  it('never goes negative when the phone clock is ahead', () => {
    expect(formatLastActive(NOW + MS_PER_DAY, NOW)).toBe('Active now');
  });
});

describe('describeDevices', () => {
  it('puts this device first, then the most recently used', () => {
    const view = describeDevices(
      [
        device({
          id: 'old',
          label: 'Pixel 7',
          platform: 'android',
          lastSeenAt: NOW - 5 * MS_PER_DAY,
        }),
        device({
          id: 'me',
          label: 'iPhone 15',
          lastSeenAt: NOW - 10 * MS_PER_DAY,
        }),
        device({
          id: 'mac',
          label: 'Nick’s MacBook',
          platform: 'macos',
          lastSeenAt: NOW - MS_PER_DAY,
        }),
      ],
      'me',
      NOW,
    );

    expect(view.rows.map(r => r.id)).toEqual(['me', 'mac', 'old']);
    expect(view.rows[0]).toMatchObject({ isCurrent: true, canRemove: false });
    expect(view.rows[1]).toMatchObject({ kind: 'computer', canRemove: true });
  });

  it('shows platform, app version and activity in the subtitle', () => {
    const view = describeDevices(
      [
        device({
          id: 'a',
          label: 'Pixel 7',
          platform: 'android',
          appVersion: '1.3.2',
          lastSeenAt: NOW - 3 * MS_PER_DAY,
        }),
        device({ id: 'me', label: 'iPhone 15' }),
      ],
      'me',
      NOW,
    );
    expect(view.rows[0].subtitle).toBe('iOS · Active now');
    expect(view.rows[1].subtitle).toBe(
      'Android · UNTIL 1.3.2 · Active 3 days ago',
    );
  });

  it('counts slots in use and lists inactive devices nowhere', () => {
    const view = describeDevices(
      [
        device({ id: 'a' }),
        device({ id: 'b', active: false }),
        device({ id: 'c', platform: 'android' }),
      ],
      'a',
      NOW,
    );
    expect(view.rows).toHaveLength(2);
    expect(view.used).toBe(2);
    expect(view.max).toBe(MAX_ACTIVE_DEVICES);
  });

  it('marks a device nobody opened for months as not using a slot, and sorts it last', () => {
    const view = describeDevices(
      [
        device({
          id: 'ghost',
          label: 'Galaxy S8',
          platform: 'android',
          lastSeenAt: NOW - (STALE_DEVICE_DAYS + 30) * MS_PER_DAY,
        }),
        device({
          id: 'a',
          label: 'iPhone 15',
          lastSeenAt: NOW - 30 * MS_PER_DAY,
        }),
        device({ id: 'me', label: 'iPad', lastSeenAt: NOW }),
      ],
      'me',
      NOW,
    );
    expect(view.rows.map(r => r.id)).toEqual(['me', 'a', 'ghost']);
    expect(view.rows[2].stale).toBe(true);
    expect(view.rows[2].subtitle).toBe(
      `Android · Not opened in ${STALE_DEVICE_DAYS + 30} days`,
    );
    expect(view.used).toBe(2);
  });

  it('tells two identically named devices apart', () => {
    const view = describeDevices(
      [
        device({
          id: 'aaaa1111',
          label: 'iPhone',
          lastSeenAt: NOW - MS_PER_DAY,
        }),
        device({ id: 'bbbb2222', label: 'iPhone' }),
      ],
      'bbbb2222',
      NOW,
    );
    expect(view.rows.map(r => r.title)).toEqual([
      'iPhone · 2222',
      'iPhone · 1111',
    ]);
  });
});
