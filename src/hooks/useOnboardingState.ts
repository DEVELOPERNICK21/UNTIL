/**
 * useOnboardingState - exposes onboarding completion and complete action for auth flow.
 */

import { useState, useCallback } from 'react';
import {
  getOnboardingCompletedUseCase,
  setOnboardingCompletedUseCase,
} from '../di';
import { runOnboardingCompletionSideEffects } from '../services/onboardingCompletion';
import type { OnboardingExitParams } from '../services/onboardingCompletion';

export function useOnboardingState() {
  const [hasCompleted, setHasCompleted] = useState(() =>
    getOnboardingCompletedUseCase.execute()
  );

  const completeOnboarding = useCallback((params?: OnboardingExitParams) => {
    setOnboardingCompletedUseCase.execute();
    runOnboardingCompletionSideEffects(params);
    setHasCompleted(true);
  }, []);

  return { hasCompleted: hasCompleted, completeOnboarding };
}
