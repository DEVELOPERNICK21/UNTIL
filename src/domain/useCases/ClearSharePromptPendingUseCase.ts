import type { IEngagementRepository } from '../repository/IEngagementRepository';

export class ClearSharePromptPendingUseCase {
  constructor(private readonly engagementRepository: IEngagementRepository) {}

  execute(): void {
    this.engagementRepository.clearSharePromptPending();
  }
}
