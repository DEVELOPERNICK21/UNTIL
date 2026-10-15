/**
 * CompleteDesktopSignInUseCase — after provider auth on Mac / Windows, claim
 * the account's desktop slot and read entitlement. Purchases stay on the phone,
 * so nothing is bound or restored here.
 *
 * `needs_replace` means another desktop holds the slot; the UI asks the user
 * and calls again with `replaceConfirmed`. Cloud failures and the time budget
 * end as `incomplete`: the session exists, the slot is unclaimed.
 */

import type { IAccountCloudStore } from '../ports/IAccountCloudStore';
import type { AccountDevice, AuthUser, CloudEntitlement } from '../../types';
import type { RegisterDeviceUseCase } from './RegisterDeviceUseCase';
import { withTimeout } from '../../core/account/withTimeout';

export const COMPLETE_DESKTOP_SIGN_IN_BUDGET_MS = 12_000;

export type DesktopSignInResult =
  | { status: 'registered'; user: AuthUser; entitlement: CloudEntitlement | null }
  | { status: 'needs_replace'; user: AuthUser; existing: AccountDevice }
  | { status: 'limit_reached'; user: AuthUser }
  | { status: 'incomplete'; user: AuthUser };

export interface DesktopSignInOptions {
  replaceConfirmed?: boolean;
  now?: number;
}

export class CompleteDesktopSignInUseCase {
  constructor(
    private readonly cloud: Pick<IAccountCloudStore, 'getEntitlement'>,
    private readonly registerDevice: RegisterDeviceUseCase,
    private readonly onError?: (error: unknown, context: string) => void
  ) {}

  async execute(
    user: AuthUser,
    options: DesktopSignInOptions = {}
  ): Promise<DesktopSignInResult> {
    try {
      return await withTimeout(
        this.finish(user, options),
        COMPLETE_DESKTOP_SIGN_IN_BUDGET_MS,
        'completeDesktopSignIn'
      );
    } catch (e) {
      this.onError?.(e, 'CompleteDesktopSignInUseCase.budget');
      return { status: 'incomplete', user };
    }
  }

  private async finish(
    user: AuthUser,
    options: DesktopSignInOptions
  ): Promise<DesktopSignInResult> {
    const registration = await this.registerDevice.execute(
      user.uid,
      options.now ?? Date.now(),
      { replaceConfirmed: options.replaceConfirmed }
    );

    if (registration.needsReplace && registration.existing) {
      return { status: 'needs_replace', user, existing: registration.existing };
    }
    if (registration.reason === 'limit_reached') {
      return { status: 'limit_reached', user };
    }
    if (!registration.registered) {
      return { status: 'incomplete', user };
    }

    let entitlement: CloudEntitlement | null = null;
    try {
      entitlement = await this.cloud.getEntitlement(user.uid);
    } catch (e) {
      this.onError?.(e, 'CompleteDesktopSignInUseCase.getEntitlement');
    }
    return { status: 'registered', user, entitlement };
  }
}
