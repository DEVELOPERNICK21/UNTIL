import { EnsureAccountAgeRecordedUseCase } from '../src/features/account/domain/useCases/EnsureAccountAgeRecordedUseCase';
import type { CloudUserProfile } from '../src/shared/types';

const NOW = new Date(2026, 9, 21, 12, 0, 0);

function setup(options: {
  cloudProfile: Partial<CloudUserProfile> | null;
  birthDate: string | null;
  lockedOut?: boolean;
}) {
  const upserts: Array<Partial<CloudUserProfile>> = [];
  const useCase = new EnsureAccountAgeRecordedUseCase(
    {
      getProfile: async () => options.cloudProfile as CloudUserProfile | null,
      upsertProfile: async (_uid, patch) => {
        upserts.push(patch);
      },
    },
    {
      getUserProfile: () =>
        ({ birthDate: options.birthDate ?? '', deathAge: 80 } as never),
    },
    { isLockedOut: () => options.lockedOut === true },
    () => NOW,
  );
  return { useCase, upserts };
}

describe('EnsureAccountAgeRecordedUseCase', () => {
  it('leaves an account alone when the flag is already there', async () => {
    const { useCase, upserts } = setup({
      cloudProfile: { minimumAgeConfirmed: true },
      birthDate: '1990-05-01',
    });
    await expect(useCase.execute('uid')).resolves.toBe('already_recorded');
    expect(upserts).toEqual([]);
  });

  it('records the flag for an older account when the birth date proves 13 or older', async () => {
    const { useCase, upserts } = setup({
      cloudProfile: { birthDate: '1990-05-01' } as Partial<CloudUserProfile>,
      birthDate: '1990-05-01',
    });
    await expect(useCase.execute('uid')).resolves.toBe('recorded');
    expect(upserts).toEqual([
      { minimumAgeConfirmed: true, minimumAgeConfirmedAt: NOW.getTime() },
    ]);
  });

  it('also covers an account with no cloud profile at all', async () => {
    const { useCase, upserts } = setup({
      cloudProfile: null,
      birthDate: '2000-01-01',
    });
    await expect(useCase.execute('uid')).resolves.toBe('recorded');
    expect(upserts).toHaveLength(1);
  });

  it('writes nothing without a birth date: the person must confirm their age themselves', async () => {
    const { useCase, upserts } = setup({ cloudProfile: null, birthDate: null });
    await expect(useCase.execute('uid')).resolves.toBe('needs_confirmation');
    expect(upserts).toEqual([]);
  });

  it('never records an under-13 birth date, or anything once locked out', async () => {
    const under = setup({ cloudProfile: null, birthDate: '2016-01-01' });
    await expect(under.useCase.execute('uid')).resolves.toBe(
      'under_minimum_age',
    );
    expect(under.upserts).toEqual([]);

    const locked = setup({
      cloudProfile: null,
      birthDate: '1990-01-01',
      lockedOut: true,
    });
    await expect(locked.useCase.execute('uid')).resolves.toBe(
      'under_minimum_age',
    );
    expect(locked.upserts).toEqual([]);
  });

  it('counts someone whose 13th birthday has not happened yet as under 13', async () => {
    // Born 22 Oct 2013: still 12 on 21 Oct 2026.
    const { useCase, upserts } = setup({
      cloudProfile: null,
      birthDate: '2013-10-22',
    });
    await expect(useCase.execute('uid')).resolves.toBe('under_minimum_age');
    expect(upserts).toEqual([]);
  });
});
