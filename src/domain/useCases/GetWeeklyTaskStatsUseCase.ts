import type { ITaskRepository } from '../repository/ITaskRepository';
import type {
  WeeklyTaskStats,
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

function dateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function addDays(d: Date, days: number): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + days);
  return out;
}

/** Returns stats for the last 7 days including today. */
export class GetWeeklyTaskStatsUseCase {
  constructor(
    private readonly taskRepository: ITaskRepository,
    private readonly getDailyTaskStats: GetDailyTaskStatsUseCase
  ) {}

  execute(referenceDate: Date = new Date()): WeeklyTaskStats {
    const byDay: DayTaskSummary[] = [];
    let completed = 0;
    let total = 0;
    const byCategory: WeeklyTaskStats['byCategory'] = {};

    for (let i = 6; i >= 0; i--) {
      const d = addDays(referenceDate, -i);
      const date = dateString(d);
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

    const startDate = byDay[0]?.date ?? dateString(referenceDate);
    const endDate = byDay[byDay.length - 1]?.date ?? dateString(referenceDate);

    return {
      startDate,
      endDate,
      completed,
      total,
      pending: total - completed,
      byDay,
      byCategory,
    };
  }
}
