import { CompleteDesktopSignInUseCase } from '../src/features/account/domain/useCases/CompleteDesktopSignInUseCase';
import { RegisterDeviceUseCase } from '../src/features/account/domain/useCases/RegisterDeviceUseCase';
import { MAX_ACTIVE_DEVICES } from '../src/features/account/domain/deviceLimit';
import type { IAccountCloudStore } from '../src/features/account/domain/ports/IAccountCloudStore';
import type { IDeviceIdProvider } from '../src/shared/ports/IDeviceIdProvider';
import type { AccountDevice, AuthUser, CloudEntitlement } from '../src/shared/types';

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
  // Recently used: a device quiet for months no longer holds a slot.
  return { id, platform, label: null, lastSeenAt: Date.now(), createdAt: 1, active };
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

  it('returns limit_reached when every slot holds a phone', async () => {
    const { cloud } = makeCloud(
      Array.from({ length: MAX_ACTIVE_DEVICES }, (_, i) =>
        makeDevice(`phone-${i}`, true, i % 2 ? 'android' : 'ios'),
      ),
    );
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
