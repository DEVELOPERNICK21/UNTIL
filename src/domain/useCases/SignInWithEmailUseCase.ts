/**
 * SignInWithEmailUseCase — email/password sign-in, then shared account sync.
 * Gated too: sign-in writes the profile and device to Firestore.
 */

import type { IAuthService } from '../ports/IAuthService';
import type { SignInResult } from '../../types';
import type { CompleteAccountSignInUseCase } from './CompleteAccountSignInUseCase';
import type {
  AgeConfirmation,
  AssertAccountAgeGateUseCase,
} from './AssertAccountAgeGateUseCase';

export class SignInWithEmailUseCase {
  constructor(
    private readonly authService: IAuthService,
    private readonly completeSignIn: CompleteAccountSignInUseCase,
    private readonly ageGate: AssertAccountAgeGateUseCase
  ) {}

  async execute(
    email: string,
    password: string,
    confirmation: AgeConfirmation
  ): Promise<SignInResult> {
    this.ageGate.execute(confirmation);
    const user = await this.authService.signInWithEmail(email, password);
    return this.completeSignIn.execute(user);
  }
}
