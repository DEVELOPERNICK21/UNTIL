/**
 * useObserveCategoryTotals - Subscribes to activity repository for category totals
 */

import { useState, useEffect, useCallback } from 'react';
import { getCategoryTotalsUseCase } from '../di';

export function useObserveCategoryTotals() {
  const [totals, setTotals] = useState(() => getCategoryTotalsUseCase.execute());

  const refresh = useCallback(() => {
    setTotals(getCategoryTotalsUseCase.execute());
  }, []);

  useEffect(() => {
    const unsubscribe = getCategoryTotalsUseCase.subscribe(refresh);
    return unsubscribe;
  }, [refresh]);

  return totals;
}
