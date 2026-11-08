/**
 * The person's own numbers for the paywall: what each widget would show on their home screen
 * right now. Real figures only — nothing here is invented or exaggerated.
 * Names come back in the active language; the caller passes the month name already formatted.
 */

import { t } from '../../../shared/i18n/translate';

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
  translate: typeof t = t,
): YourNumberRow[] {
  return [
    {
      id: 'day',
      label: translate('common.today'),
      percent: toPercent(progress.day),
      widget: translate('premium.compare.dayWidget'),
      premium: false,
    },
    {
      id: 'month',
      label: monthName,
      percent: toPercent(progress.month),
      widget: translate('premium.compare.monthWidget'),
      premium: true,
    },
    {
      id: 'life',
      label: translate('premium.numbers.life'),
      percent: hasBirthDate ? toPercent(progress.life) : null,
      widget: translate('premium.numbers.lifeWidget'),
      premium: true,
    },
  ];
}
