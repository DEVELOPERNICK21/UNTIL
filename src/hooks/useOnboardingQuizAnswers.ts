import { useMemo } from 'react';
import { getOnboardingQuizAnswersUseCase } from '../di';

export function useOnboardingQuizAnswers() {
  return useMemo(() => getOnboardingQuizAnswersUseCase.execute(), []);
}
