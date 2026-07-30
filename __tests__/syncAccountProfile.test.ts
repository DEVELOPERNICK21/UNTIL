import {
  SyncAccountProfileUseCase,
  DEFAULT_LOCAL_THEME,
} from '../src/domain/useCases/SyncAccountProfileUseCase';
import type { IAccountCloudStore } from '../src/domain/ports/IAccountCloudStore';
import type { ITimeRepository } from '../src/domain/repository/ITimeRepository';
import type { CloudUserProfile } from '../src/types';

function makeTimeRepo(
  profile: { birthDate: string | null; deathAge: number } = {
    birthDate: '1990-01-01',
    deathAge: 80,
  }
): ITimeRepository {
  let current = { ...profile };
  return {
    getUserProfile: () => current,
    setUserProfile: (birthDate: string, deathAge: number) => {
      current = { birthDate, deathAge };
    },
    getTimeState: () => {
      throw new Error('not implemented');
    },
    getWidgetCache: () => {
      throw new Error('not implemented');
    },
    subscribe: () => () => {},
  };
}

function makeCloud(profile: CloudUserProfile | null) {
  const upserts: Partial<CloudUserProfile>[] = [];
  const cloud: IAccountCloudStore = {
    getProfile: async () => profile,
    upsertProfile: async (_uid, patch) => {
      upserts.push(patch);
    },
    listDevices: async () => [],
    upsertDevice: async () => {},
    setDeviceActive: async () => {},
    getEntitlement: async () => null,
    setEntitlement: async () => {},
  };
  return { cloud, upserts };
}

describe('SyncAccountProfileUseCase theme merge', () => {
  it('applies cloud theme when local is still the default', async () => {
    const { cloud } = makeCloud({
      birthDate: '1990-01-01',
      deathAge: 80,
      theme: 'dark',
      updatedAt: 1,
    });
    let localTheme = DEFAULT_LOCAL_THEME;
    const theme = {
      get: () => localTheme,
      set: (value: string) => {
        localTheme = value;
      },
    };

    const useCase = new SyncAccountProfileUseCase(
      makeTimeRepo(),
      cloud,
      theme
    );
    const result = await useCase.execute('uid-1');

    expect(localTheme).toBe('dark');
    expect(result).toEqual({ appliedFromCloud: true, pushedToCloud: false });
  });

  it('does not push default system theme over an existing cloud theme', async () => {
    const { cloud, upserts } = makeCloud({
      birthDate: '1990-01-01',
      deathAge: 80,
      theme: 'dark',
      updatedAt: 1,
    });
    const theme = {
      get: () => DEFAULT_LOCAL_THEME,
      set: () => {},
    };

    const useCase = new SyncAccountProfileUseCase(
      makeTimeRepo(),
      cloud,
      theme
    );
    const result = await useCase.execute('uid-1');

    expect(upserts).toHaveLength(0);
    expect(result.pushedToCloud).toBe(false);
  });

  it('does not push default system theme when cloud theme is empty', async () => {
    const { cloud, upserts } = makeCloud({
      birthDate: '1990-01-01',
      deathAge: 80,
      theme: null,
      updatedAt: 1,
    });
    const theme = {
      get: () => DEFAULT_LOCAL_THEME,
      set: () => {},
    };

    const useCase = new SyncAccountProfileUseCase(
      makeTimeRepo(),
      cloud,
      theme
    );
    await useCase.execute('uid-1');

    expect(upserts).toHaveLength(0);
  });

  it('pushes an explicit local theme to cloud when it differs', async () => {
    const { cloud, upserts } = makeCloud({
      birthDate: '1990-01-01',
      deathAge: 80,
      theme: 'dark',
      updatedAt: 1,
    });
    const theme = {
      get: () => 'light',
      set: () => {},
    };

    const useCase = new SyncAccountProfileUseCase(
      makeTimeRepo(),
      cloud,
      theme
    );
    const result = await useCase.execute('uid-1');

    expect(upserts).toEqual([{ theme: 'light' }]);
    expect(result).toEqual({ appliedFromCloud: false, pushedToCloud: true });
  });
});
