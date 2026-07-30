/**
 * useAuthBootstrap — on launch, mirror Firebase's currentUser into the local
 * auth session, then re-run the same post-login sync as sign-in (device
 * registration + entitlement bind) so a relaunch keeps cloud premium and the
 * account device list current without asking the user to sign in again.
 *
 * No-op when there is no signed-in Firebase user, or when Firebase isn't
 * configured on this build (authService.getCurrentUser() returns null).
 */

import { useEffect, useRef } from 'react';
import {
  authService,
  authSessionRepository,
  bindEntitlementToAccountUseCase,
  registerDeviceUseCase,
  syncAccountProfileUseCase,
} from '../di';
import { recordCrashError } from '../services/analytics';

export function useAuthBootstrap(): void {
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    void (async () => {
      const user = authService.getCurrentUser();
      if (!user) return;

      authSessionRepository.setUid(user.uid);
      authSessionRepository.setEmail(user.email);

      try {
        await syncAccountProfileUseCase.execute(user.uid);
      } catch (e) {
        recordCrashError(e, 'useAuthBootstrap.syncAccountProfile');
      }

      try {
        const registration = await registerDeviceUseCase.execute(user.uid);
        authSessionRepository.setDevicePremiumAllowed(registration.registered);

        if (registration.registered) {
          try {
            await bindEntitlementToAccountUseCase.execute(user.uid);
          } catch (e) {
            recordCrashError(e, 'useAuthBootstrap.bindEntitlement');
          }
        }
      } catch (e) {
        // Leave devicePremiumAllowed untouched: a network failure here
        // should not strip cloud premium from a device that already held it.
        recordCrashError(e, 'useAuthBootstrap.registerDevice');
      }
    })();
  }, []);
}
