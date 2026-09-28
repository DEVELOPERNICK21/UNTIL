/**
 * DeleteAccountUseCase — remove Firebase Auth user + Firestore users/{uid} tree,
 * then RC logOut + clearLocalSession (keep local progress / local purchase proof).
 */

import type { IAuthService } from '../ports/IAuthService';
import type { IAccountCloudStore } from '../ports/IAccountCloudStore';
import type { ResetPurchasesUserUseCase } from './ResetPurchasesUserUseCase';
import type { SignOutUseCase } from './SignOutUseCase';
import {
  AuthRequiresPasswordError,
  AuthRequiresRecentLoginError,
  isAuthRequiresRecentLoginError,
} from '../errors/authErrors';

export type DeleteAccountOptions = {
  emailPassword?: string;
};

export class DeleteAccountUseCase {
  constructor(
    private readonly auth: IAuthService,
    private readonly cloud: IAccountCloudStore,
    private readonly resetPurchasesUser: ResetPurchasesUserUseCase,
    private readonly signOut: SignOutUseCase,
    private readonly onError?: (error: unknown, context: string) => void
  ) {}

  async execute(options: DeleteAccountOptions = {}): Promise<void> {
    const user = this.auth.getCurrentUser();
    if (!user) {
      throw new Error('Not signed in');
    }
    const uid = user.uid;

    await this.cloud.deleteUserData(uid);

    try {
      await this.auth.deleteAccount();
    } catch (e) {
      if (!isAuthRequiresRecentLoginError(e)) {
        throw e;
      }
      await this.reauthenticateOnce(options.emailPassword);
      await this.cloud.deleteUserData(uid);
      await this.auth.deleteAccount();
    }

    try {
      await this.resetPurchasesUser.execute();
    } catch (e) {
      this.onError?.(e, 'DeleteAccountUseCase.resetPurchases');
    }

    this.signOut.clearLocalSession();
  }

  private async reauthenticateOnce(emailPassword?: string): Promise<void> {
    const user = this.auth.getCurrentUser();
    if (!user) {
      throw new AuthRequiresRecentLoginError();
    }
    if (user.providers.includes('google')) {
      await this.auth.reauthenticateWithGoogle();
      return;
    }
    if (user.providers.includes('password')) {
      if (!emailPassword) {
        throw new AuthRequiresPasswordError();
      }
      await this.auth.reauthenticateWithEmail(emailPassword);
      return;
    }
    throw new AuthRequiresRecentLoginError();
  }
}
