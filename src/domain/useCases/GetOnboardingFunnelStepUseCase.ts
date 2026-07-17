import type { IOnboardingRepository } from '../repository/IOnboardingRepository';
import type { OnboardingFunnelStep } from '../../types';

export class GetOnboardingFunnelStepUseCase {
  constructor(private readonly repository: IOnboardingRepository) {}

  execute(): OnboardingFunnelStep {
    return this.repository.getFunnelStep();
  }
}
