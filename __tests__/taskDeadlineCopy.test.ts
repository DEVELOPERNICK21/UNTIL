import {
  buildTaskCompletionCopy,
  buildTaskDeadlineSchedule,
  getWindowDateKeys,
} from '../src/features/engagement/domain/taskDeadlineCopy';

const NOW = new Date(2026, 9, 1, 14, 0, 0); // Thu 1 Oct 2026, 2 PM

describe('getWindowDateKeys', () => {
  it('returns 7 local date keys starting today', () => {
    expect(getWindowDateKeys(NOW)).toEqual([
      '2026-10-01',
      '2026-10-02',
      '2026-10-03',
      '2026-10-04',
      '2026-10-05',
      '2026-10-06',
      '2026-10-07',
    ]);
  });
});

describe('buildTaskDeadlineSchedule: tasks', () => {
  it('schedules one 11 PM reminder for a day with pending tasks', () => {
    const items = buildTaskDeadlineSchedule({
      now: NOW,
      taskCountsByDate: { '2026-10-01': { total: 5, pending: 3 } },
      countdowns: [],
    });

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      id: 'taskdl-tasks-2026-10-01',
      kind: 'tasks_pending',
      dateKey: '2026-10-01',
      title: '1 hour left today',
      body: '3 tasks still open.',
    });
    expect(items[0].triggerAt.getTime()).toBe(
      new Date(2026, 9, 1, 23, 0, 0).getTime()
    );
  });

  it('uses singular copy for one pending task', () => {
    const items = buildTaskDeadlineSchedule({
      now: NOW,
      taskCountsByDate: { '2026-10-01': { total: 1, pending: 1 } },
      countdowns: [],
    });
    expect(items[0].body).toBe('1 task still open.');
  });

  it('sends nothing when all tasks are done or there are none', () => {
    const items = buildTaskDeadlineSchedule({
      now: NOW,
      taskCountsByDate: {
        '2026-10-01': { total: 4, pending: 0 },
        '2026-10-02': { total: 0, pending: 0 },
      },
      countdowns: [],
    });
    expect(items).toEqual([]);
  });

  it('skips today after 11 PM but still schedules tomorrow', () => {
    const items = buildTaskDeadlineSchedule({
      now: new Date(2026, 9, 1, 23, 30, 0),
      taskCountsByDate: {
        '2026-10-01': { total: 2, pending: 2 },
        '2026-10-02': { total: 2, pending: 2 },
      },
      countdowns: [],
    });
    expect(items.map(i => i.id)).toEqual(['taskdl-tasks-2026-10-02']);
  });

  it('ignores days outside the 7 day window', () => {
    const items = buildTaskDeadlineSchedule({
      now: NOW,
      taskCountsByDate: { '2026-10-20': { total: 2, pending: 2 } },
      countdowns: [],
    });
    expect(items).toEqual([]);
  });
});

describe('buildTaskDeadlineSchedule: countdowns', () => {
  const countdown = { id: 'c1', title: 'Launch', date: '2026-10-01' };

  it('schedules only the 11 PM notice when 8 AM has already passed', () => {
    const items = buildTaskDeadlineSchedule({
      now: NOW,
      taskCountsByDate: {},
      countdowns: [countdown],
    });

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      id: 'taskdl-dl-pm-c1-2026-10-01',
      kind: 'deadline_last_hour',
      title: '1 hour left',
      body: 'Launch is due tonight.',
    });
  });

  it('schedules the 8 AM and 11 PM notices before 8 AM', () => {
    const items = buildTaskDeadlineSchedule({
      now: new Date(2026, 9, 1, 6, 0, 0),
      taskCountsByDate: {},
      countdowns: [countdown],
    });

    expect(items.map(i => i.kind)).toEqual([
      'deadline_morning',
      'deadline_last_hour',
    ]);
    expect(items[0]).toMatchObject({
      id: 'taskdl-dl-am-c1-2026-10-01',
      title: 'Due today',
      body: 'Launch is due today.',
    });
    expect(items[0].triggerAt.getHours()).toBe(8);
    expect(items[1].triggerAt.getHours()).toBe(23);
  });

  it('schedules a countdown due tomorrow', () => {
    const items = buildTaskDeadlineSchedule({
      now: NOW,
      taskCountsByDate: {},
      countdowns: [{ ...countdown, date: '2026-10-02' }],
    });
    expect(items.map(i => i.id)).toEqual([
      'taskdl-dl-am-c1-2026-10-02',
      'taskdl-dl-pm-c1-2026-10-02',
    ]);
  });

  it('ignores past, far future, and malformed countdown dates', () => {
    const items = buildTaskDeadlineSchedule({
      now: NOW,
      taskCountsByDate: {},
      countdowns: [
        { id: 'a', title: 'Past', date: '2026-09-30' },
        { id: 'b', title: 'Far', date: '2026-12-25' },
        { id: 'c', title: 'Bad', date: 'next friday' },
      ],
    });
    expect(items).toEqual([]);
  });

  it('gives two countdowns on the same day distinct ids', () => {
    const items = buildTaskDeadlineSchedule({
      now: NOW,
      taskCountsByDate: {},
      countdowns: [
        { id: 'a', title: 'One', date: '2026-10-01' },
        { id: 'b', title: 'Two', date: '2026-10-01' },
      ],
    });
    const ids = items.map(i => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('falls back to "Deadline" for an empty title', () => {
    const items = buildTaskDeadlineSchedule({
      now: NOW,
      taskCountsByDate: {},
      countdowns: [{ id: 'a', title: '  ', date: '2026-10-01' }],
    });
    expect(items[0].body).toBe('Deadline is due tonight.');
  });

  it('returns items sorted by trigger time', () => {
    const items = buildTaskDeadlineSchedule({
      now: new Date(2026, 9, 1, 6, 0, 0),
      taskCountsByDate: { '2026-10-01': { total: 2, pending: 2 } },
      countdowns: [countdown],
    });
    const times = items.map(i => i.triggerAt.getTime());
    expect(times).toEqual([...times].sort((a, b) => a - b));
  });
});

describe('buildTaskCompletionCopy', () => {
  it('uses singular for one task', () => {
    expect(buildTaskCompletionCopy(1)).toEqual({
      title: 'All done',
      body: '1 of 1 task finished today.',
    });
  });

  it('uses plural for many tasks', () => {
    expect(buildTaskCompletionCopy(5)).toEqual({
      title: 'All done',
      body: '5 of 5 tasks finished today.',
    });
  });
});
