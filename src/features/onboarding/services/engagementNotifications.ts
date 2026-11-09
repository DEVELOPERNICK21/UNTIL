/**
 * Re-engagement local notifications (day 2 after onboarding).
 */

import { Platform } from 'react-native';
import { getString, setString } from '../../../shared/persistence/mmkv';
import { STORAGE_KEYS } from '../../../shared/persistence/schema';
import { requestNotificationPermission } from '../../../shared/platform/notificationPermission';
import { MS_PER_DAY, MS_PER_HOUR } from '../../../shared/time/constants';
import { t } from '../../../shared/i18n/translate';

const DAY2_ID = 'engagement-day2';
const CHANNEL_ID = 'engagement';

/** Schedule a single day-2 reminder after onboarding completes. */
export async function scheduleDay2ReengagementNotification(
  completedAt: number,
): Promise<void> {
  if (Platform.OS !== 'android') return;
  if (getString(STORAGE_KEYS.DAY2_NOTIFICATION_SCHEDULED) === '1') return;
  if (completedAt <= 0) return;

  const triggerMs = completedAt + 2 * MS_PER_DAY + 9 * MS_PER_HOUR;
  if (triggerMs <= Date.now()) return;

  try {
    const notifee = require('@notifee/react-native').default;
    const { TriggerType } = require('@notifee/react-native');
    await requestNotificationPermission('onboarding_day2');
    await notifee.createChannel({
      id: CHANNEL_ID,
      name: t('notifications.channel.engagement'),
    });

    await notifee.createTriggerNotification(
      {
        id: DAY2_ID,
        title: 'UNTIL',
        body: t('notifications.day2.body'),
        android: { channelId: CHANNEL_ID },
      },
      {
        type: TriggerType.TIMESTAMP,
        timestamp: triggerMs,
      },
    );

    setString(STORAGE_KEYS.DAY2_NOTIFICATION_SCHEDULED, '1');
  } catch {
    /* Notifee unavailable */
  }
}

/**
 * The language changed: write the pending day-2 nudge again in the new one, at the same time.
 * A nudge scheduled by an older version has no id and keeps its language.
 */
export async function refreshDay2ReengagementLanguage(): Promise<void> {
  if (Platform.OS !== 'android') return;
  if (getString(STORAGE_KEYS.DAY2_NOTIFICATION_SCHEDULED) !== '1') return;

  try {
    const notifee = require('@notifee/react-native').default;
    const { TriggerType } = require('@notifee/react-native');
    const pending: {
      notification?: { id?: string };
      trigger?: { timestamp?: number };
    }[] = await notifee.getTriggerNotifications();
    const day2 = pending.find(item => item.notification?.id === DAY2_ID);
    const timestamp = day2?.trigger?.timestamp;
    if (!day2 || typeof timestamp !== 'number' || timestamp <= Date.now())
      return;

    await notifee.createChannel({
      id: CHANNEL_ID,
      name: t('notifications.channel.engagement'),
    });
    await notifee.createTriggerNotification(
      {
        id: DAY2_ID,
        title: 'UNTIL',
        body: t('notifications.day2.body'),
        android: { channelId: CHANNEL_ID },
      },
      { type: TriggerType.TIMESTAMP, timestamp },
    );
  } catch {
    /* Notifee unavailable */
  }
}
