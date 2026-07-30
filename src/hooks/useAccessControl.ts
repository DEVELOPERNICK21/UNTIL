/**
 * useAccessControl — reactive AccessState + helpers for gating (trial, event unlock, premium).
 */

import { useState, useEffect, useCallback } from 'react';
import {
  observeSubscriptionUseCase,
  observeAuthSessionUseCase,
  getAccessStateUseCase,
} from '../di';
import type { AccessState } from '../types';

export function useAccessControl(): {
  access: AccessState;
  hasPremiumBundle: boolean;
  canAccessLife: boolean;
  refresh: () => void;
} {
  const [access, setAccess] = useState<AccessState>(() =>
    getAccessStateUseCase.execute()
  );

  const refresh = useCallback(() => {
    setAccess(getAccessStateUseCase.execute());
  }, []);

  useEffect(() => {
    const unsubscribeSubscription = observeSubscriptionUseCase.subscribe(refresh);
    const unsubscribeAuth = observeAuthSessionUseCase.subscribe(refresh);
    return () => {
      unsubscribeSubscription();
      unsubscribeAuth();
    };
  }, [refresh]);

  return {
    access,
    hasPremiumBundle: access.isPremium || access.trialActive,
    canAccessLife:
      access.isPremium || access.trialActive || access.lifeEventUnlockActive,
    refresh,
  };
}
