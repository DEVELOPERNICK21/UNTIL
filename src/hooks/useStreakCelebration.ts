/**
 * useStreakCelebration - true once per day, the first time Home is shown after
 * today's streak was counted. The caller plays the animation, then calls
 * `acknowledge` so it does not repeat on the next visit.
 */

import { useCallback, useState } from 'react';
import { acknowledgeBadgesUseCase } from '../di';
import { usePresenceStreak } from './usePresenceStreak';
import { useTodayIso } from './useTodayIso';

export function useStreakCelebration() {
  const today = useTodayIso();
  const { streak } = usePresenceStreak();
  const [celebratedOn, setCelebratedOn] = useState(() =>
    acknowledgeBadgesUseCase.getStreakCelebratedOn(),
  );

  const acknowledge = useCallback(() => {
    acknowledgeBadgesUseCase.markStreakCelebrated(today);
    setCelebratedOn(today);
  }, [today]);

  return {
    celebrate: streak.noticedToday && streak.count > 0 && celebratedOn !== today,
    acknowledge,
  };
}
