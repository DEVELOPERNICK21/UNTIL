import type { IOnboardingRepository } from '../repository/IOnboardingRepository';
import type { OnboardingQuizAnswers } from '../../types';

export class GetOnboardingQuizAnswersUseCase {
  constructor(private readonly repository: IOnboardingRepository) {}

  execute(): OnboardingQuizAnswers {
    return this.repository.getQuizAnswers();
  }
}
