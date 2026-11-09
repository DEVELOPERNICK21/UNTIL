/**
 * Badges for the Premium plan a person bought: one per plan, earned the moment the plan is
 * active and never taken back, so a lapsed subscriber keeps what they earned.
 */

import type { PlanKind } from '../../../shared/types/purchases';
import type { BadgeDefinition } from './badgeCatalog';

export interface PlanBadgeSnapshot {
  /** 1 once that plan has been active on this account, else 0. */
  planWeekly: number;
  planMonthly: number;
  planYearly: number;
  planStudent: number;
  planLifetime: number;
}

export const EMPTY_PLAN_BADGE_SNAPSHOT: PlanBadgeSnapshot = {
  planWeekly: 0,
  planMonthly: 0,
  planYearly: 0,
  planStudent: 0,
  planLifetime: 0,
};

export function planBadgeSnapshot(bought: readonly PlanKind[]): PlanBadgeSnapshot {
  const has = (kind: PlanKind) => (bought.includes(kind) ? 1 : 0);
  return {
    planWeekly: has('weekly'),
    planMonthly: has('monthly'),
    planYearly: has('yearly'),
    planStudent: has('student'),
    planLifetime: has('lifetime'),
  };
}

export const PLAN_BADGES: readonly BadgeDefinition[] = [
  {
    id: 'plan_weekly',
    family: 'premium',
    tier: 'bronze',
    glyph: 'spark',
    titleKey: 'badges.items.plan_weekly.title',
    descriptionKey: 'badges.items.plan_weekly.description',
    metric: 'planWeekly',
    target: 1,
  },
  {
    id: 'plan_monthly',
    family: 'premium',
    tier: 'silver',
    glyph: 'sun',
    titleKey: 'badges.items.plan_monthly.title',
    descriptionKey: 'badges.items.plan_monthly.description',
    metric: 'planMonthly',
    target: 1,
  },
  {
    id: 'plan_yearly',
    family: 'premium',
    tier: 'gold',
    glyph: 'star',
    titleKey: 'badges.items.plan_yearly.title',
    descriptionKey: 'badges.items.plan_yearly.description',
    metric: 'planYearly',
    target: 1,
  },
  {
    id: 'plan_student',
    family: 'premium',
    tier: 'silver',
    glyph: 'flag',
    titleKey: 'badges.items.plan_student.title',
    descriptionKey: 'badges.items.plan_student.description',
    metric: 'planStudent',
    target: 1,
  },
  {
    id: 'plan_lifetime',
    family: 'premium',
    tier: 'ember',
    glyph: 'flame',
    titleKey: 'badges.items.plan_lifetime.title',
    descriptionKey: 'badges.items.plan_lifetime.description',
    metric: 'planLifetime',
    target: 1,
  },
];
