/**
 * Emotional microcopy for UNTIL — plain, warm, not guilt-heavy.
 * Presentation-only; surfaces consume via theme/ui.
 */

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
  if (h < 5) return 'Still night';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  if (h < 21) return 'Good evening';
  return 'Winding down';
}

const DAY_FEEL: Record<ProgressBand, string> = {
  dawn: 'Early day. Plenty ahead.',
  open: 'Open stretch of today.',
  mid: 'Halfway. Keep priorities close.',
  late: 'Evening. Make the last hours count.',
  dusk: 'Almost night. Rest is part of the day.',
};

const MONTH_FEEL: Record<ProgressBand, string> = {
  dawn: 'Fresh page of the month.',
  open: 'The month still has room.',
  mid: 'Middle of the month. Quick checkpoint.',
  late: 'Days thin out. Choose carefully.',
  dusk: 'Month nearly spent. Honor what you lived.',
};

const YEAR_FEEL: Record<ProgressBand, string> = {
  dawn: 'New year just starting.',
  open: 'The year is still young.',
  mid: 'Midyear. Look both ways.',
  late: 'Late year. Hold the good days.',
  dusk: 'Year almost done. Be kind to yourself.',
};

const LIFE_FEEL: Record<ProgressBand, string> = {
  dawn: 'So much life still ahead.',
  open: 'Long road. You’re not alone.',
  mid: 'The middle is where meaning settles.',
  late: 'Value in what remains.',
  dusk: 'Every day left counts. Hold it carefully.',
};

export function feelForPeriod(
  kind: 'day' | 'month' | 'year' | 'life',
  progress: number,
): string {
  const band = progressBand(progress);
  switch (kind) {
    case 'day':
      return DAY_FEEL[band];
    case 'month':
      return MONTH_FEEL[band];
    case 'year':
      return YEAR_FEEL[band];
    case 'life':
      return LIFE_FEEL[band];
  }
}

export function homeHeroSupport(date: Date = new Date()): string {
  const h = date.getHours();
  if (h < 5) return 'Quiet hours. Time is still yours.';
  if (h < 12) return 'Start where you are. The day opens.';
  if (h < 17) return 'Notice what’s left, not only what’s gone.';
  if (h < 21) return 'Evening. Ease your pace.';
  return 'Day’s almost done. You did enough for today.';
}

/** Short line for Wear glance (keep tiny). */
export function wearDayWhisper(progress: number): string {
  const band = progressBand(progress);
  switch (band) {
    case 'dawn':
      return 'Fresh day';
    case 'open':
      return 'Still ahead';
    case 'mid':
      return 'Hold steady';
    case 'late':
      return 'Closing soon';
    case 'dusk':
      return 'Almost rest';
  }
}
