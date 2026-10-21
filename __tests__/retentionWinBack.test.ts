import {
  WIN_BACK_AFTER_DAYS,
  WIN_BACK_GIVE_UP_AFTER_DAYS,
  buildRetentionNotificationSchedule,
  buildWinBackNotification,
  daysBetweenDateKeys,
} from '../src/features/engagement/domain/retentionNotificationCopy';

describe('daysBetweenDateKeys', () => {
  it('counts whole local days, across month ends', () => {
    expect(daysBetweenDateKeys('2026-05-25', '2026-05-25')).toBe(0);
    expect(daysBetweenDateKeys('2026-05-25', '2026-05-26')).toBe(1);
    expect(daysBetweenDateKeys('2026-05-30', '2026-06-02')).toBe(3);
  });

  it('never goes negative', () => {
    expect(daysBetweenDateKeys('2026-05-30', '2026-05-25')).toBe(0);
  });
});

describe('buildWinBackNotification', () => {
  it('names the days away for a short break, with one fact', () => {
    const copy = buildWinBackNotification(3, 0.41);
    expect(copy.body).toContain('3 days since you looked');
    expect(copy.body).toContain('41%');
  });

  it('says a week went by once it has', () => {
    expect(buildWinBackNotification(8, 0.41).body).toContain(
      'A week of your life went by',
    );
  });
});

describe('retention schedule for someone who stopped opening the app', () => {
  // Monday 25 May 2026, 6 am.
  const now = new Date(2026, 4, 25, 6, 0, 0);
  const schedule = (lastAppOpenDateKey?: string) =>
    buildRetentionNotificationSchedule({
      now,
      enabled: true,
      yearProgress: 0.4,
      lastAppOpenDateKey,
      lastAppOpenHour: 9,
    });

  it('keeps the routine copy for someone who opened yesterday', () => {
    const first = schedule('2026-05-24')[0];
    expect(first.body).toContain('week starts now');
  });

  it('switches to the win-back line from the third day away', () => {
    const items = schedule('2026-05-22');
    expect(WIN_BACK_AFTER_DAYS).toBe(3);
    expect(items[0].body).toContain('3 days since you looked');
  });

  it('stops after two weeks away instead of nagging for ever', () => {
    // Away 15 days on the first trigger day: nothing is scheduled.
    expect(schedule('2026-05-10')).toEqual([]);

    // Away 12 days on the first trigger day: only the days still inside the window are scheduled.
    const items = schedule('2026-05-13');
    expect(items.length).toBeGreaterThan(0);
    for (const item of items) {
      const [y, m, d] = item.dateKey.split('-').map(Number);
      const away = (Date.UTC(y, m - 1, d) - Date.UTC(2026, 4, 13)) / 86_400_000;
      expect(away).toBeLessThanOrEqual(WIN_BACK_GIVE_UP_AFTER_DAYS);
    }
  });

  it('uses routine copy when the last open is unknown', () => {
    expect(schedule(undefined)[0].body).toContain('week starts now');
  });
});
