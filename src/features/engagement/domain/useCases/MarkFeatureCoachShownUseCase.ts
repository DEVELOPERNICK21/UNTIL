import type { IEngagementRepository } from '../ports/IEngagementRepository';

export class MarkFeatureCoachShownUseCase {
  constructor(private readonly engagementRepository: IEngagementRepository) {}

  execute(): void {
    this.engagementRepository.markFeatureCoachShown();
  }
}
