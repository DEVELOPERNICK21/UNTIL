/**
 * SignInWithEmailUseCase — email/password sign-in, then shared account sync.
 */

import type { IAuthService } from '../ports/IAuthService';
import type { SignInResult } from '../../types';
import type { CompleteAccountSignInUseCase } from './CompleteAccountSignInUseCase';

export class SignInWithEmailUseCase {
  constructor(
    private readonly authService: IAuthService,
    private readonly completeSignIn: CompleteAccountSignInUseCase
  ) {}

  async execute(email: string, password: string): Promise<SignInResult> {
    const user = await this.authService.signInWithEmail(email, password);
    return this.completeSignIn.execute(user);
  }
}
