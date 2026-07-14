import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import {
  getPresenceStreakUseCase,
  recordPresenceUseCase,
} from '../di';
import type { PresenceStreakState } from '../domain/presence/presenceStreak';
import { EMPTY_PRESENCE } from '../domain/presence/presenceStreak';
import { schedulePresenceStreakSaver } from '../services/presenceStreakNotifications';

export function usePresenceStreak() {
  const [streak, setStreak] = useState<PresenceStreakState>(() =>
    getPresenceStreakUseCase.execute(),
  );

  const refresh = useCallback(() => {
    setStreak(getPresenceStreakUseCase.execute());
  }, []);

  const markPresent = useCallback((dayProgress: number = 0.5) => {
    const next = recordPresenceUseCase.execute();
    setStreak(next);
    void schedulePresenceStreakSaver(next, dayProgress);
    return next;
  }, []);

  useEffect(() => {
    refresh();
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') refresh();
    });
    return () => sub.remove();
  }, [refresh]);

  return {
    streak: streak ?? EMPTY_PRESENCE,
    refresh,
    markPresent,
  };
}
