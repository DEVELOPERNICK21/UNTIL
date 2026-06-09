import {
  buildRetentionNotification,
  buildRetentionNotificationSchedule,
  getLocalDateKey,
  shouldSkipRetentionNotification,
} from '../src/domain/notifications/retentionNotificationCopy';

describe('retentionNotificationCopy', () => {
  it('uses week-start language on Monday', () => {
    const copy = buildRetentionNotification({
      date: new Date(2026, 4, 25, 8, 0, 0), // Monday
      yearProgress: 0.41,
    });

    expect(copy?.body).toContain('week starts now');
    expect(copy?.body).toContain('0%');
  });

  it('uses week progress on Tuesday', () => {
    const copy = buildRetentionNotification({
      date: new Date(2026, 4, 26, 8, 0, 0), // Tuesday
      yearProgress: 0.41,
    });

    expect(copy?.body).toContain('29%');
    expect(copy?.body).toContain('week is behind you');
  });

  it('returns no notification on Saturday', () => {
    const copy = buildRetentionNotification({
      date: new Date(2026, 4, 30, 8, 0, 0), // Saturday
      yearProgress: 0.41,
    });

    expect(copy).toBeNull();
  });

  it('uses Sunday weekly reflection copy', () => {
    const copy = buildRetentionNotification({
      date: new Date(2026, 4, 31, 9, 0, 0), // Sunday
      yearProgress: 0.41,
      lifeWeeksLived: 1600,
    });

    expect(copy?.body).toContain('Another week');
    expect(copy?.body).toContain('1,600 weeks');
  });

  it('disabled setting prevents scheduling', () => {
    const schedule = buildRetentionNotificationSchedule({
      now: new Date(2026, 4, 25, 6, 0, 0),
      enabled: false,
      yearProgress: 0.41,
    });

    expect(schedule).toEqual([]);
  });

  it('skips same-day morning notification after a 7 AM app open', () => {
    const today = getLocalDateKey(new Date(2026, 4, 25, 7, 30, 0));
    expect(
      shouldSkipRetentionNotification({
        triggerAt: new Date(2026, 4, 25, 8, 0, 0),
        lastAppOpenDateKey: today,
        lastAppOpenHour: 7,
      })
    ).toBe(true);
  });

  it('schedules at most one notification per day', () => {
    const schedule = buildRetentionNotificationSchedule({
      now: new Date(2026, 4, 25, 6, 0, 0),
      enabled: true,
      yearProgress: 0.41,
    });
    const uniqueDays = new Set(schedule.map(item => getLocalDateKey(item.triggerAt)));

    expect(schedule.length).toBe(uniqueDays.size);
    expect(schedule.some(item => item.triggerAt.getDay() === 6)).toBe(false);
  });
});
