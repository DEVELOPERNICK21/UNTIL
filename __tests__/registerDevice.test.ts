import { RegisterDeviceUseCase } from '../src/features/account/domain/useCases/RegisterDeviceUseCase';
import {
  MAX_ACTIVE_DEVICES,
  STALE_DEVICE_DAYS,
  isConclusiveRegistration,
} from '../src/features/account/domain/deviceLimit';
import { MS_PER_DAY } from '../src/shared/time/constants';
import type { IAccountCloudStore } from '../src/features/account/domain/ports/IAccountCloudStore';
import type { IDeviceIdProvider } from '../src/shared/ports/IDeviceIdProvider';
import type { AccountDevice } from '../src/shared/types';

function makeDevice(
  id: string,
  active: boolean,
  createdAt = 1_000
): AccountDevice {
  return {
    id,
    platform: 'android',
    label: null,
    lastSeenAt: createdAt,
    createdAt,
    active,
  };
}

/** An account whose every slot is taken by a recently used phone. */
function fullAccount(): AccountDevice[] {
  return Array.from({ length: MAX_ACTIVE_DEVICES }, (_, i) =>
    makeDevice(`slot-${i}`, true, 9_000_000 - 1000)
  );
}

function makeCloud(devices: AccountDevice[]) {
  const upserted: AccountDevice[] = [];
  const activations: Array<{ deviceId: string; active: boolean }> = [];
  const cloud: IAccountCloudStore = {
    getProfile: async () => null,
    upsertProfile: async () => {},
    listDevices: async () => devices,
    upsertDevice: async (_uid: string, device: AccountDevice) => {
      upserted.push(device);
    },
    setDeviceActive: async (_uid, deviceId, active) => {
      activations.push({ deviceId, active });
    },
    getEntitlement: async () => null,
    setEntitlement: async () => {},
    deleteUserData: async () => {},
  };
  return { cloud, upserted, activations };
}

function makeDesktop(
  id: string,
  active: boolean,
  platform: 'macos' | 'windows' = 'macos',
): AccountDevice {
  return {
    id,
    platform,
    label: platform === 'macos' ? 'Nick’s MacBook' : 'Office PC',
    lastSeenAt: 1_000,
    createdAt: 1_000,
    active,
  };
}

const deviceIdProvider: IDeviceIdProvider = {
  getDeviceId: async () => 'this-device',
};

