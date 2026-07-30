/**
 * useAuthSession — subscribes to the local auth session mirror for UI.
 */

import { useState, useEffect, useCallback } from 'react';
import { observeAuthSessionUseCase } from '../di';

export function useAuthSession() {
  const [state, setState] = useState(() => observeAuthSessionUseCase.observe());

  const refresh = useCallback(() => {
    setState(observeAuthSessionUseCase.observe());
  }, []);

  useEffect(() => {
    const unsubscribe = observeAuthSessionUseCase.subscribe(refresh);
    return () => unsubscribe();
  }, [refresh]);

  return {
    uid: state.uid,
    email: state.email,
    signedIn: state.uid != null,
    devicePremiumAllowed: state.devicePremiumAllowed,
  };
}
