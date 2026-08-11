/**
 * CompleteAccountSignInUseCase — after any successful provider auth, sync
 * profile, claim a device slot, and bind entitlement.
 *
 * Cloud sync must not block forever: Firestore without a database (or a hung
 * Play restore) used to leave the login spinner spinning. Session is written
 * first; sync runs under a hard budget and then we always return.
 */

import type { IAuthSessionRepository } from '../repository/IAuthSessionRepository';
import type { AuthUser, RegisterDeviceResult, SignInResult } from '../../types';
import type { RegisterDeviceUseCase } from './RegisterDeviceUseCase';
import type { SyncAccountProfileUseCase } from './SyncAccountProfileUseCase';
import type { BindEntitlementToAccountUseCase } from './BindEntitlementToAccountUseCase';
import { isConclusiveRegistration } from '../../core/account/deviceLimit';
import { withTimeout } from '../../core/account/withTimeout';

const COMPLETE_SIGN_IN_BUDGET_MS = 12_000;

export class CompleteAccountSignInUseCase {
  constructor(
    private readonly authSession: IAuthSessionRepository,
    private readonly syncAccountProfile: SyncAccountProfileUseCase,
    private readonly registerDevice: RegisterDeviceUseCase,
    private readonly bindEntitlement: BindEntitlementToAccountUseCase,
    private readonly onError?: (error: unknown, context: string) => void,
    private readonly onDeviceAccessChanged?: () => void
  ) {}

  async execute(user: AuthUser): Promise<SignInResult> {
    this.authSession.setUid(user.uid);
    this.authSession.setEmail(user.email);

    try {
      return await withTimeout(
        this.finishSync(user),
        COMPLETE_SIGN_IN_BUDGET_MS,
        'completeSignIn'
      );
    } catch (e) {
      this.onError?.(e, 'CompleteAccountSignInUseCase.budget');
      return {
        user,
        deviceRegistered: false,
        deviceLimitReached: false,
      };
    }
  }

  private async finishSync(user: AuthUser): Promise<SignInResult> {
    try {
      await this.syncAccountProfile.execute(user.uid);
    } catch (e) {
      this.onError?.(e, 'CompleteAccountSignInUseCase.syncAccountProfile');
    }

    let registration: RegisterDeviceResult | null = null;
    try {
      registration = await this.registerDevice.execute(user.uid);
    } catch (e) {
      this.onError?.(e, 'CompleteAccountSignInUseCase.registerDevice');
    }

    if (registration && isConclusiveRegistration(registration)) {
      this.authSession.setDevicePremiumAllowed(registration.registered);
      this.onDeviceAccessChanged?.();
    }

    if (registration?.registered) {
      try {
        await this.bindEntitlement.execute(user.uid);
      } catch (e) {
        this.onError?.(e, 'CompleteAccountSignInUseCase.bindEntitlement');
      }
    }

    return {
      user,
      deviceRegistered: registration?.registered ?? false,
      deviceLimitReached: registration?.reason === 'limit_reached',
    };
  }
}
