/**
 * Tasks feature: daily tasks and monthly goals.
 */

import { GetTasksForDayUseCase } from '../../features/tasks/domain/useCases/GetTasksForDayUseCase';
import { GetStoredTasksForDayUseCase } from '../../features/tasks/domain/useCases/GetStoredTasksForDayUseCase';
import { AddTaskUseCase } from '../../features/tasks/domain/useCases/AddTaskUseCase';
import { ToggleTaskUseCase } from '../../features/tasks/domain/useCases/ToggleTaskUseCase';
import { UpdateTaskUseCase } from '../../features/tasks/domain/useCases/UpdateTaskUseCase';
import { RemoveTaskUseCase } from '../../features/tasks/domain/useCases/RemoveTaskUseCase';
import { TaskCarryoverDismissalUseCase } from '../../features/tasks/domain/useCases/TaskCarryoverDismissalUseCase';
import { MoveTaskUseCase } from '../../features/tasks/domain/useCases/MoveTaskUseCase';
import { MoveTasksUseCase } from '../../features/tasks/domain/useCases/MoveTasksUseCase';
import { GetDailyTaskStatsUseCase } from '../../features/tasks/domain/useCases/GetDailyTaskStatsUseCase';
import { GetWeeklyTaskStatsUseCase } from '../../features/tasks/domain/useCases/GetWeeklyTaskStatsUseCase';
import { GetMonthlyTaskStatsUseCase } from '../../features/tasks/domain/useCases/GetMonthlyTaskStatsUseCase';
import { ObserveDailyTasksUseCase } from '../../features/tasks/domain/useCases/ObserveDailyTasksUseCase';
import { GetMonthlyGoalsUseCase } from '../../features/tasks/domain/useCases/GetMonthlyGoalsUseCase';
import { GetGoalUseCase } from '../../features/tasks/domain/useCases/GetGoalUseCase';
import { AddMonthlyGoalUseCase } from '../../features/tasks/domain/useCases/AddMonthlyGoalUseCase';
import { UpdateMonthlyGoalUseCase } from '../../features/tasks/domain/useCases/UpdateMonthlyGoalUseCase';
import { RemoveMonthlyGoalUseCase } from '../../features/tasks/domain/useCases/RemoveMonthlyGoalUseCase';
import { AddGoalTaskUseCase } from '../../features/tasks/domain/useCases/AddGoalTaskUseCase';
import { UpdateGoalTaskUseCase } from '../../features/tasks/domain/useCases/UpdateGoalTaskUseCase';
import { RemoveGoalTaskUseCase } from '../../features/tasks/domain/useCases/RemoveGoalTaskUseCase';
import { AddToDailyFromGoalUseCase } from '../../features/tasks/domain/useCases/AddToDailyFromGoalUseCase';
import { SetRepeatDailyFromGoalUseCase } from '../../features/tasks/domain/useCases/SetRepeatDailyFromGoalUseCase';
import { RemoveRepeatDailyFromGoalUseCase } from '../../features/tasks/domain/useCases/RemoveRepeatDailyFromGoalUseCase';
import { IsRepeatDailyUseCase } from '../../features/tasks/domain/useCases/IsRepeatDailyUseCase';
import { monthlyGoalRepository, taskRepository } from './repositories';

export const getTasksForDayUseCase = new GetTasksForDayUseCase(taskRepository, monthlyGoalRepository);

export const getStoredTasksForDayUseCase = new GetStoredTasksForDayUseCase(taskRepository);

export const addTaskUseCase = new AddTaskUseCase(taskRepository);

export const toggleTaskUseCase = new ToggleTaskUseCase(taskRepository);

export const updateTaskUseCase = new UpdateTaskUseCase(taskRepository);

export const removeTaskUseCase = new RemoveTaskUseCase(taskRepository);

export const taskCarryoverDismissalUseCase = new TaskCarryoverDismissalUseCase(taskRepository);

export const moveTaskUseCase = new MoveTaskUseCase(taskRepository);

export const moveTasksUseCase = new MoveTasksUseCase(taskRepository);

export const getDailyTaskStatsUseCase = new GetDailyTaskStatsUseCase(taskRepository);

export const getWeeklyTaskStatsUseCase = new GetWeeklyTaskStatsUseCase(
  taskRepository,
  getDailyTaskStatsUseCase
);

export const getMonthlyTaskStatsUseCase = new GetMonthlyTaskStatsUseCase(
  taskRepository,
  getDailyTaskStatsUseCase
);

export const observeDailyTasksUseCase = new ObserveDailyTasksUseCase(taskRepository);

export const getMonthlyGoalsUseCase = new GetMonthlyGoalsUseCase(monthlyGoalRepository);

export const getGoalUseCase = new GetGoalUseCase(monthlyGoalRepository);

export const addMonthlyGoalUseCase = new AddMonthlyGoalUseCase(monthlyGoalRepository);

export const updateMonthlyGoalUseCase = new UpdateMonthlyGoalUseCase(monthlyGoalRepository);

export const removeMonthlyGoalUseCase = new RemoveMonthlyGoalUseCase(monthlyGoalRepository);

export const addGoalTaskUseCase = new AddGoalTaskUseCase(monthlyGoalRepository);

export const updateGoalTaskUseCase = new UpdateGoalTaskUseCase(monthlyGoalRepository);

export const removeGoalTaskUseCase = new RemoveGoalTaskUseCase(monthlyGoalRepository);

export const addToDailyFromGoalUseCase = new AddToDailyFromGoalUseCase(taskRepository, monthlyGoalRepository);

export const setRepeatDailyFromGoalUseCase = new SetRepeatDailyFromGoalUseCase(taskRepository, monthlyGoalRepository);

export const removeRepeatDailyFromGoalUseCase = new RemoveRepeatDailyFromGoalUseCase(monthlyGoalRepository);

export const isRepeatDailyUseCase = new IsRepeatDailyUseCase(monthlyGoalRepository);
