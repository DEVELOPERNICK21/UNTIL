/**
 * useBadges - earned and locked badges, plus the unlock celebrations still to show.
 *
 * Re-checks on screen focus, when the app returns to the foreground and when
 * tasks change, so a badge earned on another screen is waiting when the user
 * comes back.
 */

import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  acknowledgeBadgesUseCase,
  evaluateBadgesUseCase,
  getBadgesUseCase,
  observeDailyTasksUseCase,
} from '../di';
import type { BadgeOverview } from '../domain/useCases/GetBadgesUseCase';
import { logAnalyticsEvent } from '../services/analytics';

/**
 * Badge state without any navigation dependency, so it can live outside the
 * NavigationContainer (the unlock host in the app shell).
 */
export function useBadgeOverview() {
  const [overview, setOverview] = useState<BadgeOverview>(() =>
    getBadgesUseCase.execute(),
  );

  const refresh = useCallback(() => {
    const newIds = evaluateBadgesUseCase.execute();
    newIds.forEach(id => {
      logAnalyticsEvent('badge_unlocked', { badge_id: id }).catch(() => {});
    });
    setOverview(getBadgesUseCase.execute());
  }, []);

  const markSeen = useCallback((ids: readonly string[]) => {
    acknowledgeBadgesUseCase.markSeen(ids);
    setOverview(getBadgesUseCase.execute());
  }, []);

  useEffect(() => {
    const unsubscribe = observeDailyTasksUseCase.subscribe(refresh);
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') refresh();
    });
    return () => {
      unsubscribe();
      sub.remove();
    };
  }, [refresh]);

  return { ...overview, refresh, markSeen };
}

/** Badge state for screens: also re-checks whenever the screen gains focus. */
export function useBadges() {
  const badges = useBadgeOverview();
  useFocusEffect(badges.refresh);
  return badges;
}
