/**
 * SignInWithGoogleUseCase — sign in, then run the post-login sync:
 * profile merge, device slot, entitlement bind.
 *
 * Only the sign-in itself throws. Sync steps report through onError so a
 * network problem cannot undo a successful login.
 */

import type { IAuthService } from '../ports/IAuthService';
import type { IAuthSessionRepository } from '../repository/IAuthSessionRepository';
import type { RegisterDeviceResult, SignInResult } from '../../types';
import type { RegisterDeviceUseCase } from './RegisterDeviceUseCase';
import type { SyncAccountProfileUseCase } from './SyncAccountProfileUseCase';
import type { BindEntitlementToAccountUseCase } from './BindEntitlementToAccountUseCase';
import { isConclusiveRegistration } from '../../core/account/deviceLimit';

export class SignInWithGoogleUseCase {
  constructor(
    private readonly authService: IAuthService,
    private readonly authSession: IAuthSessionRepository,
    private readonly syncAccountProfile: SyncAccountProfileUseCase,
    private readonly registerDevice: RegisterDeviceUseCase,
    private readonly bindEntitlement: BindEntitlementToAccountUseCase,
    private readonly onError?: (error: unknown, context: string) => void,
    private readonly onDeviceAccessChanged?: () => void
  ) {}

  async execute(): Promise<SignInResult> {
    const user = await this.authService.signInWithGoogle();
    this.authSession.setUid(user.uid);
    this.authSession.setEmail(user.email);

    try {
      await this.syncAccountProfile.execute(user.uid);
    } catch (e) {
      this.onError?.(e, 'SignInWithGoogleUseCase.syncAccountProfile');
    }

    let registration: RegisterDeviceResult | null = null;
    try {
      registration = await this.registerDevice.execute(user.uid);
    } catch (e) {
      this.onError?.(e, 'SignInWithGoogleUseCase.registerDevice');
    }

    /**
     * Keep the previous devicePremiumAllowed value unless the account actually
     * answered. A failed read is not a full account, and stripping premium on a
     * network error would punish a paying user.
     */
    if (registration && isConclusiveRegistration(registration)) {
      this.authSession.setDevicePremiumAllowed(registration.registered);
      this.onDeviceAccessChanged?.();
    }

    if (registration?.registered) {
      try {
        await this.bindEntitlement.execute(user.uid);
      } catch (e) {
        this.onError?.(e, 'SignInWithGoogleUseCase.bindEntitlement');
      }
    }

    return {
      user,
      deviceRegistered: registration?.registered ?? false,
      deviceLimitReached: registration?.reason === 'limit_reached',
    };
  }
}
