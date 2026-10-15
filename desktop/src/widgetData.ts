/**
 * The numbers behind the desktop widgets, worked out the way the phone's widgets work them out
 * (ios/UNTILWidgets/UNTILWidgets.swift) so the two always agree. Plain functions, no UI.
 */

export const DAY_DOTS = 24;
export const YEAR_DOTS = 365;
export const LIFE_COLS = 12;
export const MAX_LIFE_DOTS = 120;

/** "Thu 15 Oct" */
export function dateOverline(now: Date, locale?: string): string {
  return now.toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' });
}

/** "October 2026" */
export function monthOverline(now: Date, locale?: string): string {
  return now.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
}

/**
 * The first day of the week for a locale, 0 = Sunday ... 6 = Saturday. Uses what the browser
 * knows and falls back to Sunday, the US habit.
 */
export function firstWeekday(locale?: string): number {
  try {
    const info = (
      new Intl.Locale(locale ?? navigator.language) as unknown as {
        weekInfo?: { firstDay: number };
        getWeekInfo?: () => { firstDay: number };
      }
    );
    const first = info.getWeekInfo?.().firstDay ?? info.weekInfo?.firstDay;
    if (typeof first === 'number') return first % 7;
  } catch {
    // Older engines have no week info.
  }
  return 0;
}

/** Empty cells before the 1st so the month lines up under the week's first day. */
export function monthLeadingBlanks(now: Date, weekStart = 0): number {
  const weekday = new Date(now.getFullYear(), now.getMonth(), 1).getDay();
  return (weekday - weekStart + 7) % 7;
}

export type DotState = 'passed' | 'current' | 'left';

/** The 24 hour dots around the day ring. */
export function dayDots(progress: number): { states: DotState[]; passed: number } {
  const share = Math.min(1, Math.max(0, progress));
  const passed = Math.min(DAY_DOTS, Math.floor(share * DAY_DOTS));
  const current = share < 1 && passed < DAY_DOTS ? passed : -1;
  return {
    passed,
    states: Array.from({ length: DAY_DOTS }, (_, i) =>
      i < passed ? 'passed' : i === current ? 'current' : 'left',
    ),
  };
}

/**
 * The days of the month as calendar cells. `today` is 1-based and counts today, so the days
 * before it are passed and the rest match the days-left number.
 */
export function monthCells(
  daysInMonth: number,
  today: number,
  blanks: number,
): Array<DotState | 'blank'> {
  const day = Math.min(daysInMonth, Math.max(1, today));
  return [
    ...Array.from({ length: blanks }, () => 'blank' as const),
    ...Array.from({ length: daysInMonth }, (_, i): DotState => {
      const n = i + 1;
      return n < day ? 'passed' : n === day ? 'current' : 'left';
    }),
  ];
}

/** One dot per day of the year. `daysPassed` counts today. */
export function yearDots(daysPassed: number, total = YEAR_DOTS): DotState[] {
  const today = Math.min(Math.max(daysPassed, 0), total);
  const passed = Math.max(today - 1, 0);
  const current = today >= 1 ? today - 1 : -1;
  return Array.from({ length: total }, (_, i) =>
    i < passed ? 'passed' : i === current ? 'current' : 'left',
  );
}

export interface LifeDots {
  states: DotState[];
  /** Years left, one decimal: "27.9". */
  leftYears: string;
  /** Years in the plan: the life expectancy the person chose. */
  plan: number;
}

/** One dot per year of the plan, capped at 120. */
export function lifeDots(
  life: { passedDays: number; leftDays: number; totalLifeDays: number },
  deathAge: number,
): LifeDots {
  const total = Math.min(
    MAX_LIFE_DOTS,
    Math.max(1, Math.round(life.totalLifeDays / 365.25)),
  );
  const share = Math.min(1, Math.max(0, life.passedDays / Math.max(1, life.totalLifeDays)));
  const passed = Math.min(Math.floor(total * share), total);
  const current = share < 1 && passed < total ? passed : -1;
  return {
    plan: deathAge,
    leftYears: (Math.max(0, life.leftDays) / 365.25).toFixed(1),
    states: Array.from({ length: total }, (_, i) =>
      i < passed ? 'passed' : i === current ? 'current' : 'left',
    ),
  };
}

/** The biggest square cell that fits `count` cells into `cols` columns inside width x height. */
export function fitCell(
  count: number,
  cols: number,
  width: number,
  height: number,
  gap: number,
): number {
  const rows = Math.max(1, Math.ceil(count / cols));
  const byWidth = (width - gap * (cols - 1)) / cols;
  const byHeight = (height - gap * (rows - 1)) / rows;
  return Math.max(2, Math.floor(Math.min(byWidth, byHeight) * 10) / 10);
}
