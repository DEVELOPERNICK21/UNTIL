import { ReleaseThisDeviceUseCase } from '../src/features/account/domain/useCases/ReleaseThisDeviceUseCase';
import { SignOutUseCase } from '../src/features/account/domain/useCases/SignOutUseCase';
import type { IAccountCloudStore } from '../src/features/account/domain/ports/IAccountCloudStore';
import type { IAuthService } from '../src/features/account/domain/ports/IAuthService';
import type { IAuthSessionRepository } from '../src/features/account/domain/ports/IAuthSessionRepository';
import type { AccountDevice } from '../src/shared/types';

const THIS_DEVICE = 'this-device';

function device(id: string, active: boolean): AccountDevice {
  return {
    id,
    platform: 'ios',
    label: null,
    lastSeenAt: 1,
    createdAt: 1,
    active,
  };
}

function makeCloud(devices: AccountDevice[]) {
  const deactivated: string[] = [];
  const cloud: Pick<IAccountCloudStore, 'listDevices' | 'setDeviceActive'> = {
    listDevices: async () => devices,
    setDeviceActive: async (_uid, id, active) => {
      if (!active) deactivated.push(id);
    },
  };
  return { cloud, deactivated };
}

describe('ReleaseThisDeviceUseCase', () => {
  const ids = { getDeviceId: async () => THIS_DEVICE };

  it('gives this device’s slot back', async () => {
    const { cloud, deactivated } = makeCloud([
      device(THIS_DEVICE, true),
      device('other', true),
    ]);
    await expect(
      new ReleaseThisDeviceUseCase(cloud, ids).execute('uid'),
    ).resolves.toBe(true);
    expect(deactivated).toEqual([THIS_DEVICE]);
  });

  it('writes nothing for a device the account never registered or already released', async () => {
    const never = makeCloud([device('other', true)]);
    const released = makeCloud([device(THIS_DEVICE, false)]);

    await new ReleaseThisDeviceUseCase(never.cloud, ids).execute('uid');
    await new ReleaseThisDeviceUseCase(released.cloud, ids).execute('uid');

    expect(never.deactivated).toEqual([]);
    expect(released.deactivated).toEqual([]);
  });

  it('reports failure instead of throwing when the cloud is unreachable', async () => {
    const errors: string[] = [];
    const cloud = {
      listDevices: async (): Promise<AccountDevice[]> => {
        throw new Error('offline');
      },
      setDeviceActive: async () => {},
    };
    const result = await new ReleaseThisDeviceUseCase(cloud, ids, (_e, ctx) =>
      errors.push(ctx),
    ).execute('uid');

    expect(result).toBe(false);
    expect(errors).toEqual(['ReleaseThisDeviceUseCase.execute']);
  });
});

describe('SignOutUseCase', () => {
  function makeSignOut(
    release: { execute: (uid: string) => Promise<boolean> } | undefined,
    uid: string | null,
  ) {
    const order: string[] = [];
    const authService = {
      signOut: async () => {
        order.push('auth');
      },
    } as unknown as IAuthService;
    const authSession = {
      getUid: () => uid,
      clear: () => {
        order.push('clear');
      },
    } as unknown as IAuthSessionRepository;
    const subscription = {
      getPurchaseType: () => null,
      getLicenseKey: () => null,
      getIsPremium: () => false,
      setIsPremium: () => {},
    };
    const useCase = new SignOutUseCase(
      authService,
      authSession,
      subscription as never,
      {
        execute: async () => {
          order.push('reset');
        },
      } as never,
      undefined,
      undefined,
      release,
    );
    return { useCase, order };
  }

  it('releases the slot while still signed in, then signs out', async () => {
    const order: string[] = [];
    const release = {
      execute: async (uid: string) => {
        order.push(`release:${uid}`);
        return true;
      },
    };
    const { useCase, order: signOutOrder } = makeSignOut(release, 'uid-1');

    await useCase.execute();

    expect(order).toEqual(['release:uid-1']);
    expect(signOutOrder).toEqual(['auth', 'reset', 'clear']);
  });

  it('still signs out when there is no one to release for or no release step', async () => {
    const release = { execute: jest.fn().mockResolvedValue(true) };
    const noUid = makeSignOut(release, null);
    await noUid.useCase.execute();
    expect(release.execute).not.toHaveBeenCalled();
    expect(noUid.order).toContain('auth');

    const noRelease = makeSignOut(undefined, 'uid-1');
    await noRelease.useCase.execute();
    expect(noRelease.order).toContain('auth');
  });
});
