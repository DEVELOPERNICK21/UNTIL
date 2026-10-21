import {
  MAX_ACTIVE_DEVICES,
  STALE_DEVICE_DAYS,
  canRegisterDevice,
  countActiveDevices,
  isDesktopPlatform,
  isDeviceStale,
  planDesktopRegister,
} from '../src/features/account/domain/deviceLimit';
import { MS_PER_DAY } from '../src/shared/time/constants';
import type { AccountDevice } from '../src/shared/types';

describe('deviceLimit', () => {
  const d = (id: string, active: boolean, lastSeenAt?: number) => ({
    id,
    active,
    lastSeenAt,
  });
  const full = (lastSeenAt?: number) =>
    Array.from({ length: MAX_ACTIVE_DEVICES }, (_, i) => d(`dev-${i}`, true, lastSeenAt));
  const NOW = 400 * MS_PER_DAY;

  it('lets premium run on five devices', () => {
    expect(MAX_ACTIVE_DEVICES).toBe(5);
  });

  it('allows when under cap', () => {
    expect(canRegisterDevice(full().slice(1), 'new')).toEqual({ ok: true });
  });

  it('allows same already-active device at cap', () => {
    const devices = full();
    expect(canRegisterDevice(devices, 'dev-0')).toEqual({ ok: true });
    expect(countActiveDevices(devices)).toBe(MAX_ACTIVE_DEVICES);
  });

  it('blocks new device at cap', () => {
    expect(canRegisterDevice(full(), 'new')).toEqual({
      ok: false,
      reason: 'limit_reached',
    });
  });

  it('ignores inactive when counting', () => {
    expect(
      countActiveDevices([d('a', true), d('b', false), d('c', false)])
    ).toBe(1);
  });

  describe('stale devices', () => {
    it('is stale only after the threshold, and never without a clock', () => {
      const edge = NOW - STALE_DEVICE_DAYS * MS_PER_DAY;
      expect(isDeviceStale({ lastSeenAt: edge }, NOW)).toBe(true);
      expect(isDeviceStale({ lastSeenAt: edge + 1 }, NOW)).toBe(false);
      expect(isDeviceStale({ lastSeenAt: 0 })).toBe(false);
      expect(isDeviceStale({}, NOW)).toBe(false);
    });

    it('does not count a stale device toward the cap', () => {
      const old = NOW - (STALE_DEVICE_DAYS + 1) * MS_PER_DAY;
      const devices = [...full(NOW - MS_PER_DAY).slice(1), d('lost-phone', true, old)];
      expect(countActiveDevices(devices, NOW)).toBe(MAX_ACTIVE_DEVICES - 1);
      expect(canRegisterDevice(devices, 'new', NOW)).toEqual({ ok: true });
      // Without a clock the old rule applies.
      expect(canRegisterDevice(devices, 'new')).toEqual({ ok: false, reason: 'limit_reached' });
    });

    it('makes a stale device earn its slot again when it comes back', () => {
      const old = NOW - (STALE_DEVICE_DAYS + 1) * MS_PER_DAY;
      const fresh = full(NOW - MS_PER_DAY).slice(1);
      const devices = [...fresh, d('lost-phone', true, old)];
      expect(canRegisterDevice(devices, 'lost-phone', NOW)).toEqual({ ok: true });

      const crowded = [...full(NOW - MS_PER_DAY), d('lost-phone', true, old)];
      expect(canRegisterDevice(crowded, 'lost-phone', NOW)).toEqual({
        ok: false,
        reason: 'limit_reached',
      });
    });
  });
});

describe('planDesktopRegister', () => {
  const device = (
    id: string,
    active: boolean,
    platform: AccountDevice['platform'] = 'android',
  ): AccountDevice => ({
    id,
    platform,
    label: null,
    lastSeenAt: 1,
    createdAt: 1,
    active,
  });

  it('registers the same already-active desktop with no replace', () => {
    const devices = [device('phone', true, 'ios'), device('mac-1', true, 'macos')];
    expect(planDesktopRegister(devices, 'mac-1')).toEqual({ kind: 'register' });
  });

  it('asks to replace an active Mac when signing in on a new Windows machine', () => {
    const mac = device('mac-1', true, 'macos');
    const devices = [device('phone', true, 'ios'), mac];
    expect(planDesktopRegister(devices, 'win-1')).toEqual({
      kind: 'needs_replace',
      existing: mac,
    });
  });

  it('asks to replace even when this machine’s old id is inactive', () => {
    const win = device('win-1', true, 'windows');
    const devices = [device('mac-1', false, 'macos'), win];
    expect(planDesktopRegister(devices, 'mac-1')).toEqual({
      kind: 'needs_replace',
      existing: win,
    });
  });

  it('blocks a new desktop when every slot holds a phone', () => {
    const devices = Array.from({ length: MAX_ACTIVE_DEVICES }, (_, i) =>
      device(`phone-${i}`, true, i % 2 ? 'android' : 'ios'),
    );
    expect(planDesktopRegister(devices, 'mac-1')).toEqual({ kind: 'limit_reached' });
  });

  it('does not ask to replace a desktop that has not been opened for months', () => {
    const now = 400 * MS_PER_DAY;
    const oldMac: AccountDevice = {
      ...device('mac-1', true, 'macos'),
      lastSeenAt: now - (STALE_DEVICE_DAYS + 1) * MS_PER_DAY,
    };
    expect(planDesktopRegister([oldMac], 'win-1', now)).toEqual({ kind: 'register' });
    expect(planDesktopRegister([oldMac], 'win-1')).toEqual({
      kind: 'needs_replace',
      existing: oldMac,
    });
  });

  it('registers a first desktop when under the cap', () => {
    expect(planDesktopRegister([device('phone', true, 'ios')], 'mac-1')).toEqual({
      kind: 'register',
    });
  });

  it('ignores an inactive previous desktop', () => {
    const devices = [device('phone', true, 'ios'), device('mac-1', false, 'macos')];
    expect(planDesktopRegister(devices, 'win-1')).toEqual({ kind: 'register' });
  });
});

describe('isDesktopPlatform', () => {
  it('treats macos and windows as desktop', () => {
    expect(isDesktopPlatform('macos')).toBe(true);
    expect(isDesktopPlatform('windows')).toBe(true);
    expect(isDesktopPlatform('ios')).toBe(false);
    expect(isDesktopPlatform('android')).toBe(false);
  });
});
