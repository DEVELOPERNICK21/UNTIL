import { SendPasswordResetUseCase } from '../src/features/account/domain/useCases/SendPasswordResetUseCase';
import type { IAuthService } from '../src/features/account/domain/ports/IAuthService';

function makeUseCase() {
  const sendPasswordReset = jest.fn().mockResolvedValue(undefined);
  const auth = { sendPasswordReset } as unknown as IAuthService;
  return { useCase: new SendPasswordResetUseCase(auth), sendPasswordReset };
}

describe('SendPasswordResetUseCase', () => {
  it('asks the auth service to email a reset link', async () => {
    const { useCase, sendPasswordReset } = makeUseCase();
    await useCase.execute('  nick@example.com ');
    expect(sendPasswordReset).toHaveBeenCalledWith('nick@example.com');
  });

  it('asks for an email when there is none', async () => {
    const { useCase, sendPasswordReset } = makeUseCase();
    await expect(useCase.execute('   ')).rejects.toThrow('Enter your email first.');
    expect(sendPasswordReset).not.toHaveBeenCalled();
  });

  it('rejects something that is not an email address', async () => {
    const { useCase, sendPasswordReset } = makeUseCase();
    await expect(useCase.execute('nick@')).rejects.toThrow('Enter a valid email address.');
    await expect(useCase.execute('not an email')).rejects.toThrow('Enter a valid email address.');
    expect(sendPasswordReset).not.toHaveBeenCalled();
  });

  it('passes on a failure from the auth service', async () => {
    const { useCase, sendPasswordReset } = makeUseCase();
    sendPasswordReset.mockRejectedValue(new Error('Network error. Check your connection.'));
    await expect(useCase.execute('a@b.co')).rejects.toThrow('Network error');
  });
});
