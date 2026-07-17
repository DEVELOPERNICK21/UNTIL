/**
 * Port for onboarding completion + quiz funnel state (auth flow).
 */

import type {
  OnboardingFunnelStep,
  OnboardingQuizAnswers,
} from '../../types';

export interface IOnboardingRepository {
  getCompleted(): boolean;
  setCompleted(value: boolean): void;
  getFunnelStep(): OnboardingFunnelStep;
  setFunnelStep(step: OnboardingFunnelStep): void;
  getQuizAnswers(): OnboardingQuizAnswers;
  setQuizAnswers(answers: OnboardingQuizAnswers): void;
  patchQuizAnswers(patch: Partial<OnboardingQuizAnswers>): OnboardingQuizAnswers;
}
