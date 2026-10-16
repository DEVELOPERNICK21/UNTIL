import type { ICountdownRepository } from '../ports/ICountdownRepository';
import type { ICountdownEngagementSignals } from '../ports/ICountdownEngagementSignals';
import type { Countdown } from '../../../../shared/types';

export class AddCountdownUseCase {
  constructor(
    private readonly countdownRepository: ICountdownRepository,
    private readonly engagementRepository: ICountdownEngagementSignals
  ) {}

  execute(title: string, date: string): Countdown {
    this.engagementRepository.clearCountdownCompletedFired();
    return this.countdownRepository.add(title, date);
  }
}
