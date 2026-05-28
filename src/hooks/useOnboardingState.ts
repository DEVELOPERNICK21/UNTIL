/**
 * useOnboardingState - exposes onboarding completion and complete action for auth flow.
 */

import { useState, useCallback } from 'react';
import {
  getOnboardingCompletedUseCase,
  setOnboardingCompletedUseCase,
} from '../di';
import { runOnboardingCompletionSideEffects } from '../services/onboardingCompletion';

export function useOnboardingState() {
  const [hasCompleted, setHasCompleted] = useState(() =>
    getOnboardingCompletedUseCase.execute()
  );

  const completeOnboarding = useCallback(() => {
    setOnboardingCompletedUseCase.execute();
    runOnboardingCompletionSideEffects();
    setHasCompleted(true);
  }, []);

  return { hasCompleted: hasCompleted, completeOnboarding };
}
