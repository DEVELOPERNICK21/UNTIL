import type { IOnboardingRepository } from '../repository/IOnboardingRepository';
import type { OnboardingFunnelStep } from '../../types';

export class SetOnboardingFunnelStepUseCase {
  constructor(private readonly repository: IOnboardingRepository) {}

  execute(step: OnboardingFunnelStep): void {
    this.repository.setFunnelStep(step);
  }
}
