/**
 * Port for onboarding completion state (auth flow).
 */

export interface IOnboardingRepository {
  getCompleted(): boolean;
  setCompleted(value: boolean): void;
}
