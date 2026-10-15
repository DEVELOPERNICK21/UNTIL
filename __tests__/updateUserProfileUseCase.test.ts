import { UpdateUserProfileUseCase } from '../src/features/time/domain/useCases/UpdateUserProfileUseCase';
import type { ITimeRepository } from '../src/features/time/domain/ports/TimeRepository';

function fakes(uid: string | null, upsert: jest.Mock) {
  const repository = { setUserProfile: jest.fn() } as unknown as ITimeRepository;
  const useCase = new UpdateUserProfileUseCase(repository, { upsertProfile: upsert }, () => uid);
  return { repository, useCase };
}

describe('UpdateUserProfileUseCase', () => {
  it('saves on the phone and pushes to the account when signed in', () => {
    const upsert = jest.fn().mockResolvedValue(undefined);
    const { repository, useCase } = fakes('user-1', upsert);
    useCase.execute('1990-05-01', 82);
    expect(repository.setUserProfile).toHaveBeenCalledWith('1990-05-01', 82);
    expect(upsert).toHaveBeenCalledWith('user-1', { birthDate: '1990-05-01', deathAge: 82 });
  });

  it('only saves on the phone when signed out', () => {
    const upsert = jest.fn();
    const { repository, useCase } = fakes(null, upsert);
    useCase.execute('1990-05-01', 80);
    expect(repository.setUserProfile).toHaveBeenCalledWith('1990-05-01', 80);
    expect(upsert).not.toHaveBeenCalled();
  });

  it('still works with no cloud store at all', () => {
    const repository = { setUserProfile: jest.fn() } as unknown as ITimeRepository;
    expect(() => new UpdateUserProfileUseCase(repository).execute('1990-05-01', 80)).not.toThrow();
    expect(repository.setUserProfile).toHaveBeenCalled();
  });

  it('does not wait for, or fail on, a network error', async () => {
    const upsert = jest.fn().mockRejectedValue(new Error('offline'));
    const { repository, useCase } = fakes('user-1', upsert);
    expect(() => useCase.execute('1990-05-01', 80)).not.toThrow();
    await Promise.resolve();
    expect(repository.setUserProfile).toHaveBeenCalledWith('1990-05-01', 80);
  });
});
