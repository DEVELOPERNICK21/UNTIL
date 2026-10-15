import { CompleteDesktopSignInUseCase } from '../src/domain/useCases/CompleteDesktopSignInUseCase';
import { RegisterDeviceUseCase } from '../src/domain/useCases/RegisterDeviceUseCase';
import type { IAccountCloudStore } from '../src/domain/ports/IAccountCloudStore';
import type { IDeviceIdProvider } from '../src/domain/ports/IDeviceIdProvider';
import type { AccountDevice, AuthUser, CloudEntitlement } from '../src/types';

const USER: AuthUser = {
  uid: 'uid-1',
  email: 'a@b.com',
  displayName: null,
  providers: ['google'],
};

const ENTITLEMENT: CloudEntitlement = {
  active: true,
  source: 'app_store',
  purchaseType: 'yearly',
  lastValidatedAt: 1,
};

function makeDevice(
  id: string,
  active: boolean,
  platform: AccountDevice['platform'],
): AccountDevice {
  return { id, platform, label: null, lastSeenAt: 1, createdAt: 1, active };
}

function makeCloud(devices: AccountDevice[]) {
  const activations: string[] = [];
  const cloud: IAccountCloudStore = {
    getProfile: async () => null,
    upsertProfile: async () => {},
    listDevices: async () => devices,
    upsertDevice: async () => {},
    setDeviceActive: async (_uid, deviceId) => {
      activations.push(deviceId);
    },
    getEntitlement: async () => ENTITLEMENT,
    setEntitlement: async () => {},
    deleteUserData: async () => {},
  };
  return { cloud, activations };
}

const deviceIdProvider: IDeviceIdProvider = {
  getDeviceId: async () => 'win-1',
};

function makeUseCase(cloud: IAccountCloudStore) {
  const registerDevice = new RegisterDeviceUseCase(
    cloud,
    deviceIdProvider,
    () => 'windows',
  );
  return new CompleteDesktopSignInUseCase(cloud, registerDevice);
}

describe('CompleteDesktopSignInUseCase', () => {
  it('returns needs_replace without claiming this machine', async () => {
    const { cloud, activations } = makeCloud([makeDevice('mac-1', true, 'macos')]);
    const result = await makeUseCase(cloud).execute(USER);
    expect(result).toEqual({
      status: 'needs_replace',
      user: USER,
      existing: expect.objectContaining({ id: 'mac-1' }),
    });
    expect(activations).toHaveLength(0);
  });

  it('registers and reads entitlement after confirm', async () => {
    const { cloud, activations } = makeCloud([makeDevice('mac-1', true, 'macos')]);
    const result = await makeUseCase(cloud).execute(USER, {
      replaceConfirmed: true,
    });
    expect(result).toEqual({
      status: 'registered',
      user: USER,
      entitlement: ENTITLEMENT,
    });
    expect(activations).toEqual(['mac-1']);
  });

  it('returns limit_reached for three phones', async () => {
    const { cloud } = makeCloud([
      makeDevice('a', true, 'ios'),
      makeDevice('b', true, 'android'),
      makeDevice('c', true, 'ios'),
    ]);
    const result = await makeUseCase(cloud).execute(USER);
    expect(result).toEqual({ status: 'limit_reached', user: USER });
  });

  it('returns incomplete when the device list cannot be read', async () => {
    const { cloud } = makeCloud([]);
    cloud.listDevices = async () => {
      throw new Error('offline');
    };
    const result = await makeUseCase(cloud).execute(USER);
    expect(result).toEqual({ status: 'incomplete', user: USER });
  });

  it('still registers when the entitlement read fails', async () => {
    const { cloud } = makeCloud([]);
    cloud.getEntitlement = async () => {
      throw new Error('offline');
    };
    const result = await makeUseCase(cloud).execute(USER);
    expect(result).toEqual({ status: 'registered', user: USER, entitlement: null });
  });
});
