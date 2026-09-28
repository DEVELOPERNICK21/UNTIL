import type { ITaskRepository } from '../src/domain/repository/ITaskRepository';
import type { DailyTask } from '../src/types';
import { applyMoveTask } from '../src/domain/tasks/taskMove';
import { GetStoredTasksForDayUseCase } from '../src/domain/useCases/GetStoredTasksForDayUseCase';
import { MoveTaskUseCase } from '../src/domain/useCases/MoveTaskUseCase';
import { MoveTasksUseCase } from '../src/domain/useCases/MoveTasksUseCase';

class FakeTaskRepo implements ITaskRepository {
  tasks: DailyTask[] = [];
  getTasksForDay(date: string) {
    return this.tasks.filter(t => t.date === date);
  }
  addTask(_task: Omit<DailyTask, 'id' | 'completed'>): DailyTask {
    throw new Error('unused');
  }
  updateTask() {}
  toggleTask() {}
  removeTask(id: string) {
    this.tasks = this.tasks.filter(t => t.id !== id);
  }
  moveTask(id: string, date: string) {
    this.tasks = applyMoveTask(this.tasks, id, date);
  }
  getCarryoverDismissedDate() {
    return null;
  }
  setCarryoverDismissedDate() {}
  subscribe() {
    return () => {};
  }
}

describe('MoveTaskUseCase', () => {
  it('moves a task to the target date', () => {
    const repo = new FakeTaskRepo();
    repo.tasks = [
      {
        id: '1',
        date: '2026-09-09',
        title: 'A',
        category: 'other',
        completed: false,
        order: 1,
      },
    ];
    new MoveTaskUseCase(repo).execute('1', '2026-09-10');
    expect(repo.tasks[0].date).toBe('2026-09-10');
  });
});

describe('MoveTasksUseCase', () => {
  it('moves many and skips goal duplicates', () => {
    const repo = new FakeTaskRepo();
    repo.tasks = [
      {
        id: '1',
        date: '2026-09-09',
        title: 'A',
        category: 'other',
        completed: false,
        sourceGoalId: 'g',
        sourceGoalTaskId: 't',
      },
      {
        id: '2',
        date: '2026-09-09',
        title: 'B',
        category: 'other',
        completed: false,
      },
      {
        id: '3',
        date: '2026-09-10',
        title: 'A',
        category: 'other',
        completed: false,
        sourceGoalId: 'g',
        sourceGoalTaskId: 't',
      },
    ];
    const movedCount = new MoveTasksUseCase(repo).execute(
      ['1', '2'],
      '2026-09-10',
    );
    expect(repo.tasks.find(t => t.id === '1')!.date).toBe('2026-09-09'); // skipped
    expect(repo.tasks.find(t => t.id === '2')!.date).toBe('2026-09-10');
    expect(movedCount).toBe(1);
  });
});

describe('GetStoredTasksForDayUseCase', () => {
  it('reads stored tasks without materializing new tasks', () => {
    const repo = new FakeTaskRepo();
    repo.tasks = [
      {
        id: 'stored',
        date: '2026-09-08',
        title: 'Stored task',
        category: 'other',
        completed: false,
      },
    ];

    expect(new GetStoredTasksForDayUseCase(repo).execute('2026-09-08')).toEqual(
      repo.tasks,
    );
  });
});
