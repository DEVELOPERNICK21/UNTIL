import type { IEngagementRepository } from '../ports/IEngagementRepository';

export class ClearWidgetCoachPendingUseCase {
  constructor(private readonly engagementRepository: IEngagementRepository) {}

  execute(): void {
    this.engagementRepository.clearWidgetCoachPending();
  }
}
