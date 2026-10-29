const mockStore = new Map<string, string>();
jest.mock('../src/shared/persistence/mmkv', () => ({
  getString: (key: string) => mockStore.get(key),
  setString: (key: string, value: string) => void mockStore.set(key, value),
}));
let mockId = 0;
jest.mock('../src/shared/utils/randomId', () => ({
  randomId: () => `id-${++mockId}`,
}));

import { MmkvCustomCounterRepository } from '../src/features/counters/data/MmkvCustomCounterRepository';
import { MAX_TITLE_LENGTH } from '../src/config/inputLimits';
import { STORAGE_KEYS } from '../src/shared/persistence/schema';

const read = () =>
  JSON.parse(mockStore.get(STORAGE_KEYS.CUSTOM_COUNTERS) ?? '[]');

describe('MmkvCustomCounterRepository', () => {
  let repo: MmkvCustomCounterRepository;
  beforeEach(() => {
    mockStore.clear();
    mockId = 0;
    repo = new MmkvCustomCounterRepository();
  });

  it('counts up one at a time', () => {
    const c = repo.add('Water');
    repo.increment(c.id);
    repo.increment(c.id);
    repo.increment(c.id);
    expect(read()[0].count).toBe(3);
  });

  it('lets a mis-tap be undone, and never goes below zero', () => {
    const c = repo.add('Water');
    repo.increment(c.id);
    repo.increment(c.id);
    repo.decrement(c.id);
    expect(read()[0].count).toBe(1);
    repo.decrement(c.id);
    repo.decrement(c.id);
    repo.decrement(c.id);
    expect(read()[0].count).toBe(0);
  });

  it('resets to zero and keeps the counter and its title', () => {
    const c = repo.add('Water');
    for (let i = 0; i < 5; i += 1) repo.increment(c.id);
    repo.reset(c.id);
    expect(read()).toEqual([{ id: c.id, title: 'Water', count: 0 }]);
  });

  it('ignores an id that is not there', () => {
    repo.add('Water');
    repo.increment('nope');
    repo.decrement('nope');
    repo.reset('nope');
    expect(read()[0].count).toBe(0);
  });

  it('recovers from a count that is not a sane number instead of showing NaN', () => {
    mockStore.set(
      STORAGE_KEYS.CUSTOM_COUNTERS,
      JSON.stringify([{ id: 'x', title: 'Odd', count: null }]),
    );
    repo.increment('x');
    expect(read()[0].count).toBe(1);

    mockStore.set(
      STORAGE_KEYS.CUSTOM_COUNTERS,
      JSON.stringify([{ id: 'x', title: 'Odd', count: -7 }]),
    );
    repo.increment('x');
    expect(read()[0].count).toBe(1);

    mockStore.set(
      STORAGE_KEYS.CUSTOM_COUNTERS,
      JSON.stringify([{ id: 'x', title: 'Odd', count: 2.9 }]),
    );
    repo.decrement('x');
    expect(read()[0].count).toBe(1);
  });

  it('shortens a very long title and falls back to "Counter" for a blank one', () => {
    const long = repo.add('W'.repeat(200));
    expect(long.title).toHaveLength(MAX_TITLE_LENGTH);
    expect(repo.add('   ').title).toBe('Counter');
  });

  it('keeps every counter it is given, in the order they were added', () => {
    repo.add('First');
    repo.add('Second');
    expect(read().map((c: { title: string }) => c.title)).toEqual(['First', 'Second']);
  });

  it('moves a counter to the front so the widget shows it, keeping the others in order', () => {
    const a = repo.add('A');
    repo.add('B');
    const c = repo.add('C');
    repo.moveToFront(c.id);
    expect(read().map((x: { title: string }) => x.title)).toEqual(['C', 'A', 'B']);
    repo.moveToFront(a.id);
    expect(read().map((x: { title: string }) => x.title)).toEqual(['A', 'C', 'B']);
  });

  it('leaves the order alone for the counter already in front, or one that is not there', () => {
    const a = repo.add('A');
    repo.add('B');
    const listener = jest.fn();
    repo.subscribe(listener);
    repo.moveToFront(a.id);
    repo.moveToFront('nope');
    expect(read().map((x: { title: string }) => x.title)).toEqual(['A', 'B']);
    expect(listener).not.toHaveBeenCalled();
  });

  it('tells subscribers about every change', () => {
    const listener = jest.fn();
    repo.subscribe(listener);
    const c = repo.add('Water');
    repo.increment(c.id);
    repo.decrement(c.id);
    repo.reset(c.id);
    repo.remove(c.id);
    expect(listener).toHaveBeenCalledTimes(5);
  });
});
