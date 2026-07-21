/**
 * Ember tip pools — short product tips, plain language.
 */

import { progressBand, timeOfDayLabel } from './emotionalCopy';

export type EmberInsight = {
  eyebrow: string;
  body: string;
};

type InsightContext = {
  dayProgress: number;
  streakCount?: number;
};

function streakLines(streakCount: number | undefined): string[] {
  if (streakCount == null || streakCount < 2) return [];
  if (streakCount < 5) {
    return [
      `Day ${streakCount}. Nice to see you open the app.`,
      `${streakCount} days in a row. Keep going at your pace.`,
    ];
  }
  if (streakCount < 14) {
    return [
      `${streakCount} days opened. That adds up.`,
      `${streakCount} days noticed. Thanks for checking in.`,
    ];
  }
  return [
    `${streakCount} days together. Still here.`,
    `Long streak: ${streakCount} days. Wear it lightly.`,
  ];
}

function dayBandLines(dayProgress: number): string[] {
  const band = progressBand(dayProgress);
  switch (band) {
    case 'dawn':
    case 'open':
      return ['Most of today is still ahead.', 'Morning stretch. Plenty of day left.'];
    case 'mid':
      return ['Midday check. Keep priorities close.', 'About halfway through today.'];
    default:
      return ['Evening. Go easy on what’s left.', 'Day’s almost done. Rest is fine.'];
  }
}

