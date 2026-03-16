import type { IOnboardingRepository } from '../repository/IOnboardingRepository';

export class SetOnboardingCompletedUseCase {
  constructor(private readonly repository: IOnboardingRepository) {}

  execute(): void {
    this.repository.setCompleted(true);
  }
}
