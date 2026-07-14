import type { IEngagementRepository } from '../repository/IEngagementRepository';

export class ClearWidgetCoachPendingUseCase {
  constructor(private readonly engagementRepository: IEngagementRepository) {}

  execute(): void {
    this.engagementRepository.clearWidgetCoachPending();
  }
}
