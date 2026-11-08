/**
 * Reminders that are already scheduled hold text in the language they were scheduled in. When
 * the person picks another language, write them again so the next one reads in the new language.
 * The trial reminders do this in useTrialEndingReminder, where their start date is at hand.
 */

import { getLanguage, subscribeLanguage } from '../shared/i18n/translate';
import {
  refreshTaskDeadlineNotifications,
  scheduleRetentionNotifications,
} from '../features/engagement';
import { refreshDay2ReengagementLanguage } from '../features/onboarding';
import { schedulePresenceStreakSaver } from '../features/presence';
import { getPresenceStreakUseCase } from './di';

let stop: (() => void) | null = null;

/** Starts once; later calls return the same stopper. */
export function startNotificationLanguageSync(): () => void {
  if (stop) return stop;
  let lastLanguage = getLanguage();
  const unsubscribe = subscribeLanguage(() => {
    const language = getLanguage();
    if (language === lastLanguage) return;
    lastLanguage = language;
    void Promise.allSettled([
      scheduleRetentionNotifications(new Date(), { force: true }),
      refreshTaskDeadlineNotifications(),
      schedulePresenceStreakSaver(getPresenceStreakUseCase.execute()),
      refreshDay2ReengagementLanguage(),
    ]);
  });
  stop = () => {
    unsubscribe();
    stop = null;
  };
  return stop;
}
