import { useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useCountdowns } from './useCountdowns';

/** Days until the nearest countdown that has not passed, or null when there is none. */
export function useNextCountdownDays(): number | null {
  const { countdowns, refresh } = useCountdowns();

  // A countdown added on its own screen should count as soon as you are back.
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const upcoming = countdowns.map(c => c.daysUntil).filter(days => days >= 0);
  return upcoming.length > 0 ? Math.min(...upcoming) : null;
}
