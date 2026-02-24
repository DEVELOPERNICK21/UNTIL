/**
 * MmkvMonthlyGoalRepository - MMKV-backed monthly goals and repeat-daily rules.
 */

import type { IMonthlyGoalRepository } from '../../domain/repository/IMonthlyGoalRepository';
import type { MonthlyGoal, GoalTask, RepeatDailyRule } from '../../types';
import { STORAGE_KEYS } from '../../persistence/schema';
import { getString, setString } from '../../persistence/mmkv';

function randomId(): string {
  return Math.random().toString(36).slice(2, 12);
}

function loadGoals(): MonthlyGoal[] {
  const raw = getString(STORAGE_KEYS.MONTHLY_GOALS);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveGoals(goals: MonthlyGoal[]): void {
  setString(STORAGE_KEYS.MONTHLY_GOALS, JSON.stringify(goals));
}

function loadRepeatRules(): RepeatDailyRule[] {
  const raw = getString(STORAGE_KEYS.GOAL_REPEAT_DAILY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveRepeatRules(rules: RepeatDailyRule[]): void {
  setString(STORAGE_KEYS.GOAL_REPEAT_DAILY, JSON.stringify(rules));
}

type Subscriber = () => void;

export class MmkvMonthlyGoalRepository implements IMonthlyGoalRepository {
  private subscribers: Set<Subscriber> = new Set();

  getGoalsForMonth(month: string): MonthlyGoal[] {
    return loadGoals().filter((g) => g.month === month).sort((a, b) => a.createdAt - b.createdAt);
  }

  getAllGoals(): MonthlyGoal[] {
    return loadGoals().sort((a, b) => {
      if (a.month !== b.month) return b.month.localeCompare(a.month);
      return a.createdAt - b.createdAt;
    });
  }

  getGoal(id: string): MonthlyGoal | null {
    return loadGoals().find((g) => g.id === id) ?? null;
  }

  addGoal(goal: Omit<MonthlyGoal, 'id' | 'createdAt' | 'tasks'>): MonthlyGoal {
    const all = loadGoals();
    const created: MonthlyGoal = {
      id: randomId(),
      month: goal.month,
      title: (goal.title || '').trim() || 'Monthly goal',
      targetDescription: goal.targetDescription?.trim(),
      tasks: [],
      createdAt: Date.now(),
    };
    all.push(created);
    saveGoals(all);
    this.notifySubscribers();
    return created;
  }

  updateGoal(id: string, patch: Partial<Pick<MonthlyGoal, 'title' | 'targetDescription' | 'month'>>): void {
    const all = loadGoals();
    const idx = all.findIndex((g) => g.id === id);
    if (idx === -1) return;
    if (patch.title !== undefined) all[idx].title = (patch.title || '').trim() || 'Monthly goal';
    if (patch.targetDescription !== undefined) all[idx].targetDescription = patch.targetDescription?.trim();
    if (patch.month !== undefined) all[idx].month = patch.month;
    saveGoals(all);
    this.notifySubscribers();
  }

  removeGoal(id: string): void {
    const all = loadGoals().filter((g) => g.id !== id);
    saveRepeatRules(loadRepeatRules().filter((r) => r.goalId !== id));
    saveGoals(all);
    this.notifySubscribers();
  }

  addGoalTask(goalId: string, task: Omit<GoalTask, 'id' | 'goalId'>): GoalTask {
    const all = loadGoals();
    const goalIdx = all.findIndex((g) => g.id === goalId);
    if (goalIdx === -1) throw new Error('Goal not found');
    const tasks = all[goalIdx].tasks;
    const maxOrder = tasks.reduce((max, t) => Math.max(max, t.order), 0);
    const created: GoalTask = {
      id: randomId(),
      goalId,
      title: (task.title || '').trim() || 'Task',
      category: task.category,
      order: maxOrder + 1,
    };
    tasks.push(created);
    saveGoals(all);
    this.notifySubscribers();
    return created;
  }

  updateGoalTask(goalId: string, taskId: string, patch: Partial<Pick<GoalTask, 'title' | 'category'>>): void {
    const all = loadGoals();
    const goal = all.find((g) => g.id === goalId);
    if (!goal) return;
    const t = goal.tasks.find((x) => x.id === taskId);
    if (!t) return;
    if (patch.title !== undefined) t.title = (patch.title || '').trim() || 'Task';
    if (patch.category !== undefined) t.category = patch.category;
    saveGoals(all);
    this.notifySubscribers();
  }

  removeGoalTask(goalId: string, taskId: string): void {
    const all = loadGoals();
    const goal = all.find((g) => g.id === goalId);
    if (!goal) return;
    goal.tasks = goal.tasks.filter((t) => t.id !== taskId);
    saveRepeatRules(loadRepeatRules().filter((r) => !(r.goalId === goalId && r.goalTaskId === taskId)));
    saveGoals(all);
    this.notifySubscribers();
  }

  getRepeatDailyRules(): RepeatDailyRule[] {
    return loadRepeatRules();
  }

  addRepeatDailyRule(rule: RepeatDailyRule): void {
    const rules = loadRepeatRules();
    if (rules.some((r) => r.goalId === rule.goalId && r.goalTaskId === rule.goalTaskId)) return;
    rules.push(rule);
    saveRepeatRules(rules);
    this.notifySubscribers();
  }

  removeRepeatDailyRule(goalId: string, goalTaskId: string): void {
    saveRepeatRules(loadRepeatRules().filter((r) => !(r.goalId === goalId && r.goalTaskId === goalTaskId)));
    this.notifySubscribers();
  }

  isRepeatDaily(goalId: string, goalTaskId: string): boolean {
    return loadRepeatRules().some((r) => r.goalId === goalId && r.goalTaskId === goalTaskId);
  }

  subscribe(callback: Subscriber): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  private notifySubscribers(): void {
    this.subscribers.forEach((cb) => cb());
  }
}
