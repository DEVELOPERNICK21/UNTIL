/**
 * IMonthlyGoalRepository - Port for monthly goals, goal tasks, and repeat-daily rules.
 */

import type { MonthlyGoal, GoalTask, RepeatDailyRule } from '../../types';

type Subscriber = () => void;

export interface IMonthlyGoalRepository {
  getGoalsForMonth(month: string): MonthlyGoal[];
  getAllGoals(): MonthlyGoal[];
  getGoal(id: string): MonthlyGoal | null;
  addGoal(goal: Omit<MonthlyGoal, 'id' | 'createdAt' | 'tasks'>): MonthlyGoal;
  updateGoal(id: string, patch: Partial<Pick<MonthlyGoal, 'title' | 'targetDescription' | 'month'>>): void;
  removeGoal(id: string): void;
  addGoalTask(goalId: string, task: Omit<GoalTask, 'id' | 'goalId'>): GoalTask;
  updateGoalTask(goalId: string, taskId: string, patch: Partial<Pick<GoalTask, 'title' | 'category'>>): void;
  removeGoalTask(goalId: string, taskId: string): void;
  getRepeatDailyRules(): RepeatDailyRule[];
  addRepeatDailyRule(rule: RepeatDailyRule): void;
  removeRepeatDailyRule(goalId: string, goalTaskId: string): void;
  isRepeatDaily(goalId: string, goalTaskId: string): boolean;
  subscribe(callback: Subscriber): () => void;
}
