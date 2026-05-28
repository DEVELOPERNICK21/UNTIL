import { useCallback, useState } from 'react';
import {
  addGoalTaskUseCase,
  addToDailyFromGoalUseCase,
  getGoalUseCase,
  isRepeatDailyUseCase,
  removeGoalTaskUseCase,
  removeMonthlyGoalUseCase,
  removeRepeatDailyFromGoalUseCase,
  setRepeatDailyFromGoalUseCase,
  updateGoalTaskUseCase,
} from '../di';
import type { GoalTask, MonthlyGoal } from '../types';

export function useGoalDetail(goalId: string): {
  goal: MonthlyGoal | null;
  refresh: () => void;
  removeGoal: () => void;
  addTask: (params: { title: string; category: GoalTask['category'] }) => void;
  updateTask: (
    taskId: string,
    patch: Partial<Pick<GoalTask, 'title' | 'category'>>
  ) => void;
  removeTask: (taskId: string) => void;
  addTaskToDay: (taskId: string, date: string) => void;
  isRepeatDaily: (taskId: string) => boolean;
  toggleRepeatDaily: (taskId: string, date: string) => void;
} {
  const [goal, setGoal] = useState(() => getGoalUseCase.execute(goalId));

  const refresh = useCallback(() => {
    setGoal(getGoalUseCase.execute(goalId));
  }, [goalId]);

  const removeGoal = useCallback(() => {
    removeMonthlyGoalUseCase.execute(goalId);
  }, [goalId]);

  const addTask = useCallback(
    (params: { title: string; category: GoalTask['category'] }) => {
      addGoalTaskUseCase.execute(goalId, params);
      refresh();
    },
    [goalId, refresh]
  );

  const updateTask = useCallback(
    (
      taskId: string,
      patch: Partial<Pick<GoalTask, 'title' | 'category'>>
    ) => {
      updateGoalTaskUseCase.execute(goalId, taskId, patch);
      refresh();
    },
    [goalId, refresh]
  );

  const removeTask = useCallback(
    (taskId: string) => {
      removeGoalTaskUseCase.execute(goalId, taskId);
      refresh();
    },
    [goalId, refresh]
  );

  const addTaskToDay = useCallback(
    (taskId: string, date: string) => {
      addToDailyFromGoalUseCase.execute(goalId, taskId, date);
      refresh();
    },
    [goalId, refresh]
  );

  const isRepeatDaily = useCallback(
    (taskId: string) => isRepeatDailyUseCase.execute(goalId, taskId),
    [goalId]
  );

  const toggleRepeatDaily = useCallback(
    (taskId: string, date: string) => {
      if (isRepeatDailyUseCase.execute(goalId, taskId)) {
        removeRepeatDailyFromGoalUseCase.execute(goalId, taskId);
      } else {
        setRepeatDailyFromGoalUseCase.execute(goalId, taskId, date);
      }
      refresh();
    },
    [goalId, refresh]
  );

  return {
    goal,
    refresh,
    removeGoal,
    addTask,
    updateTask,
    removeTask,
    addTaskToDay,
    isRepeatDaily,
    toggleRepeatDaily,
  };
}
