const mockStore = new Map<string, string>();
jest.mock('../src/shared/persistence/mmkv', () => ({
  getString: (key: string) => mockStore.get(key),
  setString: (key: string, value: string) => void mockStore.set(key, value),
}));
let mockId = 0;
jest.mock('../src/shared/utils/randomId', () => ({
  randomId: () => `id-${++mockId}`,
}));

import { MmkvCountdownRepository } from '../src/features/countdowns/data/MmkvCountdownRepository';
import { MAX_TITLE_LENGTH } from '../src/config/inputLimits';
import { STORAGE_KEYS } from '../src/shared/persistence/schema';
import { todayIso } from '../src/shared/time/clock';

describe('MmkvCountdownRepository', () => {
  let repo: MmkvCountdownRepository;
  beforeEach(() => {
    mockStore.clear();
    mockId = 0;
    repo = new MmkvCountdownRepository();
  });

  it('keeps a valid date as it is', () => {
    expect(repo.add('Launch', '2026-12-25').date).toBe('2026-12-25');
  });

  it('never stores a date that is not a real date: it falls back to today', () => {
    for (const bad of ['', 'soon', '2026-02-30', '2026-13-01', '25/12/2026']) {
      expect(repo.add('Launch', bad).date).toBe(todayIso());
    }
  });

  it('shortens a very long title and defaults a blank one', () => {
    expect(repo.add('T'.repeat(300), '2026-12-25').title).toHaveLength(
      MAX_TITLE_LENGTH,
    );
    expect(repo.add('   ', '2026-12-25').title).toBe('Deadline');
  });

  it('drops corrupt entries on read, so they cannot reach the screen as "NaN days"', () => {
    mockStore.set(
      STORAGE_KEYS.COUNTDOWNS,
      JSON.stringify([
        { id: 'a', title: 'Good', date: '2026-12-25' },
        { id: 'b', title: 'Bad date', date: '2026-02-30' },
        { id: 'c', title: 'No date' },
        { title: 'No id', date: '2026-12-25' },
        null,
        'junk',
      ]),
    );
    expect(repo.getAll().map(c => c.id)).toEqual(['a']);
  });

  it('survives a broken file', () => {
    mockStore.set(STORAGE_KEYS.COUNTDOWNS, '{not json');
    expect(repo.getAll()).toEqual([]);
    mockStore.set(STORAGE_KEYS.COUNTDOWNS, '{"a":1}');
    expect(repo.getAll()).toEqual([]);
  });

  it('keeps every deadline it is given, in the order they were added', () => {
    repo.add('First', '2026-12-25');
    repo.add('Second', '2026-12-26');
    expect(repo.getAll().map(c => c.title)).toEqual(['First', 'Second']);
  });
});
