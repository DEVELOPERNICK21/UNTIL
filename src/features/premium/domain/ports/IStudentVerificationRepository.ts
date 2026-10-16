export interface IStudentVerificationRepository {
  getVerifiedEmail(): string | null;
  getVerifiedAt(): number | null;
  setVerified(email: string, atMs: number): void;
  clear(): void;
}
