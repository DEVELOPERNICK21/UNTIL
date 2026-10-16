import type { IOnboardingRepository } from '../ports/IOnboardingRepository';
import type { OnboardingQuizAnswers } from '../../../../shared/types';

export class PatchOnboardingQuizAnswersUseCase {
  constructor(private readonly repository: IOnboardingRepository) {}

  execute(patch: Partial<OnboardingQuizAnswers>): OnboardingQuizAnswers {
    return this.repository.patchQuizAnswers(patch);
  }
}
