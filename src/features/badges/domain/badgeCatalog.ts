/**
 * Badge catalog and evaluation (pure).
 *
 * Every badge is a threshold on one number from a BadgeSnapshot. Keeping the
 * rule that uniform means progress bars, unlock checks and tests all share the
 * same code path, and a new badge is one line in BADGES plus its title and
 * description in locales/<code>/badges.json (`badges.items.<id>.title`).
 */

import type { TranslationKey } from '../../../shared/i18n/translate';
import { PERFECT_DAY_MIN_TASKS } from './badgeStats';
import { PLAN_BADGES } from './planBadges';
import type { BadgeSnapshot } from './badgeSnapshot';

export { EMPTY_BADGE_SNAPSHOT, type BadgeSnapshot } from './badgeSnapshot';

export type BadgeFamily = 'presence' | 'tasks' | 'time' | 'premium';

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

export interface BadgeDefinition {
  id: string;
  family: BadgeFamily;
  tier: BadgeTier;
  glyph: BadgeGlyphKind;
  titleKey: TranslationKey;
  /** What to do to earn it. Shown on locked and earned badges. */
  descriptionKey: TranslationKey;
  descriptionParams?: Record<string, number>;
  metric: BadgeMetric;
  target: number;
}

export const BADGES: readonly BadgeDefinition[] = [
  // Presence: open UNTIL on consecutive days.
  {
    id: 'streak_1',
    family: 'presence',
    tier: 'bronze',
    glyph: 'spark',
    titleKey: 'badges.items.streak_1.title',
    descriptionKey: 'badges.items.streak_1.description',
    metric: 'longestStreak',
    target: 1,
  },
  {
    id: 'streak_3',
    family: 'presence',
    tier: 'bronze',
    glyph: 'flame',
    titleKey: 'badges.items.streak_3.title',
    descriptionKey: 'badges.items.streak_3.description',
    metric: 'longestStreak',
    target: 3,
  },
  {
    id: 'streak_7',
    family: 'presence',
    tier: 'silver',
    glyph: 'flame',
    titleKey: 'badges.items.streak_7.title',
    descriptionKey: 'badges.items.streak_7.description',
    metric: 'longestStreak',
    target: 7,
  },
  {
    id: 'streak_30',
    family: 'presence',
    tier: 'gold',
    glyph: 'flame',
    titleKey: 'badges.items.streak_30.title',
    descriptionKey: 'badges.items.streak_30.description',
    metric: 'longestStreak',
    target: 30,
  },
  {
    id: 'streak_100',
    family: 'presence',
    tier: 'ember',
    glyph: 'flame',
    titleKey: 'badges.items.streak_100.title',
    descriptionKey: 'badges.items.streak_100.description',
    metric: 'longestStreak',
    target: 100,
  },

  // Tasks: finish what you planned.
  {
    id: 'task_1',
    family: 'tasks',
    tier: 'bronze',
    glyph: 'check',
    titleKey: 'badges.items.task_1.title',
    descriptionKey: 'badges.items.task_1.description',
    metric: 'tasksCompleted',
    target: 1,
  },
  {
    id: 'task_10',
    family: 'tasks',
    tier: 'bronze',
    glyph: 'check',
    titleKey: 'badges.items.task_10.title',
    descriptionKey: 'badges.items.task_10.description',
    metric: 'tasksCompleted',
    target: 10,
  },
  {
    id: 'task_50',
    family: 'tasks',
    tier: 'silver',
    glyph: 'check',
    titleKey: 'badges.items.task_50.title',
    descriptionKey: 'badges.items.task_50.description',
    metric: 'tasksCompleted',
    target: 50,
  },
  {
    id: 'task_200',
    family: 'tasks',
    tier: 'gold',
    glyph: 'check',
    titleKey: 'badges.items.task_200.title',
    descriptionKey: 'badges.items.task_200.description',
    metric: 'tasksCompleted',
    target: 200,
  },
  {
    id: 'perfect_1',
    family: 'tasks',
    tier: 'silver',
    glyph: 'sun',
    titleKey: 'badges.items.perfect_1.title',
    descriptionKey: 'badges.items.perfect_1.description',
    descriptionParams: { min: PERFECT_DAY_MIN_TASKS },
    metric: 'perfectDays',
    target: 1,
  },
  {
    id: 'perfect_7',
    family: 'tasks',
    tier: 'gold',
    glyph: 'sun',
    titleKey: 'badges.items.perfect_7.title',
    descriptionKey: 'badges.items.perfect_7.description',
    metric: 'perfectDays',
    target: 7,
  },

  // Time: look at your own time.
  {
    id: 'life_set',
    family: 'time',
    tier: 'bronze',
    glyph: 'hourglass',
    titleKey: 'badges.items.life_set.title',
    descriptionKey: 'badges.items.life_set.description',
    metric: 'birthDateSet',
    target: 1,
  },
  {
    id: 'life_viewed',
    family: 'time',
    tier: 'bronze',
    glyph: 'globe',
    titleKey: 'badges.items.life_viewed.title',
    descriptionKey: 'badges.items.life_viewed.description',
    metric: 'lifeViewed',
    target: 1,
  },
  {
    id: 'deadline_set',
    family: 'time',
    tier: 'bronze',
    glyph: 'flag',
    titleKey: 'badges.items.deadline_set.title',
    descriptionKey: 'badges.items.deadline_set.description',
    metric: 'countdownsCreated',
    target: 1,
  },
  {
    id: 'deadline_reached',
    family: 'time',
    tier: 'silver',
    glyph: 'flag',
    titleKey: 'badges.items.deadline_reached.title',
    descriptionKey: 'badges.items.deadline_reached.description',
    metric: 'countdownsReached',
    target: 1,
  },
  {
    id: 'goal_set',
    family: 'time',
    tier: 'bronze',
    glyph: 'target',
    titleKey: 'badges.items.goal_set.title',
    descriptionKey: 'badges.items.goal_set.description',
    metric: 'goalsCreated',
    target: 1,
  },
  {
    id: 'opens_50',
    family: 'time',
    tier: 'silver',
    glyph: 'star',
    titleKey: 'badges.items.opens_50.title',
    descriptionKey: 'badges.items.opens_50.description',
    metric: 'appOpens',
    target: 50,
  },
  ...PLAN_BADGES,
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
