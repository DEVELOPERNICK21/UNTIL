import type { IEngagementRepository } from '../src/domain/repository/IEngagementRepository';

/** In-memory fake mirroring review-flag semantics for Task 4 use-case tests. */
function createInMemoryEngagementReviewFlags(): IEngagementRepository {
  let reviewPending = false;
  let lastAutoReviewRequestAt: number | null = null;
  let firstOpenDate: string | null = null;

  return {
    getModalState: () => ({
      widgetCoachPending: false,
      featureCoachPending: false,
      sharePromptPending: false,
    }),
    setWidgetCoachPending: () => {},
    clearWidgetCoachPending: () => {},
    scheduleFeatureCoachIfEligible: () => {},
    markFeatureCoachShown: () => {},
    clearFeatureCoachPending: () => {},
    scheduleSharePrompt: () => {},
    clearSharePromptPending: () => {},
    scheduleReviewPrompt: () => {
      reviewPending = true;
    },
    clearReviewPending: () => {
      reviewPending = false;
    },
    isReviewPending: () => reviewPending,
    getLastAutoReviewRequestAt: () => lastAutoReviewRequestAt,
    setLastAutoReviewRequestAt: (ms: number) => {
      lastAutoReviewRequestAt = ms;
    },
    ensureFirstOpenDate: (dateKey: string) => {
      if (!firstOpenDate) firstOpenDate = dateKey;
    },
    getFirstOpenDate: () => firstOpenDate,
    getCountdownCompletedFiredId: () => null,
    setCountdownCompletedFired: () => {},
    clearCountdownCompletedFired: () => {},
  };
}

describe('engagementReviewFlags', () => {
  it('schedules and clears review pending', () => {
    const repo = createInMemoryEngagementReviewFlags();
    expect(repo.isReviewPending()).toBe(false);
    repo.scheduleReviewPrompt();
    expect(repo.isReviewPending()).toBe(true);
    repo.clearReviewPending();
    expect(repo.isReviewPending()).toBe(false);
  });

  it('stores last auto review request timestamp', () => {
    const repo = createInMemoryEngagementReviewFlags();
    expect(repo.getLastAutoReviewRequestAt()).toBeNull();
    repo.setLastAutoReviewRequestAt(1_700_000_000_000);
    expect(repo.getLastAutoReviewRequestAt()).toBe(1_700_000_000_000);
  });

  it('ensureFirstOpenDate writes once', () => {
    const repo = createInMemoryEngagementReviewFlags();
    repo.ensureFirstOpenDate('2026-07-01');
    repo.ensureFirstOpenDate('2026-07-22');
    expect(repo.getFirstOpenDate()).toBe('2026-07-01');
  });
});
