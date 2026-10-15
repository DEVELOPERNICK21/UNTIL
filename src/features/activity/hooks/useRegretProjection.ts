/**
 * useRegretProjection - Get regret projection when enough data
 */

import { useState, useEffect, useCallback } from 'react';
import { getRegretProjectionUseCase } from '../../../app/di';
import { getCategoryTotalsUseCase } from '../../../app/di';

export function useRegretProjection() {
  const [result, setResult] = useState(() => getRegretProjectionUseCase.execute());

  const refresh = useCallback(() => {
    setResult(getRegretProjectionUseCase.execute());
  }, []);

  useEffect(() => {
    const unsubscribe = getCategoryTotalsUseCase.subscribe(refresh);
    return unsubscribe;
  }, [refresh]);

  return result;
}
