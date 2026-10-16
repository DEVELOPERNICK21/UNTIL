import { useMemo } from 'react';
import { getOnboardingQuizAnswersUseCase } from '../../../app/di';

export function useOnboardingQuizAnswers() {
  return useMemo(() => getOnboardingQuizAnswersUseCase.execute(), []);
}
