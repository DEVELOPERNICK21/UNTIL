import { createContext, useContext } from 'react';
import type { OnboardingExitParams } from '../../services/onboardingCompletion';

export const OnboardingCompleteContext = createContext<
  ((params?: OnboardingExitParams) => void) | null
>(null);

export function useOnboardingComplete() {
  const cb = useContext(OnboardingCompleteContext);
  if (!cb) throw new Error('Must be used inside AuthNavigator');
  return cb;
}
