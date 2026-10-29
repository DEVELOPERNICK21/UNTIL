import type { ICountdownRepository } from '../ports/ICountdownRepository';
import type { ICountdownEngagementSignals } from '../ports/ICountdownEngagementSignals';
import type { Countdown } from '../../../../shared/types';

export class AddCountdownUseCase {
  constructor(
    private readonly countdownRepository: ICountdownRepository,
    private readonly engagementRepository: ICountdownEngagementSignals
  ) {}

  /** Returns null, and changes nothing, when the person already holds `limit` deadlines. */
  execute(title: string, date: string, limit: number): Countdown | null {
    if (this.countdownRepository.getAll().length >= limit) return null;
    this.engagementRepository.clearCountdownCompletedFired();
    return this.countdownRepository.add(title, date);
  }
}
