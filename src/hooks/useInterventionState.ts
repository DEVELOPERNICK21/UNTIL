/**
 * useInterventionState - Premium intervention state (red pulse, etc.)
 */

import { useState, useEffect, useCallback } from 'react';
import { getInterventionStateUseCase } from '../di';
import { getCategoryTotalsUseCase } from '../di';

export function useInterventionState() {
  const [state, setState] = useState(() => getInterventionStateUseCase.execute());

  const refresh = useCallback(() => {
    setState(getInterventionStateUseCase.execute());
  }, []);

  useEffect(() => {
    const unsubscribe = getCategoryTotalsUseCase.subscribe(refresh);
    return unsubscribe;
  }, [refresh]);

  return state;
}
