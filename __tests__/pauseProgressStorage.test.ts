/**
 * Recording a finished practice, and keeping it on the phone. Reads are tolerant: a damaged value is an
 * empty start, never a crash on the Pause screen.
 */

const mockStore = new Map<string, string>();
jest.mock('../src/shared/persistence/mmkv', () => ({
  getString: (key: string) => mockStore.get(key),
  setString: (key: string, value: string) => {
    mockStore.set(key, value);
  },
}));

import { MmkvPauseProgressRepository } from '../src/features/pause/data/MmkvPauseProgressRepository';
import { GetPauseProgressUseCase } from '../src/features/pause/domain/useCases/GetPauseProgressUseCase';
import { RecordPauseSessionUseCase } from '../src/features/pause/domain/useCases/RecordPauseSessionUseCase';
import { EMPTY_PROGRESS, DAILY_GOAL_SECONDS } from '../src/features/pause/domain/pauseProgress';
import { STORAGE_KEYS } from '../src/shared/persistence/schema';

const repo = new MmkvPauseProgressRepository();
const record = new RecordPauseSessionUseCase(repo);
const get = new GetPauseProgressUseCase(repo);
const base = { practice: 'sigh' as const, date: '2026-11-23', hour: 14 };

beforeEach(() => mockStore.clear());

describe('MmkvPauseProgressRepository', () => {
  it('starts empty', () => {
    expect(get.execute()).toEqual(EMPTY_PROGRESS);
  });

  it('saves and loads what a session added', () => {
    record.execute({ ...base, seconds: 90 });
    expect(get.execute()).toMatchObject({ totalSeconds: 90, sessions: 1, days: { '2026-11-23': 90 } });
  });

  it('stores under one key, as text', () => {
    record.execute({ ...base, seconds: 60 });
    expect(typeof mockStore.get(STORAGE_KEYS.PAUSE_PROGRESS)).toBe('string');
    expect([...mockStore.keys()]).toEqual([STORAGE_KEYS.PAUSE_PROGRESS]);
  });

  it.each(['not json', '{"days":', '[1,2,3]', 'null', '"text"'])('treats the damaged value %p as an empty start', bad => {
    mockStore.set(STORAGE_KEYS.PAUSE_PROGRESS, bad);
    expect(get.execute()).toEqual(EMPTY_PROGRESS);
    expect(() => record.execute({ ...base, seconds: 60 })).not.toThrow();
  });

  it('writes only counts: no feelings, no picks, no task names', () => {
    record.execute({ ...base, seconds: 60 });
    const text = mockStore.get(STORAGE_KEYS.PAUSE_PROGRESS) as string;
    expect(Object.keys(JSON.parse(text)).sort()).toEqual(['days', 'earned', 'sessions', 'totalSeconds', 'tried']);
  });
});

describe('RecordPauseSessionUseCase', () => {
  it('says how much counted and what it unlocked', () => {
    const r = record.execute({ ...base, seconds: 90 });
    expect(r.gainedSeconds).toBe(90);
    expect(r.milestones).toEqual(['first']);
    expect(r.leveledUp).toBe(false);
    expect(r.goalReachedNow).toBe(false);
  });

  it('saves nothing, and unlocks nothing, for a session too short to count', () => {
    const r = record.execute({ ...base, seconds: 5 });
    expect(r).toMatchObject({ gainedSeconds: 0, milestones: [], leveledUp: false, goalReachedNow: false });
    expect(mockStore.size).toBe(0);
  });

  it('reports the level up exactly once, when the total crosses the line', () => {
    record.execute({ ...base, seconds: 540 });
    const up = record.execute({ ...base, seconds: 120 });
    expect(up.leveledUp).toBe(true);
    expect(record.execute({ ...base, seconds: 60 }).leveledUp).toBe(false);
  });

  it('reports the daily goal exactly once, on the session that reaches it', () => {
    const first = record.execute({ ...base, seconds: DAILY_GOAL_SECONDS - 90 });
    expect(first.goalReachedNow).toBe(false);
    expect(record.execute({ ...base, seconds: 60 }).goalReachedNow).toBe(true);
    expect(record.execute({ ...base, seconds: 60 }).goalReachedNow).toBe(false);
  });

  it('reaches the goal when the minutes shown reach it, so the number and the ring agree', () => {
    expect(record.execute({ ...base, seconds: 149 }).goalReachedNow).toBe(false);
    expect(record.execute({ ...base, seconds: 1 + 20 }).goalReachedNow).toBe(true);
  });

  it('reaches the goal again the next day', () => {
    record.execute({ ...base, seconds: DAILY_GOAL_SECONDS });
    expect(record.execute({ ...base, date: '2026-11-24', seconds: DAILY_GOAL_SECONDS }).goalReachedNow).toBe(true);
  });
});
