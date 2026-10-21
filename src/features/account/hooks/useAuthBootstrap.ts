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
 *
 * Cold-start RevenueCat identify reads MMKV uid in app.tsx so it does not wait
 * on this Firebase subscription.
 */

import { useEffect } from 'react';
import { AppState } from 'react-native';
import {
  authService,
  authSessionRepository,
  bindEntitlementToAccountUseCase,
  ensureAccountAgeRecordedUseCase,
  identifyPurchasesUserUseCase,
  registerDeviceUseCase,
  resetPurchasesUserUseCase,
  signOutUseCase,
  syncAccountProfileUseCase,
} from '../../../app/di';
import { isConclusiveRegistration } from '../domain/deviceLimit';
import { widgetSync } from '../../../shared/platform/widgetSync';
import { logAnalyticsEvent, recordCrashError } from '../../../shared/analytics/analytics';
import { MS_PER_HOUR } from '../../../shared/time/constants';
import type { AuthUser } from '../../../shared/types';

/**
 * A phone can stay alive in the background for weeks, so coming back to the foreground re-checks
 * the device slot (at most this often). That is how a device removed from the account elsewhere
 * learns about it without a restart.
 */
const FOREGROUND_RECHECK_MS = 6 * MS_PER_HOUR;

async function bootstrapSignedInUser(user: AuthUser): Promise<void> {
  const hadUid = authSessionRepository.getUid() != null;
  authSessionRepository.setUid(user.uid);
  authSessionRepository.setEmail(user.email);

  if (!hadUid) {
    try {
      await identifyPurchasesUserUseCase.execute(user.uid);
    } catch (e) {
      recordCrashError(e, 'useAuthBootstrap.identifyPurchases');
    }
  }

  /**
   * Accounts from before the age gate lack the 13+ flag, and the Firestore rules refuse every
   * write without it. Record it first (when a birth date proves the age) so the sync below works.
   */
  try {
    const age = await ensureAccountAgeRecordedUseCase.execute(user.uid);
    if (age !== 'already_recorded') {
      void logAnalyticsEvent('account_age_backfill', { result: age });
    }
  } catch (e) {
    recordCrashError(e, 'useAuthBootstrap.ensureAccountAge');
  }

  try {
    await syncAccountProfileUseCase.execute(user.uid);
  } catch (e) {
    recordCrashError(e, 'useAuthBootstrap.syncAccountProfile');
  }

  await refreshDeviceAccess(user.uid);
}

/** Claims or confirms this device's slot, then binds the account's entitlement if it holds one. */
async function refreshDeviceAccess(uid: string): Promise<void> {
  const registration = await registerDeviceUseCase.execute(uid);
  /**
   * Leave devicePremiumAllowed untouched when the cloud call failed: a network
   * error should not strip cloud premium from a device that already held it.
   */
  if (!isConclusiveRegistration(registration)) return;

  authSessionRepository.setDevicePremiumAllowed(registration.registered);
  widgetSync.syncPremiumStatus();

  if (registration.registered) {
    try {
      await bindEntitlementToAccountUseCase.execute(uid);
    } catch (e) {
      recordCrashError(e, 'useAuthBootstrap.bindEntitlement');
    }
  }
}

export function useAuthBootstrap(): void {
  useEffect(() => {
    const syncedUids = new Set<string>();
    let cancelled = false;
    let lastDeviceCheckAt = Date.now();

    const appStateSubscription = AppState.addEventListener('change', state => {
      if (state !== 'active' || cancelled) return;
      const uid = authSessionRepository.getUid();
      if (!uid || Date.now() - lastDeviceCheckAt < FOREGROUND_RECHECK_MS) return;
      lastDeviceCheckAt = Date.now();
      void refreshDeviceAccess(uid).catch(e => {
        recordCrashError(e, 'useAuthBootstrap.foregroundDeviceCheck');
      });
    });

    const unsubscribe = authService.subscribe(user => {
      if (cancelled) return;

      if (!user) {
        if (authSessionRepository.getUid() != null) {
          void (async () => {
            try {
              await resetPurchasesUserUseCase.execute();
            } catch (e) {
              recordCrashError(e, 'useAuthBootstrap.resetPurchases');
            }
            signOutUseCase.clearLocalSession();
          })();
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
      appStateSubscription.remove();
      unsubscribe();
    };
  }, []);
}
