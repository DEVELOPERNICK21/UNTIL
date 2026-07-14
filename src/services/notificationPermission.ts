/**
 * Wraps Notifee permission requests with analytics.
 */

import { Platform } from 'react-native';
import { logAnalyticsEvent } from './analytics';

export async function requestNotificationPermission(
  source: string
): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return false;
  }

  try {
    const notifee = require('@notifee/react-native').default;
    const settings = await notifee.requestPermission();
    const granted =
      settings.authorizationStatus === 1 ||
      settings.authorizationStatus === 2;
    void logAnalyticsEvent('notification_permission_result', {
      granted,
      source,
    });
    return granted;
  } catch {
    void logAnalyticsEvent('notification_permission_result', {
      granted: false,
      source,
    });
    return false;
  }
}
