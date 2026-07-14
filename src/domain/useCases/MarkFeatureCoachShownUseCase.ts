import type { IEngagementRepository } from '../repository/IEngagementRepository';

export class MarkFeatureCoachShownUseCase {
  constructor(private readonly engagementRepository: IEngagementRepository) {}

  execute(): void {
    this.engagementRepository.markFeatureCoachShown();
  }
}
