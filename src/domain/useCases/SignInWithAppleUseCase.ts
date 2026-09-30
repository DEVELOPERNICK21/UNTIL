/**
 * SignInWithAppleUseCase — Apple credential (iOS), then shared account sync.
 * First Apple sign-in creates the Firebase account, so the age gate runs first.
 */

import type { IAuthService } from '../ports/IAuthService';
import type { SignInResult } from '../../types';
import type { CompleteAccountSignInUseCase } from './CompleteAccountSignInUseCase';
import type {
  AgeConfirmation,
  AssertAccountAgeGateUseCase,
} from './AssertAccountAgeGateUseCase';

export class SignInWithAppleUseCase {
  constructor(
    private readonly authService: IAuthService,
    private readonly completeSignIn: CompleteAccountSignInUseCase,
    private readonly ageGate: AssertAccountAgeGateUseCase
  ) {}

  async execute(confirmation: AgeConfirmation): Promise<SignInResult> {
    this.ageGate.execute(confirmation);
    const user = await this.authService.signInWithApple();
    return this.completeSignIn.execute(user);
  }
}
