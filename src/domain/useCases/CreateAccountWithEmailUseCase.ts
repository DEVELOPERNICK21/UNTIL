/**
 * CreateAccountWithEmailUseCase — create email/password user, then sync.
 */

import type { IAuthService } from '../ports/IAuthService';
import type { SignInResult } from '../../types';
import type { CompleteAccountSignInUseCase } from './CompleteAccountSignInUseCase';

export class CreateAccountWithEmailUseCase {
  constructor(
    private readonly authService: IAuthService,
    private readonly completeSignIn: CompleteAccountSignInUseCase
  ) {}

  async execute(email: string, password: string): Promise<SignInResult> {
    const user = await this.authService.createAccountWithEmail(email, password);
    return this.completeSignIn.execute(user);
  }
}