describe('RegisterDeviceUseCase', () => {
  const NOW = 9_000_000;

  it('registers a new device when under the cap', async () => {
    const { cloud, upserted } = makeCloud([
      makeDevice('a', true),
      makeDevice('b', true),
    ]);

    const useCase = new RegisterDeviceUseCase(cloud, deviceIdProvider, () => 'ios');
    const result = await useCase.execute('uid-1', NOW);

    expect(result).toEqual({ registered: true, deviceId: 'this-device' });
    expect(upserted).toEqual([
      {
        id: 'this-device',
        platform: 'ios',
        label: null,
        appVersion: null,
        lastSeenAt: NOW,
        createdAt: NOW,
        active: true,
      },
    ]);
  });

  it('blocks a new device once every slot is taken', async () => {
    const { cloud, upserted } = makeCloud(fullAccount());

    const useCase = new RegisterDeviceUseCase(cloud, deviceIdProvider, () => 'android');
    const result = await useCase.execute('uid-1', NOW);

    expect(result).toEqual({
      registered: false,
      deviceId: 'this-device',
      reason: 'limit_reached',
    });
    expect(upserted).toHaveLength(0);
  });

  it('refreshes an already-active device at the cap and keeps createdAt', async () => {
    const { cloud, upserted } = makeCloud([
      ...fullAccount().slice(1),
      makeDevice('this-device', true, 500),
    ]);

    const useCase = new RegisterDeviceUseCase(cloud, deviceIdProvider, () => 'android');
    const result = await useCase.execute('uid-1', NOW);

    expect(result.registered).toBe(true);
    expect(upserted[0].createdAt).toBe(500);
    expect(upserted[0].lastSeenAt).toBe(NOW);
    expect(upserted[0].active).toBe(true);
  });

  it('reactivates a known inactive device when a slot is free', async () => {
    const { cloud, upserted } = makeCloud([
      makeDevice('a', true),
      makeDevice('this-device', false, 400),
    ]);

    const useCase = new RegisterDeviceUseCase(cloud, deviceIdProvider, () => 'android');
    const result = await useCase.execute('uid-1', NOW);

    expect(result.registered).toBe(true);
    expect(upserted[0]).toEqual({
      id: 'this-device',
      platform: 'android',
      label: null,
      appVersion: null,
      lastSeenAt: NOW,
      createdAt: 400,
      active: true,
    });
  });

  it('lets a new device in when the only other holder has not been opened for months', async () => {
    const lostPhone = makeDevice('lost', true, NOW - (STALE_DEVICE_DAYS + 1) * MS_PER_DAY);
    const { cloud, upserted } = makeCloud([...fullAccount().slice(1), lostPhone]);

    const useCase = new RegisterDeviceUseCase(cloud, deviceIdProvider, () => 'ios');
    const result = await useCase.execute('uid-1', NOW);

    expect(result.registered).toBe(true);
    expect(upserted).toHaveLength(1);
  });

  it('records the app version, and keeps the last one when none is available', async () => {
    const withVersion = makeCloud([]);
    await new RegisterDeviceUseCase(
      withVersion.cloud,
      deviceIdProvider,
      () => 'ios',
      undefined,
      undefined,
      () => '1.3.2'
    ).execute('uid-1', NOW);
    expect(withVersion.upserted[0].appVersion).toBe('1.3.2');

    const known: AccountDevice = { ...makeDevice('this-device', true, 500), appVersion: '1.2.0' };
    const without = makeCloud([known]);
    await new RegisterDeviceUseCase(without.cloud, deviceIdProvider, () => 'ios').execute(
      'uid-1',
      NOW
    );
    expect(without.upserted[0].appVersion).toBe('1.2.0');
  });

  it('does not claim a slot when the device list cannot be read', async () => {
    const { cloud, upserted } = makeCloud([]);
    cloud.listDevices = async () => {
      throw new Error('offline');
    };
    const errors: string[] = [];

    const useCase = new RegisterDeviceUseCase(
      cloud,
      deviceIdProvider,
      () => 'android',
      undefined,
      (_e, context) => errors.push(context)
    );
    const result = await useCase.execute('uid-1', NOW);

    expect(result).toEqual({
      registered: false,
      deviceId: 'this-device',
      reason: 'read_failed',
    });
    expect(isConclusiveRegistration(result)).toBe(false);
    expect(upserted).toHaveLength(0);
    expect(errors).toEqual(['RegisterDeviceUseCase.listDevices']);
  });

  it('does not report success when the slot write fails', async () => {
    const { cloud } = makeCloud([makeDevice('a', true)]);
    cloud.upsertDevice = async () => {
      throw new Error('permission denied');
    };

    const useCase = new RegisterDeviceUseCase(cloud, deviceIdProvider, () => 'ios');
    const result = await useCase.execute('uid-1', NOW);

    expect(result).toEqual({
      registered: false,
      deviceId: 'this-device',
      reason: 'write_failed',
    });
    expect(isConclusiveRegistration(result)).toBe(false);
  });

  it('treats a real limit answer as conclusive', async () => {
    const { cloud } = makeCloud(fullAccount());

    const useCase = new RegisterDeviceUseCase(cloud, deviceIdProvider, () => 'ios');
    const result = await useCase.execute('uid-1', NOW);

    expect(isConclusiveRegistration(result)).toBe(true);
  });

  it('keeps a device label when one is provided', async () => {
    const { cloud, upserted } = makeCloud([]);

    const useCase = new RegisterDeviceUseCase(
      cloud,
      deviceIdProvider,
      () => 'ios',
      () => 'iPhone 15'
    );
    await useCase.execute('uid-1', NOW);

    expect(upserted[0].label).toBe('iPhone 15');
  });
});

