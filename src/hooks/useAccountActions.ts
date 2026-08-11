/**
 * useAccountActions — sign-in (Google / email), sign-out, devices for account UI.
 */

import { useCallback, useEffect, useState } from 'react';
import {
  accountCloudStore,
  authSessionRepository,
  createAccountWithEmailUseCase,
  deviceIdProvider,
  removeAccountDeviceUseCase,
  signInWithEmailUseCase,
  signInWithGoogleUseCase,
  signOutUseCase,
} from '../di';
import { isAuthCancelledError } from '../domain/errors/authErrors';
import type { AccountDevice, SignInResult } from '../types';

function toErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return 'Something went wrong. Try again.';
}

export function useAccountActions() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentDeviceId, setCurrentDeviceId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void deviceIdProvider.getDeviceId().then(id => {
      if (!cancelled) setCurrentDeviceId(id);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const runAction = useCallback(async <T>(action: () => Promise<T>): Promise<T> => {
    setBusy(true);
    setError(null);
    try {
      return await action();
    } catch (e) {
      if (!isAuthCancelledError(e)) {
        setError(toErrorMessage(e));
      }
      throw e;
    } finally {
      setBusy(false);
    }
  }, []);

  const signInWithGoogle = useCallback(
    async (): Promise<SignInResult | null> => {
      try {
        return await runAction(() => signInWithGoogleUseCase.execute());
      } catch (e) {
        if (isAuthCancelledError(e)) return null;
        throw e;
      }
    },
    [runAction]
  );

  const signInWithEmail = useCallback(
    (email: string, password: string): Promise<SignInResult> =>
      runAction(() => signInWithEmailUseCase.execute(email, password)),
    [runAction]
  );

  const createAccountWithEmail = useCallback(
    (email: string, password: string): Promise<SignInResult> =>
      runAction(() => createAccountWithEmailUseCase.execute(email, password)),
    [runAction]
  );

  const signOut = useCallback(
    (): Promise<void> =>
      runAction(async () => {
        await signOutUseCase.execute();
      }),
    [runAction]
  );

  const removeDevice = useCallback(
    (deviceId: string): Promise<void> =>
      runAction(async () => {
        const uid = authSessionRepository.getUid();
        if (!uid) {
          throw new Error('Not signed in');
        }
        await removeAccountDeviceUseCase.execute(uid, deviceId);
      }),
    [runAction]
  );

  const refreshDevices = useCallback((): Promise<AccountDevice[]> => {
    return runAction(async () => {
      const uid = authSessionRepository.getUid();
      if (!uid) {
        return [];
      }
      return accountCloudStore.listDevices(uid);
    });
  }, [runAction]);

  const clearError = useCallback(() => setError(null), []);

  return {
    signInWithGoogle,
    signInWithEmail,
    createAccountWithEmail,
    signOut,
    removeDevice,
    refreshDevices,
    currentDeviceId,
    busy,
    error,
    clearError,
  };
}
