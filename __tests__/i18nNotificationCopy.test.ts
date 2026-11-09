import {
  buildRetentionNotification,
  buildWinBackNotification,
} from '../src/features/engagement/domain/retentionNotificationCopy';
import {
  buildTaskCompletionCopy,
  buildTaskDeadlineSchedule,
} from '../src/features/engagement/domain/taskDeadlineCopy';
import { SUPPORTED_LANGUAGES } from '../src/shared/i18n/languages';
import { setLanguage } from '../src/shared/i18n/translate';
import { wearDayWhisper } from '../src/shared/theme/emotionalCopy';

// 2026-11-02 is a Monday; the other days follow.
const day = (offset: number) => new Date(2026, 10, 2 + offset, 8, 0, 0);

afterEach(() => setLanguage('en'));

describe('retention reminders', () => {
  it('keeps the English wording', () => {
    expect(
      buildRetentionNotification({ date: day(0), yearProgress: 0.8 })?.body,
    ).toBe(
      'Your week starts now. Monday is 0% gone. What will you do with it?',
    );
    expect(
      buildRetentionNotification({
        date: day(6),
        yearProgress: 0.8,
        lifeWeeksLived: 1234,
      })?.body,
    ).toBe(
      'Another week of your life begins tomorrow. You have lived 1,234 weeks. Open UNTIL and see where you stand.',
    );
    expect(
      buildRetentionNotification({ date: day(5), yearProgress: 0.8 }),
    ).toBeNull();
    expect(buildWinBackNotification(4, 0.8).body).toBe(
      '4 days since you looked. Your year is 80% gone. Still here when you are.',
    );
  });

  it('writes a reminder for every day in every language, never an empty or raw key', () => {
    for (const { code } of SUPPORTED_LANGUAGES) {
      setLanguage(code);
      for (let offset = 0; offset < 7; offset += 1) {
        const copy = buildRetentionNotification({
          date: day(offset),
          yearProgress: 0.42,
          lifeWeeksLived: 2000,
        });
        if (offset === 5) {
          expect(copy).toBeNull();
          continue;
        }
        expect(copy?.title).toBe('UNTIL');
        expect(copy?.body).toBeTruthy();
        expect(copy?.body).not.toMatch(/notifications\.|\{\{/);
      }
      expect(buildWinBackNotification(9, 0.42).body).toContain('42');
    }
  });

  it('uses the Russian plural for weeks lived and days away', () => {
    setLanguage('ru');
    expect(
      buildRetentionNotification({
        date: day(6),
        yearProgress: 0.5,
        lifeWeeksLived: 21,
      })?.body,
    ).toContain('21 неделю');
    expect(buildWinBackNotification(5, 0.5).body).toContain('5 дней');
    expect(buildWinBackNotification(3, 0.5).body).toContain('3 дня');
  });
});

describe('task and deadline reminders', () => {
  const now = new Date(2026, 10, 2, 7, 0, 0);
  const input = {
    now,
    daysAhead: 2,
    taskCountsByDate: { '2026-11-02': { total: 3, pending: 2 } },
    countdowns: [{ id: 'c1', title: '', date: '2026-11-02' }],
  };

  it('keeps the English wording, with a default name for an untitled deadline', () => {
    const items = buildTaskDeadlineSchedule(input);
    expect(items.map(item => [item.title, item.body])).toEqual([
      ['Due today', 'Deadline is due today.'],
      ['1 hour left today', '2 tasks still open.'],
      ['1 hour left', 'Deadline is due tonight.'],
    ]);
    expect(buildTaskCompletionCopy(1).body).toBe('1 of 1 task finished today.');
    expect(buildTaskCompletionCopy(4).body).toBe(
      '4 of 4 tasks finished today.',
    );
  });

  it('follows the language', () => {
    setLanguage('de');
    const items = buildTaskDeadlineSchedule(input);
    expect(items.find(item => item.kind === 'tasks_pending')?.body).toBe(
      '2 Aufgaben noch offen.',
    );
    expect(items.find(item => item.kind === 'deadline_morning')?.body).toBe(
      'Frist ist heute fällig.',
    );
    setLanguage('ru');
    expect(buildTaskCompletionCopy(5).body).toBe(
      'Сегодня выполнено 5 задач из 5.',
    );
  });
});

describe('presence whisper', () => {
  it('is translated for every time of day', () => {
    expect(wearDayWhisper(0.05)).toBe('Fresh day');
    setLanguage('fr');
    expect(wearDayWhisper(0.05)).toBe('Journée neuve');
  });
});
