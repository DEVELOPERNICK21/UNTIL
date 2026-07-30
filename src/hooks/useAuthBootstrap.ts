/**
 * useAuthBootstrap — keeps the local auth session in step with Firebase.
 *
 * Subscribes to auth state instead of reading currentUser once: Firebase
 * restores a persisted session asynchronously, so a one-shot read on launch
 * often misses it. On each signed-in user we re-run the post-login sync
 * (profile merge, device slot, entitlement bind) so a relaunch keeps cloud
 * premium and the account device list current.
 *
 * When Firebase reports no user but MMKV still holds a uid, the local session is
 * stale (account deleted, session revoked elsewhere) and gets cleared.
 *
 * No-op when Firebase isn't configured on this build: subscribe() never fires,
 * so a stored session is left alone rather than wrongly cleared.
 */

import { useEffect } from 'react';
import {
  authService,
  authSessionRepository,
  bindEntitlementToAccountUseCase,
  registerDeviceUseCase,
  signOutUseCase,
  syncAccountProfileUseCase,
} from '../di';
import { isConclusiveRegistration } from '../core/account/deviceLimit';
import { syncPremiumStatus } from '../infrastructure/WidgetSync';
import { recordCrashError } from '../services/analytics';
import type { AuthUser } from '../types';

async function bootstrapSignedInUser(user: AuthUser): Promise<void> {
  authSessionRepository.setUid(user.uid);
  authSessionRepository.setEmail(user.email);

  try {
    await syncAccountProfileUseCase.execute(user.uid);
  } catch (e) {
    recordCrashError(e, 'useAuthBootstrap.syncAccountProfile');
  }

  const registration = await registerDeviceUseCase.execute(user.uid);
  /**
   * Leave devicePremiumAllowed untouched when the cloud call failed: a network
   * error should not strip cloud premium from a device that already held it.
   */
  if (!isConclusiveRegistration(registration)) return;

  authSessionRepository.setDevicePremiumAllowed(registration.registered);
  syncPremiumStatus();

  if (registration.registered) {
    try {
      await bindEntitlementToAccountUseCase.execute(user.uid);
    } catch (e) {
      recordCrashError(e, 'useAuthBootstrap.bindEntitlement');
    }
  }
}

export function useAuthBootstrap(): void {
  useEffect(() => {
    const syncedUids = new Set<string>();
    let cancelled = false;

    const unsubscribe = authService.subscribe(user => {
      if (cancelled) return;

      if (!user) {
        if (authSessionRepository.getUid() != null) {
          signOutUseCase.clearLocalSession();
        }
        return;
      }

      if (syncedUids.has(user.uid)) {
        authSessionRepository.setEmail(user.email);
        return;
      }
      syncedUids.add(user.uid);

      void bootstrapSignedInUser(user).catch(e => {
        recordCrashError(e, 'useAuthBootstrap.bootstrapSignedInUser');
      });
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);
}
