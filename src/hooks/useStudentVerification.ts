import { useCallback, useState } from 'react';
import { verifyStudentEmailUseCase } from '../di';

export function useStudentVerification() {
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(() =>
    verifyStudentEmailUseCase.getVerifiedEmail()
  );

  const refresh = useCallback(() => {
    setVerifiedEmail(verifyStudentEmailUseCase.getVerifiedEmail());
  }, []);

  /** Fresh read for use inside callbacks, where `isVerified` may be stale. */
  const checkVerified = useCallback(
    () => verifyStudentEmailUseCase.isVerified(),
    []
  );

  const verify = useCallback((email: string) => {
    const result = verifyStudentEmailUseCase.verify(email);
    if (result.ok) {
      setVerifiedEmail(verifyStudentEmailUseCase.getVerifiedEmail());
    }
    return result;
  }, []);

  return {
    isVerified: verifiedEmail != null,
    verifiedEmail,
    verify,
    refresh,
    checkVerified,
  };
}
