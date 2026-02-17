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
