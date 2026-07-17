import type { IStudentVerificationRepository } from '../../domain/repository/IStudentVerificationRepository';
import { getString, setString, getNumber, setNumber, remove } from '../../persistence/mmkv';
import { STORAGE_KEYS } from '../../persistence/schema';

export class MmkvStudentVerificationRepository
  implements IStudentVerificationRepository
{
  getVerifiedEmail(): string | null {
    return getString(STORAGE_KEYS.STUDENT_VERIFIED_EMAIL) ?? null;
  }

  getVerifiedAt(): number | null {
    return getNumber(STORAGE_KEYS.STUDENT_VERIFIED_AT) ?? null;
  }

  setVerified(email: string, atMs: number): void {
    setString(STORAGE_KEYS.STUDENT_VERIFIED_EMAIL, email);
    setNumber(STORAGE_KEYS.STUDENT_VERIFIED_AT, atMs);
  }

  clear(): void {
    remove(STORAGE_KEYS.STUDENT_VERIFIED_EMAIL);
    remove(STORAGE_KEYS.STUDENT_VERIFIED_AT);
  }
}
