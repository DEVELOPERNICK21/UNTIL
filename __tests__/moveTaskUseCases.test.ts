import type { ITaskRepository } from '../src/domain/repository/ITaskRepository';
import type { DailyTask } from '../src/types';
import { applyMoveTask } from '../src/domain/tasks/taskMove';
import { MoveTaskUseCase } from '../src/domain/useCases/MoveTaskUseCase';
import { MoveTasksUseCase } from '../src/domain/useCases/MoveTasksUseCase';

class FakeTaskRepo implements ITaskRepository {
  tasks: DailyTask[] = [];
  getTasksForDay(date: string) {
    return this.tasks.filter(t => t.date === date);
  }
  addTask() {
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
    new MoveTasksUseCase(repo).execute(['1', '2'], '2026-09-10');
    expect(repo.tasks.find(t => t.id === '1')!.date).toBe('2026-09-09'); // skipped
    expect(repo.tasks.find(t => t.id === '2')!.date).toBe('2026-09-10');
  });
});
