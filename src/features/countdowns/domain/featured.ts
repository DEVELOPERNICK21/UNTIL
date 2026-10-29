/**
 * Which deadline comes first. The widgets show one deadline, and the list screen starts with it.
 *
 * Deadlines still to come are ordered by how soon they are (today counts as still to come).
 * Deadlines that have passed follow, the most recent first. The Android and iOS widgets apply the
 * same rule on their own, so the right one shows even when the app has not been opened since a
 * date went by.
 */

import type { Countdown } from '../../../shared/types';
import { getSignedDaysUntil } from './daysLeft';

export function sortByUrgency<T extends Countdown>(
  list: readonly T[],
  today?: Date,
): T[] {
  return list
    .map((item, index) => ({ item, index, days: getSignedDaysUntil(item.date, today) }))
    .sort((a, b) => {
      const aPassed = a.days < 0;
      const bPassed = b.days < 0;
      if (aPassed !== bPassed) return aPassed ? 1 : -1;
      if (a.days !== b.days) return aPassed ? b.days - a.days : a.days - b.days;
      return a.index - b.index;
    })
    .map(entry => entry.item);
}

/** The deadline a widget shows, or null when there are none. */
export function featuredCountdown<T extends Countdown>(
  list: readonly T[],
  today?: Date,
): T | null {
  return sortByUrgency(list, today)[0] ?? null;
}
