/**
 * Local calendar "today" (YYYY-MM-DD). Refreshes on focus and when the app
 * returns to foreground so midnight rollover does not keep yesterday's day key.
 */

import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { todayIso as clockTodayIso } from '../core/time/clock';

export function useTodayIso(): string {
  const [today, setToday] = useState(() => clockTodayIso());

  const sync = useCallback(() => {
    setToday(clockTodayIso());
  }, []);

  useFocusEffect(
    useCallback(() => {
      sync();
    }, [sync]),
  );

  useEffect(() => {
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') sync();
    });
    return () => sub.remove();
  }, [sync]);

  return today;
}
