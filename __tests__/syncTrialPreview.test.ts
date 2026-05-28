import { SyncTrialPreviewUseCase } from '../src/domain/useCases/SyncTrialPreviewUseCase';
import type { ISubscriptionRepository } from '../src/domain/repository/ISubscriptionRepository';
import type { ITrialPreviewService } from '../src/domain/ports/ITrialPreviewService';
import type { IDeviceIdProvider } from '../src/domain/ports/IDeviceIdProvider';

function makeRepo(overrides: Partial<ISubscriptionRepository> = {}): ISubscriptionRepository {
  let trialStart: number | null = null;
  let isPremium = false;
  return {
    getIsPremium: () => isPremium,
    setIsPremium: (v: boolean) => {
      isPremium = v;
    },
    getTrialStartDate: () => trialStart,
    setTrialStartDate: (ms: number | null) => {
      trialStart = ms;
    },
    getLicenseKey: () => null,
    setLicenseKey: () => {},
    getDeviceId: () => null,
    setDeviceId: () => {},
    getLastVerifiedAt: () => null,
    setLastVerifiedAt: () => {},
    getPurchaseType: () => null,
    setPurchaseType: () => {},
    getPurchaseDate: () => null,
    setPurchaseDate: () => {},
    getPurchaseToken: () => null,
    setPurchaseToken: () => {},
    getAppOpenCount: () => 0,
    setAppOpenCount: () => {},
    incrementAppOpenCount: () => 1,
    getLifeScreenViewed: () => false,
    setLifeScreenViewed: () => {},
    getLifeUnlockUntil: () => null,
    setLifeUnlockUntil: () => {},
    getState: () => ({ isPremium, deviceId: null, lastVerifiedAt: null }),
    subscribe: () => () => {},
    ...overrides,
  };
}

describe('SyncTrialPreviewUseCase', () => {
  it('uses earlier server start after storage clear bootstrap', async () => {
    const now = 1_000_000;
    const serverStart = now - 4 * 24 * 60 * 60 * 1000;
    const repo = makeRepo();
    repo.setTrialStartDate(now);

    const service: ITrialPreviewService = {
      sync: async () => ({
        ok: true,
        trialStartMs: serverStart,
        trialEndsAt: serverStart + 5 * 24 * 60 * 60 * 1000,
        trialActive: true,
      }),
    };
    const deviceIdProvider: IDeviceIdProvider = {
      getDeviceId: async () => 'device-abc',
    };

    const useCase = new SyncTrialPreviewUseCase(repo, deviceIdProvider, service);
    await useCase.execute(now);

    expect(repo.getTrialStartDate()).toBe(serverStart);
  });

  it('skips sync when premium is active', async () => {
    const repo = makeRepo();
    repo.setIsPremium(true);
    repo.setTrialStartDate(100);

    const sync = jest.fn();
    const service: ITrialPreviewService = { sync };
    const deviceIdProvider: IDeviceIdProvider = {
      getDeviceId: async () => 'device-abc',
    };

    const useCase = new SyncTrialPreviewUseCase(repo, deviceIdProvider, service);
    await useCase.execute();

    expect(sync).not.toHaveBeenCalled();
  });
});
