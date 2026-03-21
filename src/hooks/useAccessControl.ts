/**
 * useAccessControl — reactive AccessState + helpers for gating (trial, event unlock, premium).
 */

import { useState, useEffect, useCallback } from 'react';
import { observeSubscriptionUseCase, getAccessStateUseCase } from '../di';
import type { AccessState } from '../types';
import { canAccessLife, hasPremiumBundle } from '../domain/accessControl';

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
    const unsubscribe = observeSubscriptionUseCase.subscribe(refresh);
    return () => unsubscribe();
  }, [refresh]);

  return {
    access,
    hasPremiumBundle: hasPremiumBundle(access),
    canAccessLife: canAccessLife(access),
    refresh,
  };
}
