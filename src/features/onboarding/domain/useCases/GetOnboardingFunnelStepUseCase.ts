import type { IOnboardingRepository } from '../ports/IOnboardingRepository';
import type { OnboardingFunnelStep } from '../../../../shared/types';

export class GetOnboardingFunnelStepUseCase {
  constructor(private readonly repository: IOnboardingRepository) {}

  execute(): OnboardingFunnelStep {
    return this.repository.getFunnelStep();
  }
}
