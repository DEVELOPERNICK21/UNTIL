/**
 * What the panel and the notch island show for each stretch of time, worked out from the shared
 * panel model. Plain numbers in, plain strings out, so it is easy to test and has no UI in it.
 */

export type PeriodKey = 'day' | 'month' | 'year' | 'life';

export const PERIOD_KEYS: readonly PeriodKey[] = ['day', 'month', 'year', 'life'];

/** The fields of the shared panel model this file reads. */
export interface PanelModelLike {
  day: { passedStr: string; leftStr: string; passedPct: number; leftPct: number; progress: number };
  month: { passedDays: number; leftDays: number; passedPct: number; leftPct: number };
  year: { passedDays: number; leftDays: number; passedPct: number; leftPct: number };
  life: {
    passedDays: number;
    leftDays: number;
    passedPct: number;
    leftPct: number;
    totalLifeDays: number;
  } | null;
}

/** A big number split so the unit can be set smaller: `9` `h`, `16` `days`. */
export interface Part {
  value: string;
  unit: string;
}

export interface PeriodSide {
  parts: Part[];
  caption: string;
}

export interface PeriodView {
  key: PeriodKey;
  label: string;
  /** Share of the period that has passed, 0..1. Null when there is nothing to show yet. */
  progress: number | null;
  /** Time left, the default face of the dial. */
  left: PeriodSide;
  /** Time passed, the other face. Click the dial to flip. */
  passed: PeriodSide;
  /** A few characters for the small chip: `9h 32m`, `16d`. */
  chip: string;
  passedPct: number | null;
  leftPct: number | null;
  /** Marks around the dial: hours in a day, days in a month, months in a year, decades in a life. */
  ticks: { count: number; passed: number } | null;
  locked: boolean;
}

const DAYS_PER_DECADE = 3652.5;

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

/** `9h 32m 53s` becomes its parts. Anything that does not match is shown as it is. */
export function dayParts(text: string): Part[] {
  const parts: Part[] = [];
  for (const match of text.matchAll(/(\d+)([hms])/g)) {
    parts.push({ value: match[1], unit: match[2] });
  }
  return parts.length ? parts : [{ value: text, unit: '' }];
}

/** `9h 32m 53s` becomes `9h 32m`. Under an hour it keeps the minutes: `32m`. */
export function dayChip(text: string): string {
  const parts = dayParts(text).filter(p => p.unit !== 's');
  const trimmed = parts[0]?.value === '0' && parts.length > 1 ? parts.slice(1) : parts;
  return trimmed.map(p => `${p.value}${p.unit}`).join(' ');
}

function days(count: number): Part[] {
  return [{ value: count.toLocaleString('en-US'), unit: count === 1 ? 'day' : 'days' }];
}

const LOCKED_PARTS: Part[] = [{ value: 'Sign in', unit: '' }];

export function buildPeriods(
  model: PanelModelLike,
  options: { signedIn: boolean },
): Record<PeriodKey, PeriodView> {
  const { day, month, year, life } = model;

  const lifeNote = options.signedIn ? 'Needs your birth date' : 'To see your life';

  return {
    day: {
      key: 'day',
      label: 'Day',
      progress: clamp01(day.progress),
      left: { parts: dayParts(day.leftStr), caption: 'left today' },
      passed: { parts: dayParts(day.passedStr), caption: 'passed today' },
      chip: dayChip(day.leftStr),
      passedPct: day.passedPct,
      leftPct: day.leftPct,
      ticks: { count: 24, passed: Math.floor(clamp01(day.progress) * 24) },
      locked: false,
    },
    month: {
      key: 'month',
      label: 'Month',
      progress: clamp01(month.passedPct / 100),
      left: { parts: days(month.leftDays), caption: 'left this month' },
      passed: { parts: days(month.passedDays), caption: 'passed this month' },
      chip: `${month.leftDays}d`,
      passedPct: month.passedPct,
      leftPct: month.leftPct,
      ticks: { count: month.passedDays + month.leftDays, passed: month.passedDays },
      locked: false,
    },
    year: {
      key: 'year',
      label: 'Year',
      progress: clamp01(year.passedPct / 100),
      left: { parts: days(year.leftDays), caption: 'left this year' },
      passed: { parts: days(year.passedDays), caption: 'passed this year' },
      chip: `${year.leftDays}d`,
      passedPct: year.passedPct,
      leftPct: year.leftPct,
      ticks: { count: 12, passed: Math.min(12, Math.floor(clamp01(year.passedPct / 100) * 12)) },
      locked: false,
    },
    life: life
      ? {
          key: 'life',
          label: 'Life',
          progress: clamp01(life.passedPct / 100),
          left: { parts: days(life.leftDays), caption: 'left in your life' },
          passed: { parts: days(life.passedDays), caption: 'lived so far' },
          chip: `${life.leftDays.toLocaleString('en-US')}d`,
          passedPct: life.passedPct,
          leftPct: life.leftPct,
          ticks: {
            count: Math.max(1, Math.round(life.totalLifeDays / DAYS_PER_DECADE)),
            passed: Math.floor(life.passedDays / DAYS_PER_DECADE),
          },
          locked: false,
        }
      : {
          key: 'life',
          label: 'Life',
          progress: null,
          left: { parts: LOCKED_PARTS, caption: lifeNote },
          passed: { parts: LOCKED_PARTS, caption: lifeNote },
          chip: 'Locked',
          passedPct: null,
          leftPct: null,
          ticks: null,
          locked: true,
        },
  };
}
