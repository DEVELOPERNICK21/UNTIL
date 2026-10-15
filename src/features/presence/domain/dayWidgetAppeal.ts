/**
 * Day widget appeal SSOT — mood, copy, palette, streak dots.
 * Core layer: band thresholds mirror `src/theme/emotionalCopy.ts` (not imported).
 */

type ProgressBand = 'dawn' | 'open' | 'mid' | 'late' | 'dusk';

function progressBand(progress: number): ProgressBand {
  const p = Math.min(1, Math.max(0, progress));
  if (p < 0.15) return 'dawn';
  if (p < 0.4) return 'open';
  if (p < 0.65) return 'mid';
  if (p < 0.85) return 'late';
  return 'dusk';
}

export type DayAppealMood = 'calm' | 'mid' | 'urgent';

export type DayAppealPalette = {
  top: string;
  bottom: string;
  text: string;
  muted: string;
  streakOn: string;
  streakOff: string;
};

export function dayAppealMood(dayProgress: number): DayAppealMood {
  const band = progressBand(dayProgress);
  if (band === 'dawn' || band === 'open') return 'calm';
  if (band === 'mid') return 'mid';
  return 'urgent';
}

export function dayAppealLine(mood: DayAppealMood): string {
  switch (mood) {
    case 'calm':
      return 'Day still open';
    case 'mid':
      return 'Make the hours count';
    case 'urgent':
      return 'This day will never repeat.';
  }
}

export function dayAppealPalette(mood: DayAppealMood): DayAppealPalette {
  switch (mood) {
    case 'calm':
      return {
        top: '#F6E7D4',
        bottom: '#E29A4A',
        text: '#1A1A1A',
        muted: 'rgba(26,26,26,0.65)',
        streakOn: '#E87C20',
        streakOff: 'rgba(26,26,26,0.2)',
      };
    case 'mid':
      return {
        top: '#E87C20',
        bottom: '#9A3B10',
        text: '#FFFFFF',
        muted: 'rgba(255,255,255,0.75)',
        streakOn: '#FFFFFF',
        streakOff: 'rgba(255,255,255,0.28)',
      };
    case 'urgent':
      return {
        top: '#C44A2F',
        bottom: '#5C1212',
        text: '#FFFFFF',
        muted: 'rgba(255,255,255,0.75)',
        streakOn: '#FFFFFF',
        streakOff: 'rgba(255,255,255,0.28)',
      };
  }
}

export function formatDayLeftoverLabel(remainingMinutes: number): string {
  const m = Math.max(0, Math.floor(remainingMinutes));
  const h = Math.floor(m / 60);
  const mins = m % 60;
  if (h <= 0) return `${mins}m`;
  if (mins === 0) return `${h}h`;
  return `${h}h ${mins}m`;
}

/** 7 dots, index 0 = 6 days ago, index 6 = today. */
export function presenceStreakDots(params: {
  count: number;
  lastDateKey: string | null;
  todayKey: string;
  noticedToday: boolean;
}): boolean[] {
  const dots = Array.from({ length: 7 }, () => false);
  const n = Math.max(0, Math.min(7, Math.floor(params.count)));
  if (n === 0 || !params.lastDateKey) return dots;
  const endIndex =
    params.noticedToday && params.lastDateKey === params.todayKey ? 6 : 5;
  for (let i = 0; i < n; i++) {
    const idx = endIndex - i;
    if (idx >= 0 && idx < 7) dots[idx] = true;
  }
  return dots;
}
