/**
 * Public API of the onboarding feature. Other features and the app import from here only;
 * everything else in this folder is private. Add an export deliberately when another module needs it.
 */

export { personalizedEmberTipsForRoute } from './domain/personalizedInsights';
export type { OnboardingExitParams } from './services/onboardingCompletion';
export { useOnboardingFunnel } from './hooks/useOnboardingFunnel';
export { useOnboardingQuizAnswers } from './hooks/useOnboardingQuizAnswers';
export { useOnboardingState } from './hooks/useOnboardingState';
export { LifeWeeksPreviewScreen } from './ui/LifeWeeksPreviewScreen';
export {
  OnboardingCompleteContext,
  useOnboardingComplete,
} from './ui/OnboardingCompleteContext';
export { useEnter } from './ui/onboardingMotion';
export { OnboardingScreen } from './ui/OnboardingScreen';
