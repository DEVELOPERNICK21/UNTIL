import type { IEngagementRepository } from '../ports/IEngagementRepository';

export class SetWidgetCoachPendingUseCase {
  constructor(private readonly engagementRepository: IEngagementRepository) {}

  execute(): void {
    this.engagementRepository.setWidgetCoachPending();
  }
}
