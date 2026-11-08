/**
 * Ember tip pools — short product tips, plain language.
 * Every line is a message in the `ember` namespace, translated when a pool is built.
 */

import {
  progressBand,
  timeOfDayLabel,
} from '../../../shared/theme/emotionalCopy';
import {
  t,
  type TranslateParams,
  type TranslationKey,
} from '../../../shared/i18n/translate';

export type EmberInsight = {
  eyebrow: string;
  body: string;
};

type InsightContext = {
  dayProgress: number;
  streakCount?: number;
};

/** A tip from its eyebrow and body messages. */
function tip(
  eyebrow: TranslationKey,
  body: TranslationKey,
  params?: TranslateParams,
): EmberInsight {
  return { eyebrow: t(eyebrow), body: t(body, params) };
}

function streakLines(
  eyebrow: TranslationKey,
  streakCount: number | undefined,
): EmberInsight[] {
  if (streakCount == null || streakCount < 2) return [];
  const count = streakCount;
  const bodies =
    count < 5
      ? [
          t('ember.streak.early.day', { day: count }),
          t('ember.streak.early.row', { count }),
        ]
      : count < 14
      ? [
          t('ember.streak.mid.opened', { count }),
          t('ember.streak.mid.noticed', { count }),
        ]
      : [
          t('ember.streak.long.together', { count }),
          t('ember.streak.long.long', { count }),
        ];
  const label = t(eyebrow);
  return bodies.map(body => ({ eyebrow: label, body }));
}

function dayBandLine(dayProgress: number): string {
  const band = progressBand(dayProgress);
  if (band === 'dawn' || band === 'open') return t('ember.dayBand.early');
  if (band === 'mid') return t('ember.dayBand.mid');
  return t('ember.dayBand.late');
}

const POOLS: Record<string, (ctx: InsightContext) => EmberInsight[]> = {
  DayDetail: ctx => [
    tip('ember.DayDetail.1.eyebrow', 'ember.DayDetail.1.body', {
      line: dayBandLine(ctx.dayProgress),
    }),
    tip('ember.DayDetail.2.eyebrow', 'ember.DayDetail.2.body'),
    tip('ember.eyebrow.glance', 'ember.DayDetail.3.body'),
    ...streakLines('ember.eyebrow.streak', ctx.streakCount),
  ],
  MonthDetail: ctx => [
    tip('ember.MonthDetail.1.eyebrow', 'ember.MonthDetail.1.body'),
    tip('ember.MonthDetail.2.eyebrow', 'ember.MonthDetail.2.body'),
    tip('ember.MonthDetail.3.eyebrow', 'ember.MonthDetail.3.body'),
    ...streakLines('ember.eyebrow.streak', ctx.streakCount),
  ],
  YearDetail: () => [
    tip('ember.YearDetail.1.eyebrow', 'ember.YearDetail.1.body'),
    tip('ember.YearDetail.2.eyebrow', 'ember.YearDetail.2.body'),
    tip('ember.YearDetail.3.eyebrow', 'ember.YearDetail.3.body'),
  ],
  Life: () => [
    tip('ember.Life.1.eyebrow', 'ember.Life.1.body'),
    tip('ember.eyebrow.noRush', 'ember.Life.2.body'),
    tip('ember.Life.3.eyebrow', 'ember.Life.3.body'),
  ],
  DailyTasks: ctx => [
    tip('ember.DailyTasks.1.eyebrow', 'ember.DailyTasks.1.body'),
    tip('ember.DailyTasks.2.eyebrow', 'ember.DailyTasks.2.body'),
    tip('ember.DailyTasks.3.eyebrow', 'ember.DailyTasks.3.body'),
    ...streakLines('ember.eyebrow.here', ctx.streakCount),
  ],
  DailyTasksAdd: () => [
    tip('ember.DailyTasksAdd.1.eyebrow', 'ember.DailyTasksAdd.1.body'),
    tip('ember.DailyTasksAdd.2.eyebrow', 'ember.DailyTasksAdd.2.body'),
    tip('ember.DailyTasksAdd.3.eyebrow', 'ember.DailyTasksAdd.3.body'),
  ],
  TaskReport: () => [
    tip('ember.TaskReport.1.eyebrow', 'ember.TaskReport.1.body'),
    tip('ember.TaskReport.2.eyebrow', 'ember.TaskReport.2.body'),
    tip('ember.TaskReport.3.eyebrow', 'ember.TaskReport.3.body'),
    tip('ember.TaskReport.4.eyebrow', 'ember.TaskReport.4.body'),
  ],
  MonthlyGoals: () => [
    tip('ember.MonthlyGoals.1.eyebrow', 'ember.MonthlyGoals.1.body'),
    tip('ember.MonthlyGoals.2.eyebrow', 'ember.MonthlyGoals.2.body'),
    tip('ember.MonthlyGoals.3.eyebrow', 'ember.MonthlyGoals.3.body'),
  ],
  GoalDetail: () => [
    tip('ember.GoalDetail.1.eyebrow', 'ember.GoalDetail.1.body'),
    tip('ember.GoalDetail.2.eyebrow', 'ember.GoalDetail.2.body'),
  ],
  TasksComingSoon: () => [
    { eyebrow: timeOfDayLabel(), body: t('ember.TasksComingSoon.1.body') },
    tip('ember.TasksComingSoon.2.eyebrow', 'ember.TasksComingSoon.2.body'),
  ],
  Widget: () => [
    tip('ember.Widget.1.eyebrow', 'ember.Widget.1.body'),
    tip('ember.Widget.2.eyebrow', 'ember.Widget.2.body'),
    tip('ember.Widget.3.eyebrow', 'ember.Widget.3.body'),
  ],
  WidgetCustomization: () => [
    tip(
      'ember.WidgetCustomization.1.eyebrow',
      'ember.WidgetCustomization.1.body',
    ),
    tip(
      'ember.WidgetCustomization.2.eyebrow',
      'ember.WidgetCustomization.2.body',
    ),
  ],
  Settings: ctx => [
    tip('ember.Settings.1.eyebrow', 'ember.Settings.1.body'),
    tip('ember.Settings.2.eyebrow', 'ember.Settings.2.body'),
    tip('ember.Settings.3.eyebrow', 'ember.Settings.3.body'),
    ...streakLines('ember.eyebrow.stillHere', ctx.streakCount),
  ],
  ShareSnapshot: () => [
    tip('ember.ShareSnapshot.1.eyebrow', 'ember.ShareSnapshot.1.body'),
    tip('ember.ShareSnapshot.2.eyebrow', 'ember.ShareSnapshot.2.body'),
  ],
  Countdowns: () => [
    tip('ember.Countdowns.1.eyebrow', 'ember.Countdowns.1.body'),
    tip('ember.Countdowns.2.eyebrow', 'ember.Countdowns.2.body'),
  ],
  CustomCounters: () => [
    tip('ember.CustomCounters.1.eyebrow', 'ember.CustomCounters.1.body'),
    tip('ember.CustomCounters.2.eyebrow', 'ember.CustomCounters.2.body'),
  ],
  Premium: () => [
    tip('ember.eyebrow.noRush', 'ember.Premium.1.body'),
    tip('ember.Premium.2.eyebrow', 'ember.Premium.2.body'),
    tip('ember.Premium.3.eyebrow', 'ember.Premium.3.body'),
  ],
  HourCalculation: () => [
    tip('ember.HourCalculation.1.eyebrow', 'ember.HourCalculation.1.body'),
    tip('ember.HourCalculation.2.eyebrow', 'ember.HourCalculation.2.body'),
  ],
  Overlay: () => [
    tip('ember.Overlay.1.eyebrow', 'ember.Overlay.1.body'),
    tip('ember.Overlay.2.eyebrow', 'ember.Overlay.2.body'),
  ],
  DynamicIsland: () => [
    tip('ember.DynamicIsland.1.eyebrow', 'ember.DynamicIsland.1.body'),
    tip('ember.eyebrow.glance', 'ember.DynamicIsland.2.body'),
  ],
};

