/**
 * The numbers badges are judged on (see badgeCatalog). One number per rule, so progress bars,
 * unlock checks and tests share the same code path.
 */

import { EMPTY_PLAN_BADGE_SNAPSHOT, type PlanBadgeSnapshot } from './planBadges';

export interface BadgeSnapshot extends PlanBadgeSnapshot {
  /** Best run of days in a row. Uses the longest value, so a reset never un-earns. */
  longestStreak: number;
  /** Tasks marked done, all days. */
  tasksCompleted: number;
  /** Days where every task was done (see PERFECT_DAY_MIN_TASKS). */
  perfectDays: number;
  countdownsCreated: number;
  countdownsReached: number;
  goalsCreated: number;
  /** 1 when a birth date is saved, else 0. */
  birthDateSet: number;
  /** 1 once the Life screen has been opened, else 0. */
  lifeViewed: number;
  appOpens: number;
}

export const EMPTY_BADGE_SNAPSHOT: BadgeSnapshot = {
  ...EMPTY_PLAN_BADGE_SNAPSHOT,
  longestStreak: 0,
  tasksCompleted: 0,
  perfectDays: 0,
  countdownsCreated: 0,
  countdownsReached: 0,
  goalsCreated: 0,
  birthDateSet: 0,
  lifeViewed: 0,
  appOpens: 0,
};

