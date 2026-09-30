import {
  EMPTY_PRESENCE,
  FREEZE_REFILL_EVERY_DAYS,
  recordPresenceDay,
  type PresenceStreakState,
} from '../src/domain/presence/presenceStreak';

function state(patch: Partial<PresenceStreakState>): PresenceStreakState {
  return { ...EMPTY_PRESENCE, ...patch };
}

describe('recordPresenceDay', () => {
  it('starts a streak on the first day', () => {
    const next = recordPresenceDay(EMPTY_PRESENCE, '2026-10-01');
    expect(next).toMatchObject({
      count: 1,
      longest: 1,
      lastDateKey: '2026-10-01',
      noticedToday: true,
    });
  });

  it('is idempotent within the same day', () => {
    const first = recordPresenceDay(EMPTY_PRESENCE, '2026-10-01');
    const again = recordPresenceDay(first, '2026-10-01');
    expect(again.count).toBe(1);
  });

  it('extends the streak on the next day', () => {
    const day1 = recordPresenceDay(EMPTY_PRESENCE, '2026-10-01');
    const day2 = recordPresenceDay(day1, '2026-10-02');
    expect(day2.count).toBe(2);
    expect(day2.longest).toBe(2);
  });

  it('counts across month and year boundaries', () => {
    const dec31 = state({ count: 4, longest: 4, lastDateKey: '2026-12-31' });
    expect(recordPresenceDay(dec31, '2027-01-01').count).toBe(5);
  });

  it('forgives one missed day and spends the freeze', () => {
    const before = state({
      count: 5,
      longest: 5,
      lastDateKey: '2026-10-01',
      freezeAvailable: true,
    });
    const next = recordPresenceDay(before, '2026-10-03');
    expect(next.count).toBe(6);
    expect(next.freezeAvailable).toBe(false);
  });

  it('restarts when the freeze is already spent', () => {
    const before = state({
      count: 5,
      longest: 9,
      lastDateKey: '2026-10-01',
      freezeAvailable: false,
    });
    const next = recordPresenceDay(before, '2026-10-03');
    expect(next.count).toBe(1);
    expect(next.longest).toBe(9);
    expect(next.freezeAvailable).toBe(true);
  });

  it('restarts after a gap longer than one day', () => {
    const before = state({ count: 12, longest: 12, lastDateKey: '2026-10-01' });
    const next = recordPresenceDay(before, '2026-10-06');
    expect(next.count).toBe(1);
    expect(next.longest).toBe(12);
  });

  it('keeps the streak when the local date moves backwards', () => {
    // Flew west: local "today" is before the last counted day.
    const before = state({ count: 8, longest: 8, lastDateKey: '2026-10-02' });
    const next = recordPresenceDay(before, '2026-10-01');
    expect(next.count).toBe(8);
    expect(next.lastDateKey).toBe('2026-10-02');
    expect(next.noticedToday).toBe(true);
  });

  it('keeps counting normally after a backwards move', () => {
    const before = state({ count: 8, longest: 8, lastDateKey: '2026-10-02' });
    const back = recordPresenceDay(before, '2026-10-01');
    expect(recordPresenceDay(back, '2026-10-03').count).toBe(9);
  });

  it('earns a spent freeze back after a full week in a row', () => {
    let s = state({
      count: FREEZE_REFILL_EVERY_DAYS - 1,
      longest: FREEZE_REFILL_EVERY_DAYS - 1,
      lastDateKey: '2026-10-01',
      freezeAvailable: false,
    });
    s = recordPresenceDay(s, '2026-10-02');
    expect(s.count).toBe(FREEZE_REFILL_EVERY_DAYS);
    expect(s.freezeAvailable).toBe(true);
  });

  it('does not refill the freeze on other days', () => {
    const s = recordPresenceDay(
      state({
        count: 2,
        longest: 2,
        lastDateKey: '2026-10-01',
        freezeAvailable: false,
      }),
      '2026-10-02',
    );
    expect(s.count).toBe(3);
    expect(s.freezeAvailable).toBe(false);
  });
});
