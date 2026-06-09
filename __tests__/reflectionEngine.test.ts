import {
  generateDailyReflection,
  getDateKey,
} from '../src/domain/reflections/reflectionEngine';
import { GetDailyReflectionUseCase } from '../src/domain/useCases/GetDailyReflectionUseCase';
import type { ReflectionPersistence } from '../src/domain/reflections/reflectionTypes';
import type { ITimeRepository } from '../src/domain/repository/ITimeRepository';
import type { ISubscriptionRepository } from '../src/domain/repository/ISubscriptionRepository';

const evening = new Date(2026, 4, 25, 21, 0, 0);
const lifeEligibleMorning = new Date(2026, 4, 27, 10, 0, 0);

function baseInput(overrides = {}) {
  return {
    date: evening,
    dayProgress: 0.86,
    monthProgress: 0.58,
    yearProgress: 0.41,
    lifeProgress: 0.32,
    hasBirthDate: true,
    hasPremiumBundle: true,
    tone: 'quiet' as const,
    ...overrides,
  };
}

function makePersistence(): ReflectionPersistence {
  let date: string | undefined;
  let payload: string | undefined;
  let dismissedDate: string | undefined;
  let tone: string | undefined;

  return {
    getDailyReflectionDate: () => date,
    setDailyReflectionDate: value => {
      date = value;
    },
    getDailyReflectionPayload: () => payload,
    setDailyReflectionPayload: value => {
      payload = value;
    },
    getDailyReflectionDismissedDate: () => dismissedDate,
    setDailyReflectionDismissedDate: value => {
      dismissedDate = value;
    },
    getReflectionTone: () => tone,
    setReflectionTone: value => {
      tone = value;
    },
  };
}

function makeTimeRepository(): ITimeRepository {
  return {
    getUserProfile: () => ({ birthDate: '1995-01-01', deathAge: 80 }),
    getTimeState: () => ({
      day: 0.4,
      week: 0.4,
      month: 0.5,
      year: 0.4,
      life: 0.3,
    }),
    getWidgetCache: () => {
      throw new Error('unused');
    },
    setUserProfile: () => {},
    subscribe: () => () => {},
  };
}

function makeSubscriptionRepository(isPremium = true): ISubscriptionRepository {
  return {
    getIsPremium: () => isPremium,
    setIsPremium: () => {},
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
    getTrialStartDate: () => null,
    setTrialStartDate: () => {},
    getAppOpenCount: () => 0,
    setAppOpenCount: () => {},
    incrementAppOpenCount: () => 1,
    getLifeScreenViewed: () => false,
    setLifeScreenViewed: () => {},
    getLifeUnlockUntil: () => null,
    setLifeUnlockUntil: () => {},
    getState: () => ({ isPremium, deviceId: null, lastVerifiedAt: null }),
    subscribe: () => () => {},
  };
}

describe('reflectionEngine', () => {
  it('formats a stable local date key', () => {
    expect(getDateKey(new Date(2026, 4, 5, 23, 10, 0))).toBe('2026-05-05');
  });

  it('uses evening day-end copy when most of the day has passed', () => {
    const reflection = generateDailyReflection(baseInput());
    expect(reflection.category).toBe('day');
    expect(reflection.message).toContain('today');
  });

  it('never selects life without a birth date', () => {
    const reflection = generateDailyReflection(
      baseInput({ date: lifeEligibleMorning, hasBirthDate: false })
    );
    expect(reflection.category).not.toBe('life');
  });

  it('never selects premium-only life for non-premium users', () => {
    const reflection = generateDailyReflection(
      baseInput({ date: lifeEligibleMorning, hasPremiumBundle: false })
    );
    expect(reflection.category).not.toBe('life');
  });

  it('allows life reflections for premium users with birth date', () => {
    const reflection = generateDailyReflection(
      baseInput({ date: lifeEligibleMorning, dayProgress: 0.3 })
    );
    expect(reflection.category).toBe('life');
    expect(reflection.premium).toBe(true);
  });

  it('makes radical tone stronger than quiet tone', () => {
    const quiet = generateDailyReflection(baseInput({ tone: 'quiet' }));
    const radical = generateDailyReflection(baseInput({ tone: 'radical' }));
    expect(radical.message).not.toBe(quiet.message);
    expect(radical.tone).toBe('radical');
  });
});

describe('GetDailyReflectionUseCase', () => {
  it('reuses cached reflection on the same day', () => {
    const persistence = makePersistence();
    const useCase = new GetDailyReflectionUseCase(
      makeTimeRepository(),
      makeSubscriptionRepository(true),
      persistence
    );

    const first = useCase.execute(new Date(2026, 4, 25, 9, 0, 0));
    const second = useCase.execute(new Date(2026, 4, 25, 21, 0, 0));

    expect(second.reflection).toEqual(first.reflection);
  });

  it('hides a dismissed reflection until the next day', () => {
    const persistence = makePersistence();
    const useCase = new GetDailyReflectionUseCase(
      makeTimeRepository(),
      makeSubscriptionRepository(true),
      persistence
    );

    const first = useCase.execute(new Date(2026, 4, 25, 9, 0, 0));
    useCase.dismissForDay(first.reflection.dateKey);
    const dismissed = useCase.execute(new Date(2026, 4, 25, 21, 0, 0));
    const nextDay = useCase.execute(new Date(2026, 4, 26, 9, 0, 0));

    expect(dismissed.visible).toBe(false);
    expect(nextDay.visible).toBe(true);
  });
});
