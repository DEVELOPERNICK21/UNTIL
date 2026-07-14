/**
 * Port for post-onboarding engagement modal flags (widget coach, feature coach, share prompt).
 */

export type EngagementModalState = {
  widgetCoachPending: boolean;
  featureCoachPending: boolean;
  sharePromptPending: boolean;
};

export interface IEngagementRepository {
  getModalState(): EngagementModalState;
  setWidgetCoachPending(): void;
  clearWidgetCoachPending(): void;
  scheduleFeatureCoachIfEligible(appOpenCount: number): void;
  markFeatureCoachShown(): void;
  clearFeatureCoachPending(): void;
  scheduleSharePrompt(): void;
  clearSharePromptPending(): void;
  getCountdownCompletedFiredId(): string | null;
  setCountdownCompletedFired(countdownId: string): void;
  clearCountdownCompletedFired(): void;
}
