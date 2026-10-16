/**
 * Wraps Notifee permission requests with analytics.
 *
 * Several features ask for permission when they schedule something (trial reminders, streak
 * saver, day-2 nudge), often on every app open. So: say yes at once when it is already granted,
 * never ask while another ask is running, and ask the system at most every few days. Only a real
 * prompt is logged, so the event counts decisions, not app opens.
 */

import { Platform } from 'react-native';
import { logAnalyticsEvent } from '../analytics/analytics';
import { getNumber, setNumber } from '../persistence/mmkv';
import { STORAGE_KEYS } from '../persistence/schema';
import { MS_PER_DAY } from '../time/constants';

const ASK_AGAIN_AFTER_MS = 3 * MS_PER_DAY;

/** Notifee's AUTHORIZED (1) and PROVISIONAL (2). */
const isGranted = (status: number | undefined): boolean => status === 1 || status === 2;

let inFlight: Promise<boolean> | null = null;

/**
 * Android always; iOS only for features that opt in (`allowIos`), because the older reminders were
 * never built for iOS and must not start prompting there.
 */
export function requestNotificationPermission(
  source: string,
  options: { allowIos?: boolean } = {},
): Promise<boolean> {
  const supported =
    Platform.OS === 'android' || (options.allowIos === true && Platform.OS === 'ios');
  if (!supported) return Promise.resolve(false);
  if (inFlight) return inFlight;

  inFlight = (async () => {
    try {
      const notifee = require('@notifee/react-native').default;
      const current = await notifee.getNotificationSettings();
      if (isGranted(current?.authorizationStatus)) return true;

      const lastAsk = getNumber(STORAGE_KEYS.NOTIFICATION_PERMISSION_LAST_ASK_AT);
      if (lastAsk != null && Date.now() - lastAsk < ASK_AGAIN_AFTER_MS) return false;

      setNumber(STORAGE_KEYS.NOTIFICATION_PERMISSION_LAST_ASK_AT, Date.now());
      const settings = await notifee.requestPermission();
      const granted = isGranted(settings?.authorizationStatus);
      void logAnalyticsEvent('notification_permission_result', { granted, source });
      return granted;
    } catch {
      void logAnalyticsEvent('notification_permission_result', { granted: false, source });
      return false;
    }
  })().finally(() => {
    inFlight = null;
  });
  return inFlight;
}

/** Reads the current permission without prompting. */
export async function hasNotificationPermission(): Promise<boolean> {
  if (Platform.OS !== 'android' && Platform.OS !== 'ios') return false;
  try {
    const notifee = require('@notifee/react-native').default;
    const settings = await notifee.getNotificationSettings();
    return isGranted(settings?.authorizationStatus);
  } catch {
    return false;
  }
}
