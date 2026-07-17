import { useCallback, useEffect, useState } from 'react';
import {
  getDailyLimitNothingUseCase,
  getCategoryTotalsUseCase,
  setDailyLimitNothingUseCase,
} from '../di';

export function useDailyNothingLimit() {
  const [limitHours, setLimitHoursState] = useState(() =>
    getDailyLimitNothingUseCase.execute()
  );

  const refresh = useCallback(() => {
    setLimitHoursState(getDailyLimitNothingUseCase.execute());
  }, []);

  useEffect(() => {
    const unsubscribe = getCategoryTotalsUseCase.subscribe(refresh);
    return unsubscribe;
  }, [refresh]);

  const setLimitHours = useCallback(
    (hours: number) => {
      setDailyLimitNothingUseCase.execute(hours);
      refresh();
    },
    [refresh]
  );

  return { limitHours, setLimitHours };
}
