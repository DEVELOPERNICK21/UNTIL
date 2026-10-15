/**
 * ICountdownEngagementSignals - What the countdown use cases tell the engagement side when a
 * countdown is added or reaches zero: remember it fired, and line up the share and review prompts.
 * Declared here so countdowns do not depend on the engagement feature; its repository satisfies it.
 */

export interface ICountdownEngagementSignals {
  getCountdownCompletedFiredId(): string | null;
  setCountdownCompletedFired(countdownId: string): void;
  clearCountdownCompletedFired(): void;
  scheduleSharePrompt(): void;
  scheduleReviewPrompt(): void;
}
