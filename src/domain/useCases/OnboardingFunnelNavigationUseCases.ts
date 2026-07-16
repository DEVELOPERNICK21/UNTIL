import type { IOnboardingRepository } from '../repository/IOnboardingRepository';
import {
  getFunnelEncouragement,
  getFunnelProgress,
  nextFunnelStep,
  prevFunnelStep,
} from '../../core/onboarding';
import type { OnboardingFunnelStep } from '../../types';

export class AdvanceOnboardingFunnelUseCase {
  constructor(private readonly repository: IOnboardingRepository) {}

  execute(): OnboardingFunnelStep | null {
    const next = nextFunnelStep(this.repository.getFunnelStep());
    if (next) this.repository.setFunnelStep(next);
    return next;
  }
}

export class RewindOnboardingFunnelUseCase {
  constructor(private readonly repository: IOnboardingRepository) {}

  execute(): OnboardingFunnelStep | null {
    const prev = prevFunnelStep(this.repository.getFunnelStep());
    if (prev) this.repository.setFunnelStep(prev);
    return prev;
  }
}

export class GetOnboardingFunnelProgressUseCase {
  constructor(private readonly repository: IOnboardingRepository) {}

  execute(): number {
    return getFunnelProgress(this.repository.getFunnelStep());
  }
}

export class GetOnboardingFunnelEncouragementUseCase {
  constructor(private readonly repository: IOnboardingRepository) {}

  execute(): string | null {
    return getFunnelEncouragement(this.repository.getFunnelStep());
  }
}
