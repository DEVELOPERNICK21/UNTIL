import type { ITaskRepository } from '../repository/ITaskRepository';
import type {
  MonthlyTaskStats,
  DayTaskSummary,
  TaskCategory,
} from '../../types';
import { GetDailyTaskStatsUseCase } from './GetDailyTaskStatsUseCase';

const TASK_CATEGORIES: TaskCategory[] = [
  'health',
  'work',
  'personal_care',
  'learning',
  'other',
];

function dateString(y: number, month: number, day: number): string {
  const m = String(month).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/** Returns stats for the given calendar month (1–12). */
export class GetMonthlyTaskStatsUseCase {
  constructor(
    private readonly taskRepository: ITaskRepository,
    private readonly getDailyTaskStats: GetDailyTaskStatsUseCase
  ) {}

  execute(year: number, month: number): MonthlyTaskStats {
    const byDay: DayTaskSummary[] = [];
    let completed = 0;
    let total = 0;
    const byCategory: MonthlyTaskStats['byCategory'] = {};

    const days = daysInMonth(year, month);
    for (let day = 1; day <= days; day++) {
      const date = dateString(year, month, day);
      const dayStats = this.getDailyTaskStats.execute(date);
      byDay.push({
        date,
        completed: dayStats.completed,
        total: dayStats.total,
      });
      completed += dayStats.completed;
      total += dayStats.total;
      for (const cat of TASK_CATEGORIES) {
        const catStats = dayStats.byCategory[cat];
        if (catStats) {
          if (!byCategory[cat]) byCategory[cat] = { completed: 0, total: 0 };
          byCategory[cat]!.completed += catStats.completed;
          byCategory[cat]!.total += catStats.total;
        }
      }
    }

    return {
      year,
      month,
      completed,
      total,
      pending: total - completed,
      byDay,
      byCategory,
    };
  }
}
