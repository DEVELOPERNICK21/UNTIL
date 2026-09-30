import {
  ageInWholeYears,
  evaluateAccountAgeGate,
  isUnderMinimumAge,
} from '../src/core/legal/ageGate';
import { AssertAccountAgeGateUseCase } from '../src/domain/useCases/AssertAccountAgeGateUseCase';
import { SignInWithAppleUseCase } from '../src/domain/useCases/SignInWithAppleUseCase';
import { SignInWithGoogleUseCase } from '../src/domain/useCases/SignInWithGoogleUseCase';
import { CreateAccountWithEmailUseCase } from '../src/domain/useCases/CreateAccountWithEmailUseCase';
import { VerifyStudentEmailUseCase } from '../src/domain/useCases/VerifyStudentEmailUseCase';
import { AgeGateError } from '../src/domain/errors/ageGateErrors';
import type { CompleteAccountSignInUseCase } from '../src/domain/useCases/CompleteAccountSignInUseCase';
import type { IAuthService } from '../src/domain/ports/IAuthService';

const NOW = new Date(2026, 8, 28);

describe('ageGate core', () => {
  it('computes whole years around the birthday', () => {
    expect(ageInWholeYears('2013-09-28', NOW)).toBe(13);
    expect(ageInWholeYears('2013-09-29', NOW)).toBe(12);
    expect(ageInWholeYears('not-a-date', NOW)).toBeNull();
  });

  it('treats a missing birth date as unknown, not under age', () => {
    expect(isUnderMinimumAge(null, NOW)).toBe(false);
  });

  it('blocks a known under-13 birth date even when the box is ticked', () => {
    expect(
      evaluateAccountAgeGate({
        birthDate: '2015-01-01',
        confirmedMinimumAge: true,
        now: NOW,
      })
    ).toBe('under_minimum_age');
  });

  it('requires the explicit 13+ confirmation', () => {
    expect(
      evaluateAccountAgeGate({
        birthDate: '1990-01-01',
        confirmedMinimumAge: false,
        now: NOW,
      })
    ).toBe('confirmation_required');
  });
});

function makeGate(birthDate: string | null, lockedOut = false) {
  const lockout = { locked: lockedOut };
  const gate = new AssertAccountAgeGateUseCase(
    { getUserProfile: () => ({ birthDate, deathAge: 80 }) },
    {
      isLockedOut: () => lockout.locked,
      lockOut: () => {
        lockout.locked = true;
      },
    },
    () => NOW
  );
  return { gate, lockout };
}

function makeAuthSpy() {
  const calls: string[] = [];
  const user = { uid: 'u', email: 'a@b.com', displayName: null, providers: [] };
  const auth = {
    signInWithApple: async () => {
      calls.push('apple');
      return user;
    },
    signInWithGoogle: async () => {
      calls.push('google');
      return user;
    },
    createAccountWithEmail: async () => {
      calls.push('create');
      return user;
    },
  } as unknown as IAuthService;
  const complete = {
    execute: async () => ({
      user,
      deviceRegistered: true,
      deviceLimitReached: false,
    }),
  } as unknown as CompleteAccountSignInUseCase;
  return { auth, complete, calls };
}

describe('account creation is refused before any provider call', () => {
  it('Google: under 13 never reaches Firebase and locks out', async () => {
    const { gate, lockout } = makeGate('2016-05-05');
    const { auth, complete, calls } = makeAuthSpy();
    const useCase = new SignInWithGoogleUseCase(auth, complete, gate);

    await expect(useCase.execute({ confirmedMinimumAge: true })).rejects.toBeInstanceOf(
      AgeGateError
    );
    expect(calls).toEqual([]);
    expect(lockout.locked).toBe(true);
  });

  it('Apple: under 13 never reaches Apple or Firebase', async () => {
    const { gate, lockout } = makeGate('2016-05-05');
    const { auth, complete, calls } = makeAuthSpy();
    const useCase = new SignInWithAppleUseCase(auth, complete, gate);

    await expect(useCase.execute({ confirmedMinimumAge: true })).rejects.toBeInstanceOf(
      AgeGateError
    );
    expect(calls).toEqual([]);
    expect(lockout.locked).toBe(true);
  });

  it('Apple: adult with confirmation proceeds', async () => {
    const { gate } = makeGate('1990-01-01');
    const { auth, complete, calls } = makeAuthSpy();
    const useCase = new SignInWithAppleUseCase(auth, complete, gate);

    await useCase.execute({ confirmedMinimumAge: true });
    expect(calls).toEqual(['apple']);
  });

  it('Email: unconfirmed age never reaches Firebase', async () => {
    const { gate } = makeGate('1990-01-01');
    const { auth, complete, calls } = makeAuthSpy();
    const useCase = new CreateAccountWithEmailUseCase(auth, complete, gate);

    await expect(
      useCase.execute('a@b.com', 'secret1', { confirmedMinimumAge: false })
    ).rejects.toBeInstanceOf(AgeGateError);
    expect(calls).toEqual([]);
  });

  it('a previous under-13 answer keeps the gate closed after the DOB changes', async () => {
    const { gate } = makeGate('1990-01-01', true);
    const { auth, complete, calls } = makeAuthSpy();
    const useCase = new SignInWithGoogleUseCase(auth, complete, gate);

    await expect(useCase.execute({ confirmedMinimumAge: true })).rejects.toBeInstanceOf(
      AgeGateError
    );
    expect(calls).toEqual([]);
  });

  it('adult with confirmation proceeds', async () => {
    const { gate } = makeGate('1990-01-01');
    const { auth, complete, calls } = makeAuthSpy();
    const useCase = new SignInWithGoogleUseCase(auth, complete, gate);

    await useCase.execute({ confirmedMinimumAge: true });
    expect(calls).toEqual(['google']);
  });
});

describe('student email collection', () => {
  it('does not store the email when the age gate fails', () => {
    const { gate } = makeGate('2016-05-05');
    const stored: string[] = [];
    const useCase = new VerifyStudentEmailUseCase(
      {
        getVerifiedEmail: () => null,
        setVerified: (email: string) => {
          stored.push(email);
        },
      } as never,
      gate
    );

    const result = useCase.verify('kid@school.edu', { confirmedMinimumAge: true });
    expect(result).toEqual({ ok: false, reason: 'under_minimum_age' });
    expect(stored).toEqual([]);
  });
});
