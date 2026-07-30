/**
 * useAccountActions — sign-in, sign-out, device list, and remove device for account UI.
 */

import { useCallback, useState } from 'react';
import {
  accountCloudStore,
  authSessionRepository,
  removeAccountDeviceUseCase,
  signInWithGoogleUseCase,
  signOutUseCase,
} from '../di';
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

  const runAction = useCallback(async <T>(action: () => Promise<T>): Promise<T> => {
    setBusy(true);
    setError(null);
    try {
      return await action();
    } catch (e) {
      setError(toErrorMessage(e));
      throw e;
    } finally {
      setBusy(false);
    }
  }, []);

  const signInWithGoogle = useCallback(
    (): Promise<SignInResult> => runAction(() => signInWithGoogleUseCase.execute()),
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
    busy,
    error,
  };
}
