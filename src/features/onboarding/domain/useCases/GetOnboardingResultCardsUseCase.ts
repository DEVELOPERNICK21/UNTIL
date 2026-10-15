import type { IOnboardingRepository } from '../ports/IOnboardingRepository';
import { buildResultCards, type OnboardingResultCard } from '../quizFunnel';

export type { OnboardingResultCard };

export class GetOnboardingResultCardsUseCase {
  constructor(private readonly repository: IOnboardingRepository) {}

  execute(): OnboardingResultCard[] {
    return buildResultCards(this.repository.getQuizAnswers());
  }
}
