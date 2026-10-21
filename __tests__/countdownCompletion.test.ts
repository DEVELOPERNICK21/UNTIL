import { CheckCountdownCompletionUseCase } from '../src/features/countdowns/domain/useCases/CheckCountdownCompletionUseCase';
import type { Countdown } from '../src/shared/types';

const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    '0',
  )}-${String(d.getDate()).padStart(2, '0')}`;
};
const daysFromToday = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    '0',
  )}-${String(d.getDate()).padStart(2, '0')}`;
};

function setup(countdown: Countdown | null, firedFor: string | null = null) {
  const signals = {
    clearCountdownCompletedFired: jest.fn(),
    getCountdownCompletedFiredId: jest.fn(() => firedFor),
    setCountdownCompletedFired: jest.fn(),
    scheduleSharePrompt: jest.fn(),
    scheduleReviewPrompt: jest.fn(),
  };
  const onCompleted = jest.fn();
  const useCase = new CheckCountdownCompletionUseCase(
    {
      getAll: () => (countdown ? [countdown] : []),
      add: jest.fn(),
      remove: jest.fn(),
      subscribe: jest.fn(),
    } as never,
    signals as never,
    onCompleted,
  );
  return { useCase, signals, onCompleted };
}

const deadline = (over: Partial<Countdown>): Countdown => ({
  id: 'c1',
  title: 'Launch',
  date: todayKey(),
  createdAt: daysFromToday(-10),
  ...over,
});

describe('CheckCountdownCompletionUseCase', () => {
  it('celebrates on the day a countdown that had days to run reaches today', () => {
    const { useCase, signals, onCompleted } = setup(deadline({}));
    useCase.execute();
    expect(onCompleted).toHaveBeenCalledWith({
      countdown_id: 'c1',
      days_used: 10,
    });
    expect(signals.scheduleSharePrompt).toHaveBeenCalledTimes(1);
    expect(signals.scheduleReviewPrompt).toHaveBeenCalledTimes(1);
  });

  it('celebrates only once per countdown', () => {
    const { useCase, onCompleted } = setup(deadline({}), 'c1');
    useCase.execute();
    expect(onCompleted).not.toHaveBeenCalled();
  });

  it('does not celebrate a deadline that is still ahead', () => {
    const { useCase, onCompleted } = setup(
      deadline({ date: daysFromToday(3) }),
    );
    useCase.execute();
    expect(onCompleted).not.toHaveBeenCalled();
  });

  it('does not say "reached today" for a deadline that passed days ago', () => {
    const { useCase, signals, onCompleted } = setup(
      deadline({ date: daysFromToday(-4) }),
    );
    useCase.execute();
    expect(onCompleted).not.toHaveBeenCalled();
    expect(signals.scheduleSharePrompt).not.toHaveBeenCalled();
  });

  it('does not celebrate a deadline that was created for today', () => {
    const { useCase, onCompleted, signals } = setup(
      deadline({ createdAt: todayKey() }),
    );
    useCase.execute();
    expect(onCompleted).not.toHaveBeenCalled();
    expect(signals.scheduleReviewPrompt).not.toHaveBeenCalled();
  });

  it('does nothing without a deadline', () => {
    const { useCase, onCompleted } = setup(null);
    useCase.execute();
    expect(onCompleted).not.toHaveBeenCalled();
  });
});
