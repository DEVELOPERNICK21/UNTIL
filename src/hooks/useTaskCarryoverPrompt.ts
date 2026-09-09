import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import { getStoredTasksForDayUseCase, removeTaskUseCase } from '../di';
import { addDaysIso } from '../domain/tasks/taskMove';
import { getString, setString } from '../persistence/mmkv';
import { STORAGE_KEYS } from '../persistence/schema';
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
    setString(STORAGE_KEYS.TASK_CARRYOVER_DISMISSED_DATE, yesterday);
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
      const dismissed = getString(STORAGE_KEYS.TASK_CARRYOVER_DISMISSED_DATE);

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
