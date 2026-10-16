import {
  dayAppealMood,
  dayAppealLine,
  formatDayLeftoverLabel,
  presenceStreakDots,
} from '../src/features/presence/domain/dayWidgetAppeal';
import { MmkvTimeRepository } from '../src/features/time/data/MmkvTimeRepository';
import { MmkvPresenceRepository } from '../src/features/presence/data/MmkvPresenceRepository';
import { getNumber, getString } from '../src/shared/persistence/mmkv';
import { STORAGE_KEYS } from '../src/shared/persistence/schema';

jest.mock('../src/shared/persistence/mmkv', () => ({
  getNumber: jest.fn(),
  getString: jest.fn(),
  setNumber: jest.fn(),
  setString: jest.fn(),
}));

jest.mock('../src/shared/time/clock', () => ({
  ...jest.requireActual('../src/shared/time/clock'),
  now: jest.fn(() => new Date(2026, 6, 17, 12, 0, 0)),
}));

const mockGetNumber = getNumber as jest.MockedFunction<typeof getNumber>;
const mockGetString = getString as jest.MockedFunction<typeof getString>;

describe('dayWidgetAppeal', () => {
  it('maps progress bands to calm / mid / urgent', () => {
    expect(dayAppealMood(0.1)).toBe('calm');
    expect(dayAppealMood(0.5)).toBe('mid');
    expect(dayAppealMood(0.9)).toBe('urgent');
  });

  it('uses approved copy', () => {
    expect(dayAppealLine('calm')).toBe('Day still open');
    expect(dayAppealLine('mid')).toBe('Make the hours count');
    expect(dayAppealLine('urgent')).toBe('This day will never repeat.');
  });

  it('formats leftover minutes', () => {
    expect(formatDayLeftoverLabel(6 * 60 + 12)).toBe('6h 12m');
    expect(formatDayLeftoverLabel(45)).toBe('45m');
  });

  it('fills last N streak days ending today when noticed', () => {
    const dots = presenceStreakDots({
      count: 4,
      lastDateKey: '2026-07-17',
      todayKey: '2026-07-17',
      noticedToday: true,
    });
    expect(dots).toEqual([false, false, false, true, true, true, true]);
  });

  it('adds the current presence streak to the widget cache', () => {
    mockGetNumber.mockImplementation((key) =>
      key === STORAGE_KEYS.PRESENCE_STREAK_COUNT ? 4 : undefined,
    );
    mockGetString.mockImplementation((key) =>
      key === STORAGE_KEYS.PRESENCE_STREAK_LAST_DATE ? '2026-07-17' : undefined,
    );

    const cache = new MmkvTimeRepository(new MmkvPresenceRepository()).getWidgetCache();

    expect(cache.presenceStreakCount).toBe(4);
    expect(cache.presenceStreakDots).toEqual([
      false,
      false,
      false,
      true,
      true,
      true,
      true,
    ]);
  });

  it('includes birth date and death age in the widget cache when profile is set', () => {
    mockGetString.mockImplementation((key) =>
      key === STORAGE_KEYS.USER_BIRTH_DATE ? '1990-01-01' : undefined,
    );
    mockGetNumber.mockImplementation((key) =>
      key === STORAGE_KEYS.USER_DEATH_AGE ? 80 : undefined,
    );

    const cache = new MmkvTimeRepository(new MmkvPresenceRepository()).getWidgetCache();

    expect(cache.birthDate).toBe('1990-01-01');
    expect(cache.deathAge).toBe(80);
  });

  it('omits birth date from the widget cache when profile is unset', () => {
    mockGetString.mockReturnValue(undefined);
    mockGetNumber.mockReturnValue(undefined);

    const cache = new MmkvTimeRepository(new MmkvPresenceRepository()).getWidgetCache();

    expect(cache.birthDate).toBeUndefined();
  });
});
