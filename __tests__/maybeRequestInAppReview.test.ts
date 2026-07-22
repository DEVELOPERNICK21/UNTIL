import { MaybeRequestInAppReviewUseCase } from '../src/domain/useCases/MaybeRequestInAppReviewUseCase';
import { RequestInAppReviewFromSettingsUseCase } from '../src/domain/useCases/RequestInAppReviewFromSettingsUseCase';
import type { IInAppReviewService } from '../src/domain/ports/IInAppReviewService';
import type { IEngagementRepository } from '../src/domain/repository/IEngagementRepository';
import type { ISubscriptionRepository } from '../src/domain/repository/ISubscriptionRepository';
import { AUTO_REVIEW_COOLDOWN_MS } from '../src/core/engagement';

function createFakes(overrides?: {
  reviewPending?: boolean;
  lastAt?: number | null;
  opens?: number;
  firstOpen?: string | null;
  available?: boolean;
  requestThrows?: boolean;
}) {
  let reviewPending = overrides?.reviewPending ?? false;
  let lastAt: number | null =
    overrides?.lastAt === undefined ? null : overrides.lastAt;
  const calls = {
    requestReview: 0,
    openStoreListing: 0,
    clearPending: 0,
    setLastAt: null as number | null,
  };

  const reviewService: IInAppReviewService = {
    isAvailable: () => overrides?.available !== false,
    requestReview: async () => {
      calls.requestReview += 1;
      if (overrides?.requestThrows) throw new Error('fail');
    },
    openStoreListing: async () => {
      calls.openStoreListing += 1;
    },
  };

  const engagement = {
    isReviewPending: () => reviewPending,
    clearReviewPending: () => {
      reviewPending = false;
      calls.clearPending += 1;
    },
    getLastAutoReviewRequestAt: () => lastAt,
    setLastAutoReviewRequestAt: (ms: number) => {
      lastAt = ms;
      calls.setLastAt = ms;
    },
    getFirstOpenDate: () => overrides?.firstOpen ?? '2026-07-01',
  } as unknown as IEngagementRepository;

  const subscription = {
    getAppOpenCount: () => overrides?.opens ?? 5,
  } as unknown as ISubscriptionRepository;

  return { reviewService, engagement, subscription, calls };
}

describe('MaybeRequestInAppReviewUseCase', () => {
  it('requests on countdown when pending and not blocked', async () => {
    const { reviewService, engagement, subscription, calls } = createFakes({
      reviewPending: true,
    });
    const uc = new MaybeRequestInAppReviewUseCase(
      reviewService,
      engagement,
      subscription
    );
    const ok = await uc.execute({
      source: 'countdown',
      blockingOverlayVisible: false,
      nowMs: 1_700_000_000_000,
      todayDateKey: '2026-07-10',
    });
    expect(ok).toBe(true);
    expect(calls.requestReview).toBe(1);
    expect(calls.clearPending).toBe(1);
    expect(calls.setLastAt).toBe(1_700_000_000_000);
  });

  it('skips when blocking overlay visible', async () => {
    const { reviewService, engagement, subscription, calls } = createFakes({
      reviewPending: true,
    });
    const uc = new MaybeRequestInAppReviewUseCase(
      reviewService,
      engagement,
      subscription
    );
    const ok = await uc.execute({
      source: 'countdown',
      blockingOverlayVisible: true,
      nowMs: 1_700_000_000_000,
      todayDateKey: '2026-07-10',
    });
    expect(ok).toBe(false);
    expect(calls.requestReview).toBe(0);
  });

  it('skips opens path when under thresholds', async () => {
    const { reviewService, engagement, subscription, calls } = createFakes({
      opens: 2,
      firstOpen: '2026-07-09',
    });
    const uc = new MaybeRequestInAppReviewUseCase(
      reviewService,
      engagement,
      subscription
    );
    const ok = await uc.execute({
      source: 'opens',
      blockingOverlayVisible: false,
      nowMs: 1_700_000_000_000,
      todayDateKey: '2026-07-10',
    });
    expect(ok).toBe(false);
    expect(calls.requestReview).toBe(0);
  });

  it('does not stamp cooldown when module unavailable', async () => {
    const { reviewService, engagement, subscription, calls } = createFakes({
      reviewPending: true,
      available: false,
    });
    const uc = new MaybeRequestInAppReviewUseCase(
      reviewService,
      engagement,
      subscription
    );
    await uc.execute({
      source: 'countdown',
      blockingOverlayVisible: false,
      nowMs: 1_700_000_000_000,
      todayDateKey: '2026-07-10',
    });
    expect(calls.setLastAt).toBe(null);
    expect(calls.clearPending).toBe(1);
  });

  it('respects 90-day cooldown', async () => {
    const now = 1_700_000_000_000;
    const { reviewService, engagement, subscription, calls } = createFakes({
      reviewPending: true,
      lastAt: now - AUTO_REVIEW_COOLDOWN_MS + 1000,
    });
    const uc = new MaybeRequestInAppReviewUseCase(
      reviewService,
      engagement,
      subscription
    );
    const ok = await uc.execute({
      source: 'countdown',
      blockingOverlayVisible: false,
      nowMs: now,
      todayDateKey: '2026-07-10',
    });
    expect(ok).toBe(false);
    expect(calls.requestReview).toBe(0);
  });
});

describe('RequestInAppReviewFromSettingsUseCase', () => {
  it('falls back to store listing when request fails', async () => {
    const { reviewService, calls } = createFakes({
      requestThrows: true,
    });
    const uc = new RequestInAppReviewFromSettingsUseCase(reviewService);
    await uc.execute();
    expect(calls.requestReview).toBe(1);
    expect(calls.openStoreListing).toBe(1);
  });

  it('falls back when unavailable', async () => {
    const { reviewService, calls } = createFakes({ available: false });
    const uc = new RequestInAppReviewFromSettingsUseCase(reviewService);
    await uc.execute();
    expect(calls.requestReview).toBe(0);
    expect(calls.openStoreListing).toBe(1);
  });
});
