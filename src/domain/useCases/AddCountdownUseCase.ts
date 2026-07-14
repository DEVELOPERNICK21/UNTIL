import type { ICountdownRepository } from '../repository/ICountdownRepository';
import type { IEngagementRepository } from '../repository/IEngagementRepository';
import type { Countdown } from '../../types';

export class AddCountdownUseCase {
  constructor(
    private readonly countdownRepository: ICountdownRepository,
    private readonly engagementRepository: IEngagementRepository
  ) {}

  execute(title: string, date: string): Countdown {
    this.engagementRepository.clearCountdownCompletedFired();
    return this.countdownRepository.add(title, date);
  }
}
