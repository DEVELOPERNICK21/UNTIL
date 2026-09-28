/**
 * SignInWithGoogleUseCase — Google credential, then shared account sync.
 * First Google sign-in creates the Firebase account, so the age gate runs first.
 */

import type { IAuthService } from '../ports/IAuthService';
import type { SignInResult } from '../../types';
import type { CompleteAccountSignInUseCase } from './CompleteAccountSignInUseCase';
import type {
  AgeConfirmation,
  AssertAccountAgeGateUseCase,
} from './AssertAccountAgeGateUseCase';

export class SignInWithGoogleUseCase {
  constructor(
    private readonly authService: IAuthService,
    private readonly completeSignIn: CompleteAccountSignInUseCase,
    private readonly ageGate: AssertAccountAgeGateUseCase
  ) {}

  async execute(confirmation: AgeConfirmation): Promise<SignInResult> {
    this.ageGate.execute(confirmation);
    const user = await this.authService.signInWithGoogle();
    return this.completeSignIn.execute(user);
  }
}
