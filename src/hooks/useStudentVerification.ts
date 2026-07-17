import { useCallback, useState } from 'react';
import { verifyStudentEmailUseCase } from '../di';

export function useStudentVerification() {
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(() =>
    verifyStudentEmailUseCase.getVerifiedEmail()
  );

  const refresh = useCallback(() => {
    setVerifiedEmail(verifyStudentEmailUseCase.getVerifiedEmail());
  }, []);

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
  };
}
