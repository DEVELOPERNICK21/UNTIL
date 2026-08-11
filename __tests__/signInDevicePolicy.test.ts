import { CompleteAccountSignInUseCase } from '../src/domain/useCases/CompleteAccountSignInUseCase';
import { SignInWithGoogleUseCase } from '../src/domain/useCases/SignInWithGoogleUseCase';
import type { BindEntitlementToAccountUseCase } from '../src/domain/useCases/BindEntitlementToAccountUseCase';
import type { RegisterDeviceUseCase } from '../src/domain/useCases/RegisterDeviceUseCase';
import type { SyncAccountProfileUseCase } from '../src/domain/useCases/SyncAccountProfileUseCase';
import type { IAuthService } from '../src/domain/ports/IAuthService';
import type { IAuthSessionRepository } from '../src/domain/repository/IAuthSessionRepository';
import type { AuthUser, RegisterDeviceResult } from '../src/types';

const USER: AuthUser = {
  uid: 'uid-1',
  email: 'a@b.com',
  displayName: null,
  providers: ['google'],
};

const authService: IAuthService = {
  signInWithGoogle: async () => USER,
  signInWithEmail: async () => USER,
  createAccountWithEmail: async () => USER,
  signOut: async () => {},
  getCurrentUser: () => USER,
  subscribe: () => () => {},
};

function makeAuthSession(devicePremiumAllowed: boolean) {
  const state = {
    uid: null as string | null,
    email: null as string | null,
    devicePremiumAllowed,
  };
  const repo: IAuthSessionRepository = {
    getUid: () => state.uid,
    setUid: uid => {
      state.uid = uid;
    },
    getEmail: () => state.email,
    setEmail: email => {
      state.email = email;
    },
    getDevicePremiumAllowed: () => state.devicePremiumAllowed,
    setDevicePremiumAllowed: value => {
      state.devicePremiumAllowed = value;
    },
    clear: () => {},
    getState: () => ({ ...state }),
    subscribe: () => () => {},
  };
  return { repo, state };
}

function makeUseCase(
  registration: RegisterDeviceResult,
  authSession: IAuthSessionRepository,
  onDeviceAccessChanged?: () => void
) {
  const syncProfile = {
    execute: async () => ({ appliedFromCloud: false, pushedToCloud: false }),
  } as unknown as SyncAccountProfileUseCase;
  const registerDevice = {
    execute: async () => registration,
  } as unknown as RegisterDeviceUseCase;
  const bindEntitlement = {
    execute: async () => {},
  } as unknown as BindEntitlementToAccountUseCase;

  const complete = new CompleteAccountSignInUseCase(
    authSession,
    syncProfile,
    registerDevice,
    bindEntitlement,
    undefined,
    onDeviceAccessChanged
  );

  return new SignInWithGoogleUseCase(authService, complete);
}

describe('SignInWithGoogleUseCase device policy', () => {
  it('revokes device premium when the account is at the cap', async () => {
    const { repo, state } = makeAuthSession(true);
    let bridgeSyncs = 0;
    const useCase = makeUseCase(
      { registered: false, deviceId: 'this-device', reason: 'limit_reached' },
      repo,
      () => {
        bridgeSyncs += 1;
      }
    );

    const result = await useCase.execute();

    expect(state.devicePremiumAllowed).toBe(false);
    expect(result.deviceLimitReached).toBe(true);
    expect(bridgeSyncs).toBe(1);
  });

  it('leaves device premium alone when the device read failed', async () => {
    const { repo, state } = makeAuthSession(true);
    let bridgeSyncs = 0;
    const useCase = makeUseCase(
      { registered: false, deviceId: 'this-device', reason: 'read_failed' },
      repo,
      () => {
        bridgeSyncs += 1;
      }
    );

    const result = await useCase.execute();

    expect(state.devicePremiumAllowed).toBe(true);
    expect(result.deviceRegistered).toBe(false);
    expect(result.deviceLimitReached).toBe(false);
    expect(bridgeSyncs).toBe(0);
  });

  it('leaves device premium alone when the slot write failed', async () => {
    const { repo, state } = makeAuthSession(false);
    const useCase = makeUseCase(
      { registered: false, deviceId: 'this-device', reason: 'write_failed' },
      repo
    );

    await useCase.execute();

    expect(state.devicePremiumAllowed).toBe(false);
  });

  it('grants device premium once the slot is claimed', async () => {
    const { repo, state } = makeAuthSession(false);
    const useCase = makeUseCase(
      { registered: true, deviceId: 'this-device' },
      repo
    );

    const result = await useCase.execute();

    expect(state.devicePremiumAllowed).toBe(true);
    expect(result.deviceRegistered).toBe(true);
  });
});
