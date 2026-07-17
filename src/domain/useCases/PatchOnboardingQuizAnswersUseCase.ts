import type { IOnboardingRepository } from '../repository/IOnboardingRepository';
import type { OnboardingQuizAnswers } from '../../types';

export class PatchOnboardingQuizAnswersUseCase {
  constructor(private readonly repository: IOnboardingRepository) {}

  execute(patch: Partial<OnboardingQuizAnswers>): OnboardingQuizAnswers {
    return this.repository.patchQuizAnswers(patch);
  }
}
