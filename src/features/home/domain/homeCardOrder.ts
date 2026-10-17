/**
 * Which cards sit under the four period tiles on Home, and in what order.
 *
 * The tiles are the product, so they always come first. Under them go at most three cards, chosen
 * by what is most useful right now; the rest wait behind a "More" row. Pure: no React, no clock.
 */

export type HomeCardId = 'quests' | 'countdown' | 'coach' | 'lostTime' | 'badges';

/** How many cards show before "More". */
export const MAX_VISIBLE_HOME_CARDS = 3;

/** A countdown this close goes to the top, whatever the time of day. */
export const COUNTDOWN_SOON_DAYS = 3;

export type PartOfDay = 'morning' | 'afternoon' | 'evening';

export function partOfDay(hour: number): PartOfDay {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  return 'evening';
}

const BY_PART_OF_DAY: Record<PartOfDay, HomeCardId[]> = {
  // Plan the day, then reflect.
  morning: ['quests', 'coach', 'countdown', 'lostTime', 'badges'],
  afternoon: ['quests', 'countdown', 'coach', 'lostTime', 'badges'],
  // Wind down: reflect first.
  evening: ['coach', 'quests', 'countdown', 'lostTime', 'badges'],
};

export interface HomeCardInput {
  /** Local hour, 0 to 23. */
  hour: number;
  /** Days until the next countdown, or null when there is none. */
  nextCountdownDays: number | null;
  /** Whether the time coach has something to say today. */
  coachAvailable: boolean;
}

export interface HomeCardOrder {
  visible: HomeCardId[];
  more: HomeCardId[];
}

export function orderHomeCards(input: HomeCardInput): HomeCardOrder {
  let order = BY_PART_OF_DAY[partOfDay(input.hour)].filter(
    id => id !== 'coach' || input.coachAvailable,
  );

  const soon =
    input.nextCountdownDays != null &&
    input.nextCountdownDays >= 0 &&
    input.nextCountdownDays <= COUNTDOWN_SOON_DAYS;
  if (soon) {
    order = ['countdown', ...order.filter(id => id !== 'countdown')];
  }

  return {
    visible: order.slice(0, MAX_VISIBLE_HOME_CARDS),
    more: order.slice(MAX_VISIBLE_HOME_CARDS),
  };
}

/** How far down Home someone has scrolled, as 0, 25, 50, 75 or 100 (percent of what can scroll). */
export function scrollDepthBucket(
  offsetY: number,
  viewHeight: number,
  contentHeight: number,
): 0 | 25 | 50 | 75 | 100 {
  const scrollable = contentHeight - viewHeight;
  if (scrollable <= 0 || offsetY <= 0) return 0;
  const share = Math.min(1, offsetY / scrollable);
  if (share >= 1) return 100;
  if (share >= 0.75) return 75;
  if (share >= 0.5) return 50;
  if (share >= 0.25) return 25;
  return 0;
}
