import type { IEngagementRepository } from '../ports/IEngagementRepository';

export class ClearSharePromptPendingUseCase {
  constructor(private readonly engagementRepository: IEngagementRepository) {}

  execute(): void {
    this.engagementRepository.clearSharePromptPending();
  }
}
