/**
 * Emotional microcopy for UNTIL — plain, warm, not guilt-heavy.
 * Presentation-only; surfaces consume via theme/ui.
 */

import { t } from '../i18n/translate';

export type ProgressBand = 'dawn' | 'open' | 'mid' | 'late' | 'dusk';

export function progressBand(progress: number): ProgressBand {
  const p = Math.min(1, Math.max(0, progress));
  if (p < 0.15) return 'dawn';
  if (p < 0.4) return 'open';
  if (p < 0.65) return 'mid';
  if (p < 0.85) return 'late';
  return 'dusk';
}

export function timeOfDayLabel(date: Date = new Date()): string {
  const h = date.getHours();
  if (h < 5) return t('common.timeOfDay.night');
  if (h < 12) return t('common.timeOfDay.morning');
  if (h < 17) return t('common.timeOfDay.afternoon');
  if (h < 21) return t('common.timeOfDay.evening');
  return t('common.timeOfDay.windDown');
}

export function feelForPeriod(
  kind: 'day' | 'month' | 'year' | 'life',
  progress: number,
): string {
  return t(`common.feel.${kind}.${progressBand(progress)}`);
}

export function homeHeroSupport(date: Date = new Date()): string {
  const h = date.getHours();
  if (h < 5) return t('common.heroSupport.night');
  if (h < 12) return t('common.heroSupport.morning');
  if (h < 17) return t('common.heroSupport.afternoon');
  if (h < 21) return t('common.heroSupport.evening');
  return t('common.heroSupport.late');
}

/** Short line for Wear glance (keep tiny). */
export function wearDayWhisper(progress: number): string {
  const band = progressBand(progress);
  switch (band) {
    case 'dawn':
      return t('notifications.whisper.dawn');
    case 'open':
      return t('notifications.whisper.open');
    case 'mid':
      return t('notifications.whisper.mid');
    case 'late':
      return t('notifications.whisper.late');
    case 'dusk':
      return t('notifications.whisper.dusk');
  }
}
