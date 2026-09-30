import { getSignedDaysUntil } from '../../core/countdown/daysLeft';
import {
  countCompletedTasks,
  countPerfectDays,
  findNewlyEarned,
  type BadgeSnapshot,
} from '../badges/badgeCatalog';
import { localDateKey } from '../presence/presenceStreak';
import type { IBadgeRepository } from '../repository/IBadgeRepository';
import type { ICountdownRepository } from '../repository/ICountdownRepository';
import type { IMonthlyGoalRepository } from '../repository/IMonthlyGoalRepository';
import type { IPresenceRepository } from '../repository/IPresenceRepository';
import type { ISubscriptionRepository } from '../repository/ISubscriptionRepository';
import type { ITaskRepository } from '../repository/ITaskRepository';
import type { ITimeRepository } from '../repository/ITimeRepository';

/**
 * Reads the numbers badges are judged on, awards any badge whose rule is now
 * met, and returns the ids that are new. Earned badges are never taken back,
 * even if the user later un-checks a task or removes a countdown.
 */
export class EvaluateBadgesUseCase {
  constructor(
    private readonly badgeRepository: IBadgeRepository,
    private readonly presenceRepository: IPresenceRepository,
    private readonly taskRepository: ITaskRepository,
    private readonly countdownRepository: ICountdownRepository,
    private readonly monthlyGoalRepository: IMonthlyGoalRepository,
    private readonly timeRepository: ITimeRepository,
    private readonly subscriptionRepository: ISubscriptionRepository,
  ) {}

  snapshot(): BadgeSnapshot {
    const presence = this.presenceRepository.getState();
    const tasks = this.taskRepository.getAllTasks();
    const countdowns = this.countdownRepository.getAll();
    return {
      longestStreak: Math.max(presence.longest, presence.count),
      tasksCompleted: countCompletedTasks(tasks),
      perfectDays: countPerfectDays(tasks),
      countdownsCreated: countdowns.length,
      countdownsReached: countdowns.filter(c => getSignedDaysUntil(c.date) <= 0)
        .length,
      goalsCreated: this.monthlyGoalRepository.getAllGoals().length,
      birthDateSet: this.timeRepository.getUserProfile().birthDate ? 1 : 0,
      lifeViewed: this.subscriptionRepository.getLifeScreenViewed() ? 1 : 0,
      appOpens: this.subscriptionRepository.getAppOpenCount(),
    };
  }

  execute(now: Date = new Date()): string[] {
    const state = this.badgeRepository.getState();
    const newIds = findNewlyEarned(this.snapshot(), new Set(Object.keys(state.earned)));
    if (newIds.length === 0) return [];

    const today = localDateKey(now);
    const earned = { ...state.earned };
    for (const id of newIds) earned[id] = today;
    this.badgeRepository.setState({ ...state, earned });
    return newIds;
  }
}
