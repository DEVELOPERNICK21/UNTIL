import { MmkvBadgeRepository } from '../src/infrastructure/repositories/MmkvBadgeRepository';
import { STORAGE_KEYS } from '../src/persistence/schema';

const mockStore = new Map<string, string>();
jest.mock('../src/persistence/mmkv', () => ({
  getString: (key: string) => mockStore.get(key),
  setString: (key: string, value: string) => {
    mockStore.set(key, value);
  },
}));

describe('MmkvBadgeRepository', () => {
  beforeEach(() => mockStore.clear());

  it('starts empty', () => {
    expect(new MmkvBadgeRepository().getState()).toEqual({
      earned: {},
      seen: [],
      streakCelebratedOn: null,
    });
  });

  it('round trips earned, seen and the streak date', () => {
    const repo = new MmkvBadgeRepository();
    repo.setState({
      earned: { streak_1: '2026-10-01' },
      seen: ['streak_1'],
      streakCelebratedOn: '2026-10-01',
    });
    expect(new MmkvBadgeRepository().getState()).toEqual({
      earned: { streak_1: '2026-10-01' },
      seen: ['streak_1'],
      streakCelebratedOn: '2026-10-01',
    });
  });

  it('notifies subscribers and stops after unsubscribe', () => {
    const repo = new MmkvBadgeRepository();
    const cb = jest.fn();
    const off = repo.subscribe(cb);
    repo.setState({ earned: {}, seen: [], streakCelebratedOn: null });
    off();
    repo.setState({ earned: {}, seen: [], streakCelebratedOn: null });
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('survives corrupt stored data', () => {
    mockStore.set(STORAGE_KEYS.BADGES_STATE, '{not json');
    expect(new MmkvBadgeRepository().getState().earned).toEqual({});
    mockStore.set(
      STORAGE_KEYS.BADGES_STATE,
      JSON.stringify({ earned: { a: 5, b: '2026-01-01' }, seen: [1, 'x'] }),
    );
    const state = new MmkvBadgeRepository().getState();
    expect(state.earned).toEqual({ b: '2026-01-01' });
    expect(state.seen).toEqual(['x']);
  });
});
