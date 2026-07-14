/**
 * Ember tip pools — varied whispers so returning visits stay fresh.
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
      `Day ${streakCount} together — I’m glad you opened this.`,
      `${streakCount} quiet days. Soft pride, no pressure.`,
    ];
  }
  if (streakCount < 14) {
    return [
      `${streakCount} days of presence. That gently adds up.`,
      `We’ve noticed ${streakCount} days — thank you for showing up.`,
    ];
  }
  return [
    `${streakCount} days noticed together. I’m still here.`,
    `A long streak of soft presence — wear it lightly.`,
  ];
}

function dayBandLines(dayProgress: number): string[] {
  const band = progressBand(dayProgress);
  switch (band) {
    case 'dawn':
    case 'open':
      return ['Plenty of day still open.', 'Morning light still stretches ahead.'];
    case 'mid':
      return ['Midday checkpoint — keep what matters close.', 'Halfway light. Breathe once.'];
    default:
      return ['Evening softens. Go gently.', 'The day is folding — you did enough.'];
  }
}

const POOLS: Record<string, (ctx: InsightContext) => EmberInsight[]> = {
  DayDetail: ctx => [
    { eyebrow: 'Today', body: dayBandLines(ctx.dayProgress)[0] + ' Watch what’s left.' },
    { eyebrow: 'Live pulse', body: 'Seconds moving — a soft reminder you’re here now.' },
    { eyebrow: 'Glance', body: 'Not a race. Just a clear look at remaining light.' },
    ...streakLines(ctx.streakCount).map(body => ({ eyebrow: 'With you', body })),
  ],
  MonthDetail: ctx => [
    { eyebrow: 'This month', body: 'Blank days ahead are still yours to shape.' },
    { eyebrow: 'Calendar', body: 'Days stack quietly — notice the empty ones kindly.' },
    { eyebrow: 'Checkpoint', body: 'A soft middle-of-month breath, nothing more.' },
    ...streakLines(ctx.streakCount).map(body => ({ eyebrow: 'Presence', body })),
  ],
  YearDetail: () => [
    { eyebrow: 'This year', body: 'One honest day still moves the whole orbit.' },
    { eyebrow: 'Orbit', body: 'Seasons turn slowly — you’re allowed to go slow too.' },
    { eyebrow: 'Long view', body: '365 chances. Today is one of them.' },
  ],
  Life: () => [
    { eyebrow: 'Your life', body: 'Big picture, soft light — unlock when you’re ready.' },
    { eyebrow: 'No rush', body: 'Life view waits. Ember stays either way.' },
    { eyebrow: 'Perspective', body: 'One long road. Walk the stretch in front of you.' },
  ],
  DailyTasks: ctx => [
    { eyebrow: 'Today’s list', body: 'Do what you can. The rest can wait kindly.' },
    { eyebrow: 'Small steps', body: 'One checkmark is presence — not a report card.' },
    { eyebrow: 'Soft plan', body: 'Lists help you remember. They don’t own you.' },
    ...streakLines(ctx.streakCount).map(body => ({ eyebrow: 'Here', body })),
  ],
  DailyTasksAdd: () => [
    { eyebrow: 'Add a task', body: 'Name one small thing. That’s enough to begin.' },
    { eyebrow: 'Gently', body: 'A short title beats a perfect plan you’ll abandon.' },
    { eyebrow: 'Categories', body: 'Pick a lane if it helps — or leave it Other.' },
  ],
  TaskReport: () => [
    { eyebrow: 'Patterns', body: 'Not a scorecard — a mirror of where time went.' },
    { eyebrow: 'Look back', body: 'Curious, not critical. What did your days hold?' },
    { eyebrow: 'Insight', body: 'Trends whisper. Listen once, then return to today.' },
    { eyebrow: 'Swipe home', body: 'Swipe right anytime to return to time reality.' },
  ],
  MonthlyGoals: () => [
    { eyebrow: 'Goals', body: 'Aim gently. Slow progress still counts as care.' },
    { eyebrow: 'Intent', body: 'Directions help — deadlines don’t have to hurt.' },
    { eyebrow: 'Steady', body: 'A quiet aim beats a loud abandoned one.' },
  ],
  GoalDetail: () => [
    { eyebrow: 'This goal', body: 'Zoom in kindly. Progress that holds is soft.' },
    { eyebrow: 'Focus', body: 'One thread at a time is enough.' },
  ],
  TasksComingSoon: () => [
    { eyebrow: timeOfDayLabel(), body: 'Tasks land later. Noticing time is enough for now.' },
    { eyebrow: 'Soon', body: 'Something’s coming — until then, stay with what’s left of today.' },
  ],
  Widget: () => [
    { eyebrow: 'Widgets', body: 'Put a soft day% where your eyes already go.' },
    { eyebrow: 'Home screen', body: 'A glance without opening — presence made light.' },
    { eyebrow: 'Reminder', body: 'Let the widget whisper; you don’t have to listen every time.' },
  ],
  WidgetCustomization: () => [
    { eyebrow: 'Design', body: 'Tune the look until it feels like yours.' },
    { eyebrow: 'Make it fit', body: 'Widgets should calm you, not shout.' },
  ],
  Settings: ctx => [
    { eyebrow: 'Make it yours', body: 'Birth date & reminders shape how UNTIL speaks to you.' },
    { eyebrow: 'Quiet tools', body: 'Theme, lifespan, soft alerts — set and forget.' },
    { eyebrow: 'Tune', body: 'Small settings, big feel. Adjust when something nags.' },
    ...streakLines(ctx.streakCount).map(body => ({ eyebrow: 'Still here', body })),
  ],
  ShareSnapshot: () => [
    { eyebrow: 'Share', body: 'Only if it feels kind — a moment of time, offered gently.' },
    { eyebrow: 'Snapshot', body: 'A picture of remaining — share when it warms someone.' },
  ],
  Countdowns: () => [
    { eyebrow: 'Dates that matter', body: 'Mark them. Then live toward them, one day at a time.' },
    { eyebrow: 'Coming up', body: 'Countdowns hold hope without rushing the wait.' },
  ],
  CustomCounters: () => [
    { eyebrow: 'Counters', body: 'Count presence — not points.' },
    { eyebrow: 'Your count', body: 'What you track becomes what you notice.' },
  ],
  Premium: () => [
    { eyebrow: 'No rush', body: 'Life unlocks when you’re ready. I’m staying either way.' },
    { eyebrow: 'Gently', body: 'Premium is a door, not a demand.' },
    { eyebrow: 'Either way', body: 'Ember doesn’t leave if you wait.' },
  ],
  HourCalculation: () => [
    { eyebrow: 'Hours', body: 'Numbers help you see. Feeling them is the gift.' },
    { eyebrow: 'Math of time', body: 'Count if it clarifies — stop if it weighs.' },
  ],
  Overlay: () => [
    { eyebrow: 'Always near', body: 'A glance at the edge — breathe, then return.' },
    { eyebrow: 'Overlay', body: 'Time beside your day, never on top of it.' },
  ],
  DynamicIsland: () => [
    { eyebrow: 'Island', body: 'A tiny pulse of remaining time — soft, not sticky.' },
    { eyebrow: 'Glance', body: 'Look once. Live the rest.' },
  ],
};

const DEFAULT_POOL: (ctx: InsightContext) => EmberInsight[] = ctx => [
  { eyebrow: 'Ember', body: 'I’m with you — a quiet glance at what’s left.' },
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

/** @deprecated use pickEmberTip — kept for any old imports */
export function emberInsightForRoute(
  routeName: string | undefined,
  ctx: InsightContext,
): EmberInsight | null {
  return pickEmberTip(routeName, ctx, 0);
}
