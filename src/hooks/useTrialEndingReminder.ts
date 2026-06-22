import { useEffect, useState } from 'react';
import { useObserveSubscription } from './useObserveSubscription';
import { useAccessControl } from './useAccessControl';
import {
  getActiveTrialReminderDay,
  recordTrialReminderInAppShown,
  scheduleTrialLocalNotifications,
} from '../services/trialReminders';
import { logAnalyticsEvent } from '../services/analytics';

export function useTrialEndingReminder() {
  const { isPremium } = useObserveSubscription();
  const { access } = useAccessControl();
  const [reminderDay, setReminderDay] = useState<number | null>(null);

  useEffect(() => {
    if (access.trialStartDate != null && !isPremium) {
      void scheduleTrialLocalNotifications(access.trialStartDate);
    }
  }, [access.trialStartDate, isPremium]);

  useEffect(() => {
    const day = getActiveTrialReminderDay(
      access.trialStartDate,
      isPremium
    );
    if (day != null) {
      void logAnalyticsEvent('trial_reminder_shown', { trial_day: day });
    }
    setReminderDay(day);
  }, [access.trialStartDate, isPremium, access.trialActive]);

  const dismiss = () => {
    if (reminderDay != null) {
      recordTrialReminderInAppShown(reminderDay);
    }
    setReminderDay(null);
  };

  return {
    visible: reminderDay != null,
    trialDay: reminderDay ?? 10,
    dismiss,
  };
}
