import { DeleteAccountUseCase } from '../src/domain/useCases/DeleteAccountUseCase';
import {
  AuthRequiresPasswordError,
  AuthRequiresRecentLoginError,
} from '../src/domain/errors/authErrors';
import type { IAuthService } from '../src/domain/ports/IAuthService';
import type { IAccountCloudStore } from '../src/domain/ports/IAccountCloudStore';
import type { AuthUser } from '../src/types';

function makeAuth(overrides: Partial<IAuthService> & { user?: AuthUser | null } = {}) {
  let user: AuthUser | null =
    overrides.user === undefined
      ? {
          uid: 'u1',
          email: 'a@b.com',
          displayName: null,
          providers: ['google'],
        }
      : overrides.user;
  const auth: IAuthService = {
    signInWithGoogle: async () => user!,
    signInWithEmail: async () => user!,
    createAccountWithEmail: async () => user!,
    signOut: async () => {},
    deleteAccount: async () => {},
    reauthenticateWithGoogle: async () => {},
    reauthenticateWithEmail: async () => {},
    getCurrentUser: () => user,
    subscribe: () => () => {},
    ...overrides,
  };
  return { auth, setUser: (u: AuthUser | null) => { user = u; } };
}

function makeCloud(deleteUserData: (uid: string) => Promise<void>): IAccountCloudStore {
  return {
    getProfile: async () => null,
    upsertProfile: async () => {},
    listDevices: async () => [],
    upsertDevice: async () => {},
    setDeviceActive: async () => {},
    getEntitlement: async () => null,
    setEntitlement: async () => {},
    deleteUserData,
  };
}

describe('DeleteAccountUseCase', () => {
  it('deletes cloud then auth then clears local session', async () => {
    const order: string[] = [];
    const { auth } = makeAuth({
      deleteAccount: async () => {
        order.push('auth');
      },
    });
    const cloud = makeCloud(async () => {
      order.push('cloud');
    });
    const resetPurchases = { execute: async () => { order.push('rc'); return null as never; } };
    const signOut = { clearLocalSession: () => { order.push('local'); return { localPremiumKept: false }; } };

    const useCase = new DeleteAccountUseCase(
      auth,
      cloud,
      resetPurchases as never,
      signOut as never
    );
    await useCase.execute();
    expect(order).toEqual(['cloud', 'auth', 'rc', 'local']);
  });

  it('reauths with Google once on requires-recent-login then deletes', async () => {
    const order: string[] = [];
    let attempts = 0;
    const { auth } = makeAuth({
      deleteAccount: async () => {
        attempts += 1;
        order.push('auth');
        if (attempts === 1) throw new AuthRequiresRecentLoginError();
      },
      reauthenticateWithGoogle: async () => {
        attempts += 10;
        order.push('reauth');
      },
    });
    const cloud = makeCloud(async () => {
      order.push('cloud');
    });
    const resetPurchases = { execute: async () => { order.push('rc'); return null as never; } };
    const signOut = { clearLocalSession: () => { order.push('local'); return { localPremiumKept: false }; } };

    const useCase = new DeleteAccountUseCase(
      auth,
      cloud,
      resetPurchases as never,
      signOut as never
    );
    await useCase.execute();

    expect(attempts).toBe(12);
    expect(order).toEqual(['cloud', 'auth', 'reauth', 'cloud', 'auth', 'rc', 'local']);
  });

  it('throws AuthRequiresPasswordError when password reauth needed and no password', async () => {
    const order: string[] = [];
    const { auth } = makeAuth({
      user: {
        uid: 'u1',
        email: 'a@b.com',
        displayName: null,
        providers: ['password'],
      },
      deleteAccount: async () => {
        order.push('auth');
        throw new AuthRequiresRecentLoginError();
      },
    });
    const cloud = makeCloud(async () => {
      order.push('cloud');
    });
    const resetPurchases = { execute: async () => { order.push('rc'); return null as never; } };
    const signOut = { clearLocalSession: () => { order.push('local'); return { localPremiumKept: false }; } };

    const useCase = new DeleteAccountUseCase(
      auth,
      cloud,
      resetPurchases as never,
      signOut as never
    );

    await expect(useCase.execute()).rejects.toBeInstanceOf(AuthRequiresPasswordError);
    expect(order).toEqual(['cloud', 'auth']);
  });
});
