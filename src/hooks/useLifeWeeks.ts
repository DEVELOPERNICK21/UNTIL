import { useMemo } from 'react';
import { computeLifeWeeks } from '../core/time/lifeWeeks';

export function useLifeWeeks(
  deathAge: number | undefined,
  remainingDaysLife: number | undefined,
) {
  return useMemo(
    () => computeLifeWeeks(deathAge ?? 80, remainingDaysLife),
    [deathAge, remainingDaysLife],
  );
}
