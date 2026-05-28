/**
 * Re-engagement local notifications (day 2 after onboarding).
 */

import { Platform } from 'react-native';
import { getNumber, getString, setString } from '../persistence/mmkv';
import { STORAGE_KEYS } from '../persistence/schema';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/** Schedule a single day-2 reminder after onboarding completes. */
export async function scheduleDay2ReengagementNotification(): Promise<void> {
  if (Platform.OS !== 'android') return;
  if (getString(STORAGE_KEYS.DAY2_NOTIFICATION_SCHEDULED) === '1') return;

  const completedAt = getNumber(STORAGE_KEYS.ONBOARDING_COMPLETED_AT);
  if (completedAt == null || completedAt <= 0) return;

  const triggerMs = completedAt + 2 * ONE_DAY_MS + 9 * 60 * 60 * 1000;
  if (triggerMs <= Date.now()) return;

  try {
    const notifee = require('@notifee/react-native').default;
    const { TriggerType } = require('@notifee/react-native');
    await notifee.requestPermission();
    await notifee.createChannel({
      id: 'engagement',
      name: 'Reminders',
    });

    await notifee.createTriggerNotification(
      {
        title: 'UNTIL',
        body: 'See how much of your month is left — add the Day widget to your home screen.',
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