const DEFAULT_POOL: (ctx: InsightContext) => EmberInsight[] = ctx => [
  tip('ember.eyebrow.ember', 'ember.Default.1.body'),
  { eyebrow: t('ember.eyebrow.stillHere'), body: dayBandLine(ctx.dayProgress) },
  ...streakLines('ember.eyebrow.together', ctx.streakCount),
];

/** What Ember says when a route has no tip of its own to show yet. */
export function emberFallbackTip(): EmberInsight {
  return tip('ember.eyebrow.ember', 'ember.fallback.body');
}

/** The small line under a tip that tells you tapping Ember again gives another one. */
export function emberTapHint(): string {
  return t('ember.tapHint');
}

/** The bubble for "hold Ember to hear the time left". */
export function emberTimeLeftTip(timeLeft: string): EmberInsight {
  return { eyebrow: t('ember.eyebrow.rightNow'), body: timeLeft };
}

/** Whether Ember should dock on this route (null/Home = no). */
export function emberSupportsRoute(routeName: string | undefined): boolean {
  if (!routeName || routeName === 'Home') return false;
  return true;
}

export function emberTipPoolForRoute(
  routeName: string | undefined,
  ctx: InsightContext,
): EmberInsight[] | null {
  if (!emberSupportsRoute(routeName) || !routeName) return null;
  const factory = POOLS[routeName] ?? DEFAULT_POOL;
  const pool = factory(ctx).filter(item => item.body.trim().length > 0);
  return pool.length ? pool : null;
}

export function pickEmberTip(
  routeName: string | undefined,
  ctx: InsightContext,
  tipIndex: number,
): EmberInsight | null {
  const pool = emberTipPoolForRoute(routeName, ctx);
  if (!pool) return null;
  const i = ((tipIndex % pool.length) + pool.length) % pool.length;
  return pool[i] ?? pool[0];
}

/** @deprecated use pickEmberTip */
export function emberInsightForRoute(
  routeName: string | undefined,
  ctx: InsightContext,
): EmberInsight | null {
  return pickEmberTip(routeName, ctx, 0);
}
