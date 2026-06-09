import { useCallback, useState } from 'react';
import {
  addMonthlyGoalUseCase,
  getMonthlyGoalsUseCase,
  removeMonthlyGoalUseCase,
} from '../di';
import type { MonthlyGoal } from '../types';

export function useMonthlyGoals(month: string): {
  goals: MonthlyGoal[];
  refresh: () => void;
  addGoal: (params: {
    title: string;
    targetDescription?: string;
  }) => void;
  removeGoal: (id: string) => void;
} {
  const [goals, setGoals] = useState<MonthlyGoal[]>(() =>
    getMonthlyGoalsUseCase.executeForMonth(month)
  );

  const refresh = useCallback(() => {
    setGoals(getMonthlyGoalsUseCase.executeForMonth(month));
  }, [month]);

  const addGoal = useCallback(
    (params: { title: string; targetDescription?: string }) => {
      addMonthlyGoalUseCase.execute({
        month,
        title: params.title,
        targetDescription: params.targetDescription,
      });
      refresh();
    },
    [month, refresh]
  );

  const removeGoal = useCallback(
    (id: string) => {
      removeMonthlyGoalUseCase.execute(id);
      refresh();
    },
    [refresh]
  );

  return { goals, refresh, addGoal, removeGoal };
}
