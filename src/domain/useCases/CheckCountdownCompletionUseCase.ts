import { daysBetween, getDaysLeft } from '../../core/countdown/daysLeft';
import type { ICountdownRepository } from '../repository/ICountdownRepository';
import type { IEngagementRepository } from '../repository/IEngagementRepository';

export type CountdownCompletedEvent = {
  countdown_id: string;
  days_used: number;
};

export class CheckCountdownCompletionUseCase {
  constructor(
    private readonly countdownRepository: ICountdownRepository,
    private readonly engagementRepository: IEngagementRepository,
    private readonly onCompleted?: (event: CountdownCompletedEvent) => void
  ) {}

  execute(): void {
    const countdowns = this.countdownRepository.getAll();
    const countdown = countdowns[0];
    if (!countdown) return;

    if (getDaysLeft(countdown.date) !== 0) return;

    const firedFor = this.engagementRepository.getCountdownCompletedFiredId();
    if (firedFor === countdown.id) return;

    const createdAt = countdown.createdAt ?? countdown.date;
    const daysUsed = daysBetween(createdAt, countdown.date);

    this.engagementRepository.setCountdownCompletedFired(countdown.id);
    this.onCompleted?.({
      countdown_id: countdown.id,
      days_used: daysUsed,
    });
    this.engagementRepository.scheduleSharePrompt();
    this.engagementRepository.scheduleReviewPrompt();
  }
}
