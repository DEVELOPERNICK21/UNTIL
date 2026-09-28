/**
 * COPPA age gate — pure rules shared by account creation and any flow that
 * collects an email. Firestore rules mirror MINIMUM_ACCOUNT_AGE_YEARS; keep
 * them in sync (firestore.rules → isOldEnough).
 */

export const MINIMUM_ACCOUNT_AGE_YEARS = 13;

export type AccountAgeGateResult =
  | 'allowed'
  | 'confirmation_required'
  | 'under_minimum_age';

const BIRTH_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Whole years between `birthDate` (YYYY-MM-DD) and `now`; null if unparseable. */
export function ageInWholeYears(birthDate: string, now: Date): number | null {
  const match = BIRTH_DATE_PATTERN.exec(birthDate.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  let age = now.getFullYear() - year;
  const beforeBirthday =
    now.getMonth() + 1 < month ||
    (now.getMonth() + 1 === month && now.getDate() < day);
  if (beforeBirthday) age -= 1;
  return age;
}

export function isUnderMinimumAge(birthDate: string | null, now: Date): boolean {
  if (!birthDate) return false;
  const age = ageInWholeYears(birthDate, now);
  return age != null && age < MINIMUM_ACCOUNT_AGE_YEARS;
}

/**
 * A known under-13 birth date blocks even when the box is ticked; otherwise the
 * explicit 13+ confirmation is required.
 */
export function evaluateAccountAgeGate(input: {
  birthDate: string | null;
  confirmedMinimumAge: boolean;
  now: Date;
}): AccountAgeGateResult {
  if (isUnderMinimumAge(input.birthDate, input.now)) return 'under_minimum_age';
  if (!input.confirmedMinimumAge) return 'confirmation_required';
  return 'allowed';
}
