import { RegisterDeviceUseCase } from '../src/domain/useCases/RegisterDeviceUseCase';
import type { IAccountCloudStore } from '../src/domain/ports/IAccountCloudStore';
import type { IDeviceIdProvider } from '../src/domain/ports/IDeviceIdProvider';
import type { AccountDevice } from '../src/types';

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

function makeCloud(devices: AccountDevice[]) {
  const upserted: AccountDevice[] = [];
  const cloud: IAccountCloudStore = {
    getProfile: async () => null,
    upsertProfile: async () => {},
    listDevices: async () => devices,
    upsertDevice: async (_uid: string, device: AccountDevice) => {
      upserted.push(device);
    },
    setDeviceActive: async () => {},
    getEntitlement: async () => null,
    setEntitlement: async () => {},
  };
  return { cloud, upserted };
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
        lastSeenAt: NOW,
        createdAt: NOW,
        active: true,
      },
    ]);
  });

  it('blocks a new device once three others are active', async () => {
    const { cloud, upserted } = makeCloud([
      makeDevice('a', true),
      makeDevice('b', true),
      makeDevice('c', true),
    ]);

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
      makeDevice('a', true),
      makeDevice('b', true),
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
      lastSeenAt: NOW,
      createdAt: 400,
      active: true,
    });
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
