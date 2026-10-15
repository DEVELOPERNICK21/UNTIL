/**
 * Pure public API of the tasks feature, for the domain and data layers of other
 * features. Nothing here may import React, native modules or app/di, so importing it never loads
 * screens or hooks. Add an export deliberately when another feature's domain needs it.
 */

export type { IMonthlyGoalRepository } from './ports/IMonthlyGoalRepository';
export type { ITaskRepository } from './ports/ITaskRepository';
export type {
  GetDailyTaskStatsUseCase,
} from './useCases/GetDailyTaskStatsUseCase';
