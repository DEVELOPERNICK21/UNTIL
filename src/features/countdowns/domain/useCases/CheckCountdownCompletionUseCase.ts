import { daysBetween, getSignedDaysUntil } from '../daysLeft';
import { featuredCountdown } from '../featured';
import type { ICountdownRepository } from '../ports/ICountdownRepository';
import type { ICountdownEngagementSignals } from '../ports/ICountdownEngagementSignals';

export type CountdownCompletedEvent = {
  countdown_id: string;
  days_used: number;
};

export class CheckCountdownCompletionUseCase {
  constructor(
    private readonly countdownRepository: ICountdownRepository,
    private readonly engagementRepository: ICountdownEngagementSignals,
    private readonly onCompleted?: (event: CountdownCompletedEvent) => void
  ) {}

  execute(): void {
    // With several deadlines, the one that matters is the one the widget shows: the nearest.
    const countdown = featuredCountdown(this.countdownRepository.getAll());
    if (!countdown) return;

    // Only on the day itself. An overdue deadline is not "reached today", and the share and review
    // prompts it schedules would say the wrong thing.
    if (getSignedDaysUntil(countdown.date) !== 0) return;

    const firedFor = this.engagementRepository.getCountdownCompletedFiredId();
    if (firedFor === countdown.id) return;

    const createdAt = countdown.createdAt ?? countdown.date;
    const daysUsed = daysBetween(createdAt, countdown.date);
    // A deadline set for today never counted down: nothing to celebrate.
    if (daysUsed === 0) return;

    this.engagementRepository.setCountdownCompletedFired(countdown.id);
    this.onCompleted?.({
      countdown_id: countdown.id,
      days_used: daysUsed,
    });
    this.engagementRepository.scheduleSharePrompt();
    this.engagementRepository.scheduleReviewPrompt();
  }
}
