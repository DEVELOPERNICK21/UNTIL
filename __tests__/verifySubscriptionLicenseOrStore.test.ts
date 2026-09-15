import { VerifySubscriptionUseCase } from '../src/domain/useCases/VerifySubscriptionUseCase';
import type { ISubscriptionRepository } from '../src/domain/repository/ISubscriptionRepository';
import type { IDeviceIdProvider } from '../src/domain/ports/IDeviceIdProvider';
import type { ILicenseVerificationService } from '../src/domain/ports/ILicenseVerificationService';
import type { PurchaseType, SubscriptionState } from '../src/types';

function fakeSub(seed: Partial<{
  isPremium: boolean;
  licenseKey: string | null;
  deviceId: string | null;
  lastVerifiedAt: number | null;
  purchaseType: PurchaseType | null;
  purchaseDate: number | null;
  purchaseToken: string | null;
}> = {}): ISubscriptionRepository & { state: Record<string, unknown> } {
  const state = {
    isPremium: seed.isPremium ?? false,
    licenseKey: seed.licenseKey ?? null,
    deviceId: seed.deviceId ?? 'device-1',
    lastVerifiedAt: seed.lastVerifiedAt ?? null,
    purchaseType: seed.purchaseType ?? null,
    purchaseDate: seed.purchaseDate ?? null,
    purchaseToken: seed.purchaseToken ?? null,
  };
  return {
    state,
    getIsPremium: () => state.isPremium,
    setIsPremium: v => { state.isPremium = v; },
    getLicenseKey: () => state.licenseKey,
    setLicenseKey: k => { state.licenseKey = k; },
    getDeviceId: () => state.deviceId,
    setDeviceId: id => { state.deviceId = id; },
    getLastVerifiedAt: () => state.lastVerifiedAt,
    setLastVerifiedAt: ms => { state.lastVerifiedAt = ms; },
    getPurchaseType: () => state.purchaseType,
    setPurchaseType: v => { state.purchaseType = v; },
    getPurchaseDate: () => state.purchaseDate,
    setPurchaseDate: v => { state.purchaseDate = v; },
    getPurchaseToken: () => state.purchaseToken,
    setPurchaseToken: v => { state.purchaseToken = v; },
    getTrialStartDate: () => null,
    setTrialStartDate: () => {},
    getAppOpenCount: () => 0,
    setAppOpenCount: () => {},
    incrementAppOpenCount: () => 0,
    getLifeScreenViewed: () => false,
    setLifeScreenViewed: () => {},
    getLifeUnlockUntil: () => null,
    setLifeUnlockUntil: () => {},
    getState: () => ({}) as SubscriptionState,
    subscribe: () => () => {},
  };
}

const deviceIdProvider: IDeviceIdProvider = {
  getDeviceId: async () => 'device-1',
};

describe('VerifySubscriptionUseCase license OR store', () => {
  it('invalid license revoke clears license fields but keeps store purchase', async () => {
    const sub = fakeSub({
      isPremium: true,
      licenseKey: 'BAD-KEY',
      deviceId: 'device-1',
      lastVerifiedAt: Date.now(),
      purchaseType: 'monthly',
      purchaseDate: 1_700_000_000_000,
      purchaseToken: 'store-token',
    });
    const licenseService: ILicenseVerificationService = {
      activate: async () => ({ success: false, code: 'invalid_license', message: 'bad' }),
      verify: async () => ({ valid: false, code: 'invalid', message: 'License invalid' }),
    };
    const uc = new VerifySubscriptionUseCase(sub, deviceIdProvider, licenseService);

    const result = await uc.execute();

    expect(result.valid).toBe(false);
    expect(sub.getLicenseKey()).toBeNull();
    expect(sub.getDeviceId()).toBeNull();
    expect(sub.getLastVerifiedAt()).toBe(0);
    expect(sub.getIsPremium()).toBe(true);
    expect(sub.getPurchaseType()).toBe('monthly');
    expect(sub.getPurchaseDate()).toBe(1_700_000_000_000);
    expect(sub.getPurchaseToken()).toBe('store-token');
  });

  it('no license + purchaseType returns valid and does not clear premium', async () => {
    const sub = fakeSub({
      isPremium: true,
      licenseKey: null,
      purchaseType: 'yearly',
    });
    const licenseService: ILicenseVerificationService = {
      activate: async () => ({ success: true }),
      verify: async () => ({ valid: true }),
    };
    const uc = new VerifySubscriptionUseCase(sub, deviceIdProvider, licenseService);

    const result = await uc.execute();

    expect(result).toEqual({ valid: true });
    expect(sub.getIsPremium()).toBe(true);
    expect(sub.getPurchaseType()).toBe('yearly');
  });

  it('invalid license without store purchase clears premium', async () => {
    const sub = fakeSub({
      isPremium: true,
      licenseKey: 'BAD-KEY',
      deviceId: 'device-1',
      purchaseType: null,
    });
    const licenseService: ILicenseVerificationService = {
      activate: async () => ({ success: false, code: 'invalid_license', message: 'bad' }),
      verify: async () => ({ valid: false, code: 'revoked', message: 'License revoked' }),
    };
    const uc = new VerifySubscriptionUseCase(sub, deviceIdProvider, licenseService);

    await uc.execute();

    expect(sub.getIsPremium()).toBe(false);
    expect(sub.getLicenseKey()).toBeNull();
  });
});
