import { useCallback, useState } from 'react';
import {
  getTaskDeadlineNotificationsEnabled,
  setTaskDeadlineNotificationsEnabled,
} from '../services/taskDeadlineNotifications';

export function useTaskDeadlineNotifications(): {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
} {
  const [enabled, setEnabledState] = useState(() =>
    getTaskDeadlineNotificationsEnabled()
  );

  const setEnabled = useCallback((nextEnabled: boolean) => {
    setEnabledState(nextEnabled);
    setTaskDeadlineNotificationsEnabled(nextEnabled).catch(() => {
      setEnabledState(getTaskDeadlineNotificationsEnabled());
    });
  }, []);

  return { enabled, setEnabled };
}
