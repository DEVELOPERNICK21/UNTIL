import { useMemo } from 'react';
import { computeLifeWeeks } from '../core/time/lifeWeeks';
import { useObserveTimeState } from './useObserveTimeState';

export function useLifeWeeks() {
  const { userProfile, timeState } = useObserveTimeState();

  return useMemo(
    () =>
      computeLifeWeeks(
        userProfile.deathAge ?? 80,
        timeState.remainingDaysLife,
      ),
    [userProfile.deathAge, timeState.remainingDaysLife],
  );
}