const POOLS: Record<string, (ctx: InsightContext) => EmberInsight[]> = {
  DayDetail: ctx => [
    { eyebrow: 'Today', body: `${dayBandLines(ctx.dayProgress)[0]} Watch what’s left.` },
    { eyebrow: 'Live clock', body: 'Seconds tick here so you can see remaining time.' },
    { eyebrow: 'Glance', body: 'Clear view of what’s left of today.' },
    ...streakLines(ctx.streakCount).map(body => ({ eyebrow: 'Streak', body })),
  ],
  MonthDetail: ctx => [
    { eyebrow: 'This month', body: 'Empty days ahead are still open.' },
    { eyebrow: 'Calendar', body: 'Days add up. Notice the open ones.' },
    { eyebrow: 'Checkpoint', body: 'Middle of the month. Quick status check.' },
    ...streakLines(ctx.streakCount).map(body => ({ eyebrow: 'Streak', body })),
  ],
  YearDetail: () => [
    { eyebrow: 'This year', body: 'One solid day still moves the year forward.' },
    { eyebrow: 'Year view', body: 'Seasons move slowly. You’re allowed to too.' },
    { eyebrow: 'Long view', body: '365 days. Today is one of them.' },
  ],
  Life: () => [
    { eyebrow: 'Your life', body: 'Big picture. Unlock Life when you’re ready.' },
    { eyebrow: 'No rush', body: 'Life view waits. Ember stays either way.' },
    { eyebrow: 'Perspective', body: 'Long road. Walk the stretch in front of you.' },
  ],
  DailyTasks: ctx => [
    { eyebrow: 'Today’s list', body: 'Do what you can. Leave the rest.' },
    { eyebrow: 'Small steps', body: 'One checkmark is enough to start.' },
    { eyebrow: 'List', body: 'Tasks help you remember. They don’t own you.' },
    ...streakLines(ctx.streakCount).map(body => ({ eyebrow: 'Here', body })),
  ],
  DailyTasksAdd: () => [
    { eyebrow: 'Add a task', body: 'Name one small thing. That’s enough.' },
    { eyebrow: 'Title', body: 'A short title beats a perfect plan you’ll skip.' },
    { eyebrow: 'Categories', body: 'Pick a category if it helps, or leave Other.' },
  ],
  TaskReport: () => [
    { eyebrow: 'Patterns', body: 'Shows where time went. Not a grade.' },
    { eyebrow: 'Look back', body: 'Curious look back. What did your days hold?' },
    { eyebrow: 'Trends', body: 'Glance once, then return to today.' },
    { eyebrow: 'Swipe home', body: 'Swipe right anytime to return home.' },
  ],
  MonthlyGoals: () => [
    { eyebrow: 'Goals', body: 'Aim steady. Slow progress still counts.' },
    { eyebrow: 'Intent', body: 'Directions help. Deadlines don’t have to sting.' },
    { eyebrow: 'Steady', body: 'A quiet aim beats a loud abandoned one.' },
  ],
  GoalDetail: () => [
    { eyebrow: 'This goal', body: 'Zoom in. Progress that sticks is enough.' },
    { eyebrow: 'Focus', body: 'One thread at a time is enough.' },
  ],
  TasksComingSoon: () => [
    { eyebrow: timeOfDayLabel(), body: 'Tasks come later. Noticing time is enough for now.' },
    { eyebrow: 'Soon', body: 'More tools coming. For now, stay with what’s left of today.' },
  ],
  Widget: () => [
    { eyebrow: 'Widgets', body: 'Put day % where your eyes already go.' },
    { eyebrow: 'Home screen', body: 'A glance without opening the app.' },
    { eyebrow: 'Reminder', body: 'The widget can nudge. You don’t have to check every time.' },
  ],
  WidgetCustomization: () => [
    { eyebrow: 'Design', body: 'Tune the look until it feels like yours.' },
    { eyebrow: 'Make it fit', body: 'Widgets should stay quiet, not shout.' },
  ],
  Settings: ctx => [
    { eyebrow: 'Make it yours', body: 'Birth date and reminders shape how UNTIL talks to you.' },
    { eyebrow: 'Tools', body: 'Theme, lifespan, alerts. Set and forget.' },
    { eyebrow: 'Tune', body: 'Small settings, big feel. Change what nags.' },
    ...streakLines(ctx.streakCount).map(body => ({ eyebrow: 'Still here', body })),
  ],
  ShareSnapshot: () => [
    { eyebrow: 'Share', body: 'Share only if you want. A moment of time.' },
    { eyebrow: 'Snapshot', body: 'A picture of remaining time. Send when it helps.' },
  ],
  Countdowns: () => [
    { eyebrow: 'Dates that matter', body: 'Mark them. Live toward them, one day at a time.' },
    { eyebrow: 'Coming up', body: 'Countdowns hold the date without rushing you.' },
  ],
  CustomCounters: () => [
    { eyebrow: 'Counters', body: 'Count what you care about. Not points.' },
    { eyebrow: 'Your count', body: 'What you track becomes what you notice.' },
  ],
  Premium: () => [
    { eyebrow: 'No rush', body: 'Premium unlocks when you’re ready. Ember stays.' },
    { eyebrow: 'Premium', body: 'A door, not a demand.' },
    { eyebrow: 'Either way', body: 'Ember doesn’t leave if you wait.' },
  ],
  HourCalculation: () => [
    { eyebrow: 'Hours', body: 'Numbers help you see where hours went.' },
    { eyebrow: 'Timer', body: 'Count if it clarifies. Stop if it weighs.' },
  ],
  Overlay: () => [
    { eyebrow: 'Always near', body: 'A glance at the edge. Then return.' },
    { eyebrow: 'Overlay', body: 'Time beside your day, not on top of it.' },
  ],
  DynamicIsland: () => [
    { eyebrow: 'Island', body: 'A small pulse of remaining time.' },
    { eyebrow: 'Glance', body: 'Look once. Live the rest.' },
  ],
};

const DEFAULT_POOL: (ctx: InsightContext) => EmberInsight[] = ctx => [
  { eyebrow: 'Ember', body: 'A quiet glance at what’s left.' },
  { eyebrow: 'Still here', body: dayBandLines(ctx.dayProgress)[0] },
  ...streakLines(ctx.streakCount).map(body => ({ eyebrow: 'Together', body })),
];

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
  const pool = factory(ctx).filter(t => t.body.trim().length > 0);
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
