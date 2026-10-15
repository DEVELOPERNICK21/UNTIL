import {
  MAX_ACTIVE_DEVICES,
  canRegisterDevice,
  countActiveDevices,
  isDesktopPlatform,
  planDesktopRegister,
} from '../src/core/account/deviceLimit';
import type { AccountDevice } from '../src/types';

describe('deviceLimit', () => {
  const d = (id: string, active: boolean) => ({ id, active });

  it('allows when under cap', () => {
    expect(canRegisterDevice([d('a', true), d('b', true)], 'c')).toEqual({
      ok: true,
    });
  });

  it('allows same already-active device at cap', () => {
    const devices = [d('a', true), d('b', true), d('c', true)];
    expect(canRegisterDevice(devices, 'c')).toEqual({ ok: true });
    expect(countActiveDevices(devices)).toBe(MAX_ACTIVE_DEVICES);
  });

  it('blocks new device at cap', () => {
    const devices = [d('a', true), d('b', true), d('c', true)];
    expect(canRegisterDevice(devices, 'd')).toEqual({
      ok: false,
      reason: 'limit_reached',
    });
  });

  it('ignores inactive when counting', () => {
    expect(
      countActiveDevices([d('a', true), d('b', false), d('c', false)])
    ).toBe(1);
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

  it('blocks a new desktop when three phones are active', () => {
    const devices = [
      device('a', true, 'ios'),
      device('b', true, 'android'),
      device('c', true, 'ios'),
    ];
    expect(planDesktopRegister(devices, 'mac-1')).toEqual({ kind: 'limit_reached' });
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
