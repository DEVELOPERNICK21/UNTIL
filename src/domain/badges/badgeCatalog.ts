/**
 * Badge catalog and evaluation (pure).
 *
 * Every badge is a threshold on one number from a BadgeSnapshot. Keeping the
 * rule that uniform means progress bars, unlock checks and tests all share the
 * same code path, and a new badge is one line in BADGES.
 */

import type { DailyTask } from '../../types';

export type BadgeFamily = 'presence' | 'tasks' | 'time';

/** Look of the medal. `ember` is the rare orange one. */
export type BadgeTier = 'bronze' | 'silver' | 'gold' | 'ember';

export type BadgeGlyphKind =
  | 'spark'
  | 'flame'
  | 'check'
  | 'sun'
  | 'hourglass'
  | 'globe'
  | 'flag'
  | 'target'
  | 'star';

/** Numbers the catalog can test. Each one comes from BadgeSnapshot. */
export type BadgeMetric = keyof BadgeSnapshot;

export interface BadgeSnapshot {
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

export interface BadgeDefinition {
  id: string;
  family: BadgeFamily;
  tier: BadgeTier;
  glyph: BadgeGlyphKind;
  title: string;
  /** What to do to earn it. Shown on locked and earned badges. */
  description: string;
  metric: BadgeMetric;
  target: number;
}

/** A day only counts as "clean" with at least this many tasks. */
export const PERFECT_DAY_MIN_TASKS = 3;

export const BADGES: readonly BadgeDefinition[] = [
  // Presence: open UNTIL on consecutive days.
  {
    id: 'streak_1',
    family: 'presence',
    tier: 'bronze',
    glyph: 'spark',
    title: 'Day one',
    description: 'Open UNTIL. The count starts here.',
    metric: 'longestStreak',
    target: 1,
  },
  {
    id: 'streak_3',
    family: 'presence',
    tier: 'bronze',
    glyph: 'flame',
    title: 'Three in a row',
    description: 'Open UNTIL 3 days in a row.',
    metric: 'longestStreak',
    target: 3,
  },
  {
    id: 'streak_7',
    family: 'presence',
    tier: 'silver',
    glyph: 'flame',
    title: 'One full week',
    description: 'Open UNTIL 7 days in a row.',
    metric: 'longestStreak',
    target: 7,
  },
  {
    id: 'streak_30',
    family: 'presence',
    tier: 'gold',
    glyph: 'flame',
    title: '30 days',
    description: 'Open UNTIL 30 days in a row.',
    metric: 'longestStreak',
    target: 30,
  },
  {
    id: 'streak_100',
    family: 'presence',
    tier: 'ember',
    glyph: 'flame',
    title: '100 days',
    description: 'Open UNTIL 100 days in a row.',
    metric: 'longestStreak',
    target: 100,
  },

  // Tasks: finish what you planned.
  {
    id: 'task_1',
    family: 'tasks',
    tier: 'bronze',
    glyph: 'check',
    title: 'First one done',
    description: 'Finish your first task.',
    metric: 'tasksCompleted',
    target: 1,
  },
  {
    id: 'task_10',
    family: 'tasks',
    tier: 'bronze',
    glyph: 'check',
    title: 'Ten down',
    description: 'Finish 10 tasks.',
    metric: 'tasksCompleted',
    target: 10,
  },
  {
    id: 'task_50',
    family: 'tasks',
    tier: 'silver',
    glyph: 'check',
    title: 'Fifty finished',
    description: 'Finish 50 tasks.',
    metric: 'tasksCompleted',
    target: 50,
  },
  {
    id: 'task_200',
    family: 'tasks',
    tier: 'gold',
    glyph: 'check',
    title: 'Two hundred',
    description: 'Finish 200 tasks.',
    metric: 'tasksCompleted',
    target: 200,
  },
  {
    id: 'perfect_1',
    family: 'tasks',
    tier: 'silver',
    glyph: 'sun',
    title: 'Clean day',
    description: `Finish every task on a day with ${PERFECT_DAY_MIN_TASKS} or more.`,
    metric: 'perfectDays',
    target: 1,
  },
  {
    id: 'perfect_7',
    family: 'tasks',
    tier: 'gold',
    glyph: 'sun',
    title: 'Seven clean days',
    description: 'Have 7 clean days.',
    metric: 'perfectDays',
    target: 7,
  },

  // Time: look at your own time.
  {
    id: 'life_set',
    family: 'time',
    tier: 'bronze',
    glyph: 'hourglass',
    title: 'Your number',
    description: 'Save your birth date in Settings.',
    metric: 'birthDateSet',
    target: 1,
  },
  {
    id: 'life_viewed',
    family: 'time',
    tier: 'bronze',
    glyph: 'globe',
    title: 'The big picture',
    description: 'Open the Life screen.',
    metric: 'lifeViewed',
    target: 1,
  },
  {
    id: 'deadline_set',
    family: 'time',
    tier: 'bronze',
    glyph: 'flag',
    title: 'Deadline set',
    description: 'Add a countdown.',
    metric: 'countdownsCreated',
    target: 1,
  },
  {
    id: 'deadline_reached',
    family: 'time',
    tier: 'silver',
    glyph: 'flag',
    title: 'Made it',
    description: 'Reach the date of a countdown.',
    metric: 'countdownsReached',
    target: 1,
  },
  {
    id: 'goal_set',
    family: 'time',
    tier: 'bronze',
    glyph: 'target',
    title: 'Goal set',
    description: 'Create a monthly goal.',
    metric: 'goalsCreated',
    target: 1,
  },
  {
    id: 'opens_50',
    family: 'time',
    tier: 'silver',
    glyph: 'star',
    title: 'Regular',
    description: 'Open UNTIL 50 times.',
    metric: 'appOpens',
    target: 50,
  },
];

const BADGE_BY_ID = new Map(BADGES.map(b => [b.id, b]));

export function getBadgeDefinition(id: string): BadgeDefinition | undefined {
  return BADGE_BY_ID.get(id);
}

export interface BadgeProgress {
  value: number;
  target: number;
  /** 0 to 1, clamped. */
  ratio: number;
  reached: boolean;
}

export function getBadgeProgress(
  badge: BadgeDefinition,
  snapshot: BadgeSnapshot,
): BadgeProgress {
  const value = Math.max(0, snapshot[badge.metric]);
  return {
    value,
    target: badge.target,
    ratio: Math.min(1, value / badge.target),
    reached: value >= badge.target,
  };
}

/** Ids whose rule is met now and that are not in `alreadyEarned`. Catalog order. */
export function findNewlyEarned(
  snapshot: BadgeSnapshot,
  alreadyEarned: ReadonlySet<string>,
): string[] {
  return BADGES.filter(
    b => !alreadyEarned.has(b.id) && getBadgeProgress(b, snapshot).reached,
  ).map(b => b.id);
}

type TaskDayRow = Pick<DailyTask, 'date' | 'completed'>;

export function countCompletedTasks(tasks: readonly TaskDayRow[]): number {
  return tasks.reduce((sum, t) => sum + (t.completed ? 1 : 0), 0);
}

/** Days with at least `minTasks` tasks where every task is done. */
export function countPerfectDays(
  tasks: readonly TaskDayRow[],
  minTasks: number = PERFECT_DAY_MIN_TASKS,
): number {
  const byDay = new Map<string, { total: number; done: number }>();
  for (const t of tasks) {
    const day = byDay.get(t.date) ?? { total: 0, done: 0 };
    day.total += 1;
    if (t.completed) day.done += 1;
    byDay.set(t.date, day);
  }
  let perfect = 0;
  byDay.forEach(day => {
    if (day.total >= minTasks && day.done === day.total) perfect += 1;
  });
  return perfect;
}

/** Next badge in a family the user is closest to, for the "up next" hint. */
export function pickUpNext(
  snapshot: BadgeSnapshot,
  earnedIds: ReadonlySet<string>,
): BadgeDefinition | null {
  let best: BadgeDefinition | null = null;
  let bestRatio = -1;
  for (const badge of BADGES) {
    if (earnedIds.has(badge.id)) continue;
    const { ratio } = getBadgeProgress(badge, snapshot);
    // Skip badges with nothing done yet so the hint is always a real next step.
    if (ratio <= 0) continue;
    if (ratio > bestRatio) {
      best = badge;
      bestRatio = ratio;
    }
  }
  return best;
}
