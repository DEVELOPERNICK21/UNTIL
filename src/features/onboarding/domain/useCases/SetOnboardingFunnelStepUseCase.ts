import type { IOnboardingRepository } from '../ports/IOnboardingRepository';
import type { OnboardingFunnelStep } from '../../../../shared/types';

export class SetOnboardingFunnelStepUseCase {
  constructor(private readonly repository: IOnboardingRepository) {}

  execute(step: OnboardingFunnelStep): void {
    this.repository.setFunnelStep(step);
  }
}
