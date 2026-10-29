/**
 * The person's own numbers for the paywall: what each widget would show on their home screen
 * right now. Real figures only — nothing here is invented or exaggerated.
 */

export interface YourNumberRow {
  id: 'day' | 'month' | 'life';
  label: string;
  /** Whole percent, or null when it cannot be known (no birth date yet). */
  percent: number | null;
  /** What the widget is called, for the "locked" line. */
  widget: string;
  premium: boolean;
}

interface Progress {
  day: number;
  month: number;
  life: number;
}

function toPercent(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  return Math.min(100, Math.max(0, Math.round(value * 100)));
}

export function buildYourNumbers(
  progress: Progress,
  hasBirthDate: boolean,
  monthName: string,
): YourNumberRow[] {
  return [
    { id: 'day', label: 'Today', percent: toPercent(progress.day), widget: 'Day widget', premium: false },
    {
      id: 'month',
      label: monthName,
      percent: toPercent(progress.month),
      widget: 'Month widget',
      premium: true,
    },
    {
      id: 'life',
      label: 'Your life',
      percent: hasBirthDate ? toPercent(progress.life) : null,
      widget: 'Life widget',
      premium: true,
    },
  ];
}
