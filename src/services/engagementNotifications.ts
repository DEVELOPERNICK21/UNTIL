/**
 * Re-engagement local notifications (day 2 after onboarding).
 */

import { Platform } from 'react-native';
import { getString, setString } from '../persistence/mmkv';
import { STORAGE_KEYS } from '../persistence/schema';
import { requestNotificationPermission } from './notificationPermission';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/** Schedule a single day-2 reminder after onboarding completes. */
export async function scheduleDay2ReengagementNotification(
  completedAt: number
): Promise<void> {
  if (Platform.OS !== 'android') return;
  if (getString(STORAGE_KEYS.DAY2_NOTIFICATION_SCHEDULED) === '1') return;
  if (completedAt <= 0) return;

  const triggerMs = completedAt + 2 * ONE_DAY_MS + 9 * 60 * 60 * 1000;
  if (triggerMs <= Date.now()) return;

  try {
    const notifee = require('@notifee/react-native').default;
    const { TriggerType } = require('@notifee/react-native');
    await requestNotificationPermission('onboarding_day2');
    await notifee.createChannel({
      id: 'engagement',
      name: 'Reminders',
    });

    await notifee.createTriggerNotification(
      {
        title: 'UNTIL',
        body: 'See how much of your month is left. Add the Day widget to your home screen.',
        android: { channelId: 'engagement' },
      },
      {
        type: TriggerType.TIMESTAMP,
        timestamp: triggerMs,
      }
    );

    setString(STORAGE_KEYS.DAY2_NOTIFICATION_SCHEDULED, '1');
  } catch {
    /* Notifee unavailable */
  }
}
