import type { CloudUserProfile } from '@until/shared/types';
import {
  evaluateAccountAgeGate,
  isUnderMinimumAge,
  type AccountAgeGateResult,
} from '@until/features/account/domain/ageGate';

/**
 * What the panel shows once Firebase has a user. Firestore rules refuse device
 * writes until the profile has the 13+ confirmation, so a missing confirmation
 * or birth date is collected once before the slot is claimed.
 */
export type AfterSignInStep =
  | { kind: 'under_minimum_age' }
  | { kind: 'setup'; askBirthDate: boolean; askAgeConfirmation: boolean }
  | { kind: 'ready' };

export function nextStepAfterSignIn(
  profile: Pick<CloudUserProfile, 'birthDate' | 'deathAge' | 'minimumAgeConfirmed'> | null,
  now: Date,
): AfterSignInStep {
  const birthDate = profile?.birthDate ?? null;
  if (isUnderMinimumAge(birthDate, now)) return { kind: 'under_minimum_age' };
  const askBirthDate = !birthDate;
  const askAgeConfirmation = profile?.minimumAgeConfirmed !== true;
  if (askBirthDate || askAgeConfirmation) {
    return { kind: 'setup', askBirthDate, askAgeConfirmation };
  }
  return { kind: 'ready' };
}

export function checkSetupForm(
  input: { askBirthDate: boolean; birthDate: string; confirmed: boolean },
  now: Date,
): AccountAgeGateResult | 'birth_date_required' {
  if (input.askBirthDate && !input.birthDate) return 'birth_date_required';
  return evaluateAccountAgeGate({
    birthDate: input.birthDate || null,
    confirmedMinimumAge: input.confirmed,
    now,
  });
}
