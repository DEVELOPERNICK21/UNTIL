import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import {
  getStoredTasksForDayUseCase,
  removeTaskUseCase,
  taskCarryoverDismissalUseCase,
} from '../di';
import { addDaysIso } from '../domain/tasks/taskMove';
import type { DailyTask } from '../types';

export function useTaskCarryoverPrompt(today: string) {
  const [visible, setVisible] = useState(false);
  const [unfinishedYesterday, setUnfinishedYesterday] = useState<DailyTask[]>(
    [],
  );
  const yesterday = addDaysIso(today, -1);

  const closePrompt = useCallback(() => {
    setVisible(false);
  }, []);

  const dismissNotNow = useCallback(() => {
    taskCarryoverDismissalUseCase.dismiss(yesterday);
    setVisible(false);
  }, [yesterday]);

  const clearYesterday = useCallback(() => {
    for (const task of unfinishedYesterday) {
      removeTaskUseCase.execute(task.id);
    }
    setUnfinishedYesterday([]);
    setVisible(false);
  }, [unfinishedYesterday]);

  useFocusEffect(
    useCallback(() => {
      const unfinished = getStoredTasksForDayUseCase
        .execute(yesterday)
        .filter(task => !task.completed);
      const dismissed = taskCarryoverDismissalUseCase.getDismissedDate();

      setUnfinishedYesterday(unfinished);
      setVisible(unfinished.length > 0 && dismissed !== yesterday);
    }, [yesterday]),
  );

  return {
    visible,
    unfinishedYesterday,
    closePrompt,
    dismissNotNow,
    clearYesterday,
  };
}
