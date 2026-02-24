/**
 * Global TypeScript types for UNTIL
 */

export type ThemeMode = 'light' | 'dark' | 'system';

export interface UserProfile {
  birthDate: string; // ISO date string YYYY-MM-DD
  deathAge?: number; // Expected lifespan in years, e.g. 80
}

export interface TimeProgress {
  day: number; // 0-1
  week: number;
  month: number;
  year: number;
  life: number;
  remainingHours?: number;
  remainingDaysMonth?: number;
  remainingDaysYear?: number;
  remainingDaysLife?: number;
}

export interface DayProgress {
  progress: number; // 0-1
  remainingMs: number;
  totalMs: number;
  startOfDay: number; // timestamp
  endOfDay: number;
}

export interface MonthProgress {
  progress: number;
  dayOfMonth: number;
  daysInMonth: number;
  remainingDays: number;
}

export interface YearProgress {
  progress: number;
  dayOfYear: number;
  daysInYear: number;
  remainingDays: number;
}

export interface LifeProgress {
  progress: number;
  yearsLived: number;
  yearsRemaining: number;
  totalYears: number;
}

export type ActivityCategory = 'work' | 'sleep' | 'social' | 'gym' | 'nothing';

export interface TimeBlock {
  startMs: number;
  endMs?: number;
  category: ActivityCategory;
}

export interface CategoryTotals {
  [category: string]: number;
}

export interface RegretProjection {
  daysWastedThisYear: number;
  daysWastedByAge: number;
  targetAge: number;
}

/**
 * Widget cache DTO — single contract for native widgets.
 * SSOT: defined here; surfaces/widgets/dataContract re-exports for widget code.
 */
export interface WidgetCache {
  dayProgress: number;
  dayPercentDone: number;
  dayPercentLeft: number;
  dayHoursPassed: number;
  dayHoursLeft: number;
  dayPassedMinutes: number;
  dayRemainingMinutes: number;
  /** Start of current day (UTC ms). Widget uses this + current time for realtime seconds. */
  startOfDay: number;
  /** End of current day (UTC ms). Widget uses this for realtime seconds. */
  endOfDay: number;
  monthProgress: number;
  monthIndex: number;
  monthDaysPassed: number;
  monthDaysLeft: number;
  monthPercent: number;
  yearProgress: number;
  yearDaysPassed: number;
  yearDaysLeft: number;
  yearPercent: number;
  updatedAt: number;
}

/** Custom counter for tap-to-increment widget (e.g. water glasses). */
export interface CustomCounter {
  id: string;
  title: string;
  count: number;
}

/** Countdown/deadline for countdown widget (e.g. Project, Interview). Date is YYYY-MM-DD. */
export interface Countdown {
  id: string;
  title: string;
  date: string;
}

/** Task categories for daily task list (separate from ActivityCategory). */
export type TaskCategory = 'health' | 'work' | 'personal_care' | 'learning' | 'other';

/** Single daily task. date is YYYY-MM-DD. Optional source when created from a monthly goal. */
export interface DailyTask {
  id: string;
  date: string;
  title: string;
  category: TaskCategory;
  completed: boolean;
  order?: number;
  /** Set when task was created from a monthly goal (for repeat-daily dedup and display). */
  sourceGoalId?: string;
  sourceGoalTaskId?: string;
}

/** Task template under a monthly goal. */
export interface GoalTask {
  id: string;
  goalId: string;
  title: string;
  category: TaskCategory;
  order: number;
}

/** Monthly goal (e.g. "Gain 5 kg this month") with tasks to complete. */
export interface MonthlyGoal {
  id: string;
  month: string; // YYYY-MM
  title: string;
  targetDescription?: string; // e.g. "increase 5 kg"
  tasks: GoalTask[];
  createdAt: number;
}

/** Rule: this goal task should appear as a daily task every day. */
export interface RepeatDailyRule {
  goalId: string;
  goalTaskId: string;
}

/** Per-category stats for a day. */
export interface DailyTaskCategoryStats {
  completed: number;
  total: number;
}

/** Stats for a given day (for in-app report and widget). */
export interface DailyTaskStats {
  date: string;
  completed: number;
  total: number;
  pending: number;
  byCategory: Partial<Record<TaskCategory, DailyTaskCategoryStats>>;
}

/** Payload written for the daily tasks widget (today's stats). */
export interface DailyTaskWidgetPayload {
  date: string;
  completed: number;
  total: number;
  pending: number;
  byCategory: Partial<Record<TaskCategory, DailyTaskCategoryStats>>;
}

/** One day's summary for weekly/monthly aggregation. */
export interface DayTaskSummary {
  date: string;
  completed: number;
  total: number;
}

/** Weekly task stats (e.g. last 7 days or current week). */
export interface WeeklyTaskStats {
  startDate: string;
  endDate: string;
  completed: number;
  total: number;
  pending: number;
  byDay: DayTaskSummary[];
  byCategory: Partial<Record<TaskCategory, DailyTaskCategoryStats>>;
}

/** Monthly task stats. */
export interface MonthlyTaskStats {
  year: number;
  month: number;
  completed: number;
  total: number;
  pending: number;
  byDay: DayTaskSummary[];
  byCategory: Partial<Record<TaskCategory, DailyTaskCategoryStats>>;
}