describe('RegisterDeviceUseCase desktop path', () => {
  const NOW = 9_000_000;
  const desktopIds: IDeviceIdProvider = {
    getDeviceId: async () => 'win-1',
  };

  it('does not deactivate until replace is confirmed', async () => {
    const { cloud, upserted, activations } = makeCloud([
      makeDevice('phone', true),
      makeDesktop('mac-1', true, 'macos'),
    ]);
    const useCase = new RegisterDeviceUseCase(cloud, desktopIds, () => 'windows');
    const result = await useCase.execute('uid-1', NOW);

    expect(result).toEqual({
      registered: false,
      deviceId: 'win-1',
      needsReplace: true,
      existing: expect.objectContaining({ id: 'mac-1', platform: 'macos' }),
    });
    expect(upserted).toHaveLength(0);
    expect(activations).toHaveLength(0);
    expect(isConclusiveRegistration(result)).toBe(false);
  });

  it('deactivates the previous desktop then registers after confirm', async () => {
    const { cloud, upserted, activations } = makeCloud([
      makeDevice('phone', true),
      makeDesktop('mac-1', true, 'macos'),
    ]);
    const useCase = new RegisterDeviceUseCase(cloud, desktopIds, () => 'windows');
    const result = await useCase.execute('uid-1', NOW, { replaceConfirmed: true });

    expect(result).toEqual({ registered: true, deviceId: 'win-1' });
    expect(activations).toEqual([{ deviceId: 'mac-1', active: false }]);
    expect(upserted[0]).toEqual(
      expect.objectContaining({ id: 'win-1', platform: 'windows', active: true }),
    );
  });

  it('replaces at the cap: two phones and a Mac, then Windows', async () => {
    const { cloud, upserted, activations } = makeCloud([
      makeDevice('a', true),
      makeDevice('b', true),
      makeDesktop('mac-1', true, 'macos'),
    ]);
    const useCase = new RegisterDeviceUseCase(cloud, desktopIds, () => 'windows');
    const result = await useCase.execute('uid-1', NOW, { replaceConfirmed: true });

    expect(result.registered).toBe(true);
    expect(activations).toEqual([{ deviceId: 'mac-1', active: false }]);
    expect(upserted).toHaveLength(1);
  });

  it('does not claim a slot when deactivating the old desktop fails', async () => {
    const { cloud, upserted } = makeCloud([makeDesktop('mac-1', true, 'macos')]);
    cloud.setDeviceActive = async () => {
      throw new Error('offline');
    };
    const useCase = new RegisterDeviceUseCase(cloud, desktopIds, () => 'windows');
    const result = await useCase.execute('uid-1', NOW, { replaceConfirmed: true });

    expect(result).toEqual({
      registered: false,
      deviceId: 'win-1',
      reason: 'write_failed',
    });
    expect(upserted).toHaveLength(0);
  });

  it('refreshes the same desktop with no prompt', async () => {
    const { cloud, upserted, activations } = makeCloud([
      makeDevice('phone', true),
      makeDesktop('win-1', true, 'windows'),
    ]);
    const useCase = new RegisterDeviceUseCase(cloud, desktopIds, () => 'windows');
    const result = await useCase.execute('uid-1', NOW);

    expect(result).toEqual({ registered: true, deviceId: 'win-1' });
    expect(activations).toHaveLength(0);
    expect(upserted).toHaveLength(1);
  });

  it('does not replace a phone when every slot holds a phone', async () => {
    const { cloud, upserted, activations } = makeCloud(fullAccount());
    const useCase = new RegisterDeviceUseCase(cloud, desktopIds, () => 'macos');
    const result = await useCase.execute('uid-1', NOW, { replaceConfirmed: true });

    expect(result).toEqual({
      registered: false,
      deviceId: 'win-1',
      reason: 'limit_reached',
    });
    expect(isConclusiveRegistration(result)).toBe(true);
    expect(activations).toHaveLength(0);
    expect(upserted).toHaveLength(0);
  });
});
