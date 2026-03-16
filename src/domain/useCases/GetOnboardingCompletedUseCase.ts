import type { IOnboardingRepository } from '../repository/IOnboardingRepository';

export class GetOnboardingCompletedUseCase {
  constructor(private readonly repository: IOnboardingRepository) {}

  execute(): boolean {
    return this.repository.getCompleted();
  }
}
