/**
 * useUpdateSubscription - Returns function to update premium state via SubscriptionRepository
 */

import { useCallback } from 'react';
import { updateSubscriptionUseCase } from '../../../app/di';

export function useUpdateSubscription() {
  const setIsPremium = useCallback((isPremium: boolean) => {
    updateSubscriptionUseCase.execute(isPremium);
  }, []);
  return setIsPremium;
}
