/**
 * The views of the desktop island, like the iPhone's Dynamic Island: Today, Month, Year, Life and
 * the hour timer. What each one says in its folded form, its sticker and its colour. The phone's
 * chips and stickers are in ios/UNTILWidgets/UNTILWidgets.swift (`IslandMode`, `IslandStickers`).
 */

import type { PeriodView } from './periods';
import { formatTimer, hourFraction, timerMs, timerStatus, type HourTimer } from './timer';

export type IslandMode = 'day' | 'month' | 'year' | 'life' | 'timer';

export const ISLAND_MODES: readonly IslandMode[] = ['day', 'month', 'year', 'life', 'timer'];

export const MODE_LABEL: Record<IslandMode, string> = {
  day: 'Today',
  month: 'Month',
  year: 'Year',
  life: 'Life',
  timer: 'Hour',
};

/** The sticker on each chip. Same as the phone. */
export const MODE_CHIP: Record<IslandMode, string> = {
  day: '🌞',
  month: '🌙',
  year: '🌍',
  life: '❤️',
  timer: '⏱️',
};

/** Glow colour of each view. Today uses the day's own colour, from how far through it is. */
export const MODE_ACCENT: Record<Exclude<IslandMode, 'day'>, string> = {
  month: '#2ED3C6',
  year: '#60A5FA',
  life: '#FB7185',
  timer: '#BB86FC',
};

const KEY = 'until.desktop.islandMode';

export function isIslandMode(value: unknown): value is IslandMode {
  return ISLAND_MODES.includes(value as IslandMode);
}

export function loadMode(storage: Pick<Storage, 'getItem'> = localStorage): IslandMode {
  try {
    const saved = storage.getItem(KEY);
    return isIslandMode(saved) ? saved : 'day';
  } catch {
    return 'day';
  }
}

export function saveMode(mode: IslandMode, storage: Pick<Storage, 'setItem'> = localStorage): void {
  try {
    storage.setItem(KEY, mode);
  } catch {
    // Not worth failing over.
  }
}

export const MODE_STORAGE_KEY = KEY;

function pick(list: string[], share: number): string {
  const stage = Math.min(list.length - 1, Math.max(0, Math.floor(share * list.length)));
  return list[stage];
}

/** The sticker for a view, one of the phone's first pack, chosen by how far through it is. */
export function stickerFor(mode: IslandMode, share: number | null, timer?: HourTimer, nowMs = 0): string {
  const s = share ?? 0;
  switch (mode) {
    case 'day':
      return pick(['🌙', '🌅', '🌞', '🌤️', '🌇', '🌌'], s);
    case 'month':
      return pick(['🌑', '🌒', '🌓', '🌔', '🌕'], s);
    case 'year':
      return pick(['❄️', '🌱', '🌸', '☀️', '🍂'], s);
    case 'life':
      return pick(['👶', '🧒', '🧑', '🧔', '👴'], s);
    case 'timer': {
      const minutes = timer ? timerMs(timer, nowMs) / 60_000 : 0;
      if (minutes < 5) return '🌱';
      if (minutes < 20) return '🔥';
      if (minutes < 40) return '⚡️';
      if (minutes < 60) return '🚀';
      return '🏆';
    }
  }
}

/** What the folded island says for the chosen view. */
export interface Summary {
  /** The number beside the notch. */
  value: string;
  /** Under it. */
  label: string;
  /** The word on the bar. */
  bar: string;
  /** 0..1 along the bar, or null when there is nothing to show. */
  progress: number | null;
  /** The percent at the end of the bar. */
  percent: string;
}

function lifeYears(period: PeriodView): string {
  const days = Number(period.left.parts[0]?.value.replace(/,/g, ''));
  return Number.isFinite(days) ? (days / 365.25).toFixed(1) : '';
}

export function summaryFor(
  mode: IslandMode,
  periods: Record<'day' | 'month' | 'year' | 'life', PeriodView>,
  timer: HourTimer,
  nowMs: number,
): Summary {
  if (mode === 'timer') {
    const ms = timerMs(timer, nowMs);
    const fraction = hourFraction(ms);
    return {
      value: formatTimer(ms),
      label: timerStatus(timer),
      bar: 'Hour',
      progress: fraction,
      percent: `${Math.floor(fraction * 100)}%`,
    };
  }

  const period = periods[mode];
  if (period.locked) {
    return { value: 'Sign in', label: period.left.caption.toLowerCase(), bar: MODE_LABEL[mode], progress: null, percent: '' };
  }

  const percent = period.passedPct == null ? '' : `${period.passedPct}%`;
  switch (mode) {
    case 'day':
      return { value: period.chip, label: 'left today', bar: 'Today', progress: period.progress, percent };
    case 'month':
      return { value: period.chip, label: 'left this month', bar: 'Month', progress: period.progress, percent };
    case 'year':
      return { value: period.chip, label: 'left this year', bar: 'Year', progress: period.progress, percent };
    case 'life':
      return { value: `${lifeYears(period)} yrs`, label: 'left in your life', bar: 'Life', progress: period.progress, percent };
  }
}
