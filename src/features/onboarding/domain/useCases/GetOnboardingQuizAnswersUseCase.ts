import type { IOnboardingRepository } from '../ports/IOnboardingRepository';
import type { OnboardingQuizAnswers } from '../../../../shared/types';

export class GetOnboardingQuizAnswersUseCase {
  constructor(private readonly repository: IOnboardingRepository) {}

  execute(): OnboardingQuizAnswers {
    return this.repository.getQuizAnswers();
  }
}
