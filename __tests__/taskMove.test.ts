import {
  addDaysIso,
  applyMoveTask,
  isLastHourOfDay,
  shouldSkipMoveForGoalDuplicate,
} from '../src/domain/tasks/taskMove';
import type { DailyTask } from '../src/types';

function task(
  partial: Partial<DailyTask> & Pick<DailyTask, 'id' | 'date'>,
): DailyTask {
  return {
    title: 'T',
    category: 'other',
    completed: false,
    ...partial,
  };
}

describe('taskMove', () => {
  it('addDaysIso adds calendar days in local time', () => {
    expect(addDaysIso('2026-09-09', 1)).toBe('2026-09-10');
    expect(addDaysIso('2026-09-09', -1)).toBe('2026-09-08');
  });

  it('isLastHourOfDay is true after 23:00 local', () => {
    expect(isLastHourOfDay(new Date(2026, 8, 9, 23, 15, 0))).toBe(true);
    expect(isLastHourOfDay(new Date(2026, 8, 9, 22, 0, 0))).toBe(false);
  });

  it('skips move when target already has same goal task', () => {
    const moving = task({
      id: 'a',
      date: '2026-09-09',
      sourceGoalId: 'g1',
      sourceGoalTaskId: 'gt1',
    });
    const target = [
      task({
        id: 'b',
        date: '2026-09-10',
        sourceGoalId: 'g1',
        sourceGoalTaskId: 'gt1',
      }),
    ];
    expect(shouldSkipMoveForGoalDuplicate(moving, target)).toBe(true);
  });

  it('applyMoveTask updates date and appends order', () => {
    const all = [
      task({ id: 'a', date: '2026-09-09', order: 1 }),
      task({ id: 'b', date: '2026-09-10', order: 2 }),
    ];
    const next = applyMoveTask(all, 'a', '2026-09-10');
    const moved = next.find(t => t.id === 'a')!;
    expect(moved.date).toBe('2026-09-10');
    expect(moved.order).toBe(3);
  });

  it('applyMoveTask returns the same reference for a no-op', () => {
    const all = [task({ id: 'a', date: '2026-09-09', order: 1 })];

    expect(applyMoveTask(all, 'a', '2026-09-09')).toBe(all);
  });
});
