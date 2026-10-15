import { useCallback, useState } from 'react';
import {
  getRetentionNotificationsEnabled,
  setRetentionNotificationsEnabled,
} from '../services/retentionNotifications';

export function useRetentionNotifications(): {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
} {
  const [enabled, setEnabledState] = useState(() =>
    getRetentionNotificationsEnabled()
  );

  const setEnabled = useCallback((nextEnabled: boolean) => {
    setEnabledState(nextEnabled);
    setRetentionNotificationsEnabled(nextEnabled).catch(() => {
      setEnabledState(getRetentionNotificationsEnabled());
    });
  }, []);

  return { enabled, setEnabled };
}
