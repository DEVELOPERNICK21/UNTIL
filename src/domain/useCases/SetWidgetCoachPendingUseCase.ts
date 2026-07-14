import type { IEngagementRepository } from '../repository/IEngagementRepository';

export class SetWidgetCoachPendingUseCase {
  constructor(private readonly engagementRepository: IEngagementRepository) {}

  execute(): void {
    this.engagementRepository.setWidgetCoachPending();
  }
}
