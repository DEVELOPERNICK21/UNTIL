/**
 * useAccountActions — sign-in, sign-out, device list, and remove device for account UI.
 */

import { useCallback, useEffect, useState } from 'react';
import {
  accountCloudStore,
  authSessionRepository,
  deviceIdProvider,
  removeAccountDeviceUseCase,
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
      /** Backing out of the Google sheet is a choice, not a failure to report. */
      if (!isAuthCancelledError(e)) {
        setError(toErrorMessage(e));
      }
      throw e;
    } finally {
      setBusy(false);
    }
  }, []);

  /** Resolves to null when the user backed out of the Google sheet. */
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

  return {
    signInWithGoogle,
    signOut,
    removeDevice,
    refreshDevices,
    currentDeviceId,
    busy,
    error,
  };
}
