import {
  MAX_ACTIVE_DEVICES,
  canRegisterDevice,
  countActiveDevices,
} from '../src/core/account/deviceLimit';

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
