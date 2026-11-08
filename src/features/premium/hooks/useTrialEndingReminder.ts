import { useEffect, useRef, useState } from 'react';
import { useObserveSubscription } from './useObserveSubscription';
import { useAccessControl } from './useAccessControl';
import {
  getActiveTrialReminderDay,
  recordTrialReminderInAppShown,
  scheduleTrialLocalNotifications,
} from '../services/trialReminders';
import { logAnalyticsEvent } from '../../../shared/analytics/analytics';
import { useTranslation } from '../../../shared/i18n/useTranslation';

export function useTrialEndingReminder() {
  const { isPremium } = useObserveSubscription();
  const { access } = useAccessControl();
  const { language } = useTranslation();
  const scheduledLanguage = useRef(language);
  const [reminderDay, setReminderDay] = useState<number | null>(null);

  useEffect(() => {
    if (access.trialStartDate != null && !isPremium) {
      // A new language rewrites reminders that are already waiting; otherwise schedule once.
      const rewrite = scheduledLanguage.current !== language;
      scheduledLanguage.current = language;
      void scheduleTrialLocalNotifications(access.trialStartDate, { rewrite });
    }
  }, [access.trialStartDate, isPremium, language]);

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
