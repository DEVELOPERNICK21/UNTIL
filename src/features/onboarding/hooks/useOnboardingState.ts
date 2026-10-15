/**
 * useOnboardingState - exposes onboarding completion and complete action for auth flow.
 */

import { useState, useCallback } from 'react';
import {
  getOnboardingCompletedUseCase,
  setOnboardingCompletedUseCase,
  setWidgetCoachPendingUseCase,
} from '../../../app/di';
import { runOnboardingCompletionSideEffects } from '../data/onboardingCompletion';
import type { OnboardingExitParams } from '../data/onboardingCompletion';

export function useOnboardingState() {
  const [hasCompleted, setHasCompleted] = useState(() =>
    getOnboardingCompletedUseCase.execute()
  );

  const completeOnboarding = useCallback((params?: OnboardingExitParams) => {
    setOnboardingCompletedUseCase.execute();
    setWidgetCoachPendingUseCase.execute();
    runOnboardingCompletionSideEffects(params);
    setHasCompleted(true);
  }, []);

  return { hasCompleted: hasCompleted, completeOnboarding };
}
