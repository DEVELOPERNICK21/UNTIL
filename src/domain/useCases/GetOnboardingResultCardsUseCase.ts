import type { IOnboardingRepository } from '../repository/IOnboardingRepository';
import {
  buildResultCards,
  type OnboardingResultCard,
} from '../../core/onboarding';

export type { OnboardingResultCard };

export class GetOnboardingResultCardsUseCase {
  constructor(private readonly repository: IOnboardingRepository) {}

  execute(): OnboardingResultCard[] {
    return buildResultCards(this.repository.getQuizAnswers());
  }
}
