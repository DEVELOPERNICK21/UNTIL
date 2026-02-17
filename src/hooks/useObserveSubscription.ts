/**
 * useObserveSubscription - Subscribes to SubscriptionRepository for premium state
 */

import { useState, useEffect, useCallback } from 'react';
import { observeSubscriptionUseCase } from '../di';

export function useObserveSubscription() {
  const [state, setState] = useState(() => observeSubscriptionUseCase.observe());

  const refresh = useCallback(() => {
    setState(observeSubscriptionUseCase.observe());
  }, []);

  useEffect(() => {
    const unsubscribe = observeSubscriptionUseCase.subscribe(refresh);
    return () => unsubscribe();
  }, [refresh]);

  return state;
}
