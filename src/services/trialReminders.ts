import { Platform } from 'react-native';
import { getString, setString } from '../persistence/mmkv';
import { STORAGE_KEYS } from '../persistence/schema';
import {
  MONETIZATION_PAYWALL_COPY,
  MONETIZATION_TRIAL_DAYS,
  TRIAL_REMINDER_DAYS,
} from '../config/monetization';
import { TRIAL_DURATION_MS } from '../config/accessConstants';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function reminderCopyForDay(day: number): string {
  if (day === 10) return MONETIZATION_PAYWALL_COPY.trialReminderDay10;
  if (day === 13) return MONETIZATION_PAYWALL_COPY.trialReminderDay13;
  return MONETIZATION_PAYWALL_COPY.trialReminderDay14;
}

function getInAppShownDays(): Set<number> {
  const raw = getString(STORAGE_KEYS.TRIAL_REMINDERS_INAPP_SHOWN);
  if (!raw) return new Set();
  return new Set(
    raw
      .split(',')
      .map(s => parseInt(s, 10))
      .filter(n => Number.isFinite(n))
  );
}

function markInAppShown(day: number): void {
  const set = getInAppShownDays();
  set.add(day);
  setString(STORAGE_KEYS.TRIAL_REMINDERS_INAPP_SHOWN, [...set].join(','));
}

/** 1-based day index since trial start (day 1 = first 24h). */
export function getTrialDayIndex(trialStartMs: number, now: number = Date.now()): number {
  if (trialStartMs <= 0) return 0;
  return Math.floor((now - trialStartMs) / ONE_DAY_MS) + 1;
}

export function getActiveTrialReminderDay(
  trialStartMs: number | null,
  isPremium: boolean,
  now: number = Date.now()
): number | null {
  if (isPremium || trialStartMs == null) return null;
  const trialEnd = trialStartMs + TRIAL_DURATION_MS;
  if (now > trialEnd) return null;

  const day = getTrialDayIndex(trialStartMs, now);
  const shown = getInAppShownDays();
  for (const d of TRIAL_REMINDER_DAYS) {
    if (day >= d && !shown.has(d)) {
      return d;
    }
  }
  return null;
}

export function recordTrialReminderInAppShown(day: number): void {
  markInAppShown(day);
}

export function getTrialReminderMessage(day: number): string {
  return reminderCopyForDay(day);
}

/** Schedule local notifications for trial days 10, 13, 14 (Android). */
export async function scheduleTrialLocalNotifications(
  trialStartMs: number
): Promise<void> {
  if (Platform.OS !== 'android') return;
  if (getString(STORAGE_KEYS.TRIAL_REMINDERS_SCHEDULED) === '1') return;

  try {
    const notifee = require('@notifee/react-native').default;
    await notifee.requestPermission();
    await notifee.createChannel({
      id: 'trial',
      name: 'Trial reminders',
    });

    const ids: string[] = [];
    for (const day of TRIAL_REMINDER_DAYS) {
      const triggerMs = trialStartMs + (day - 1) * ONE_DAY_MS + 10 * 60 * 60 * 1000;
      if (triggerMs <= Date.now()) continue;

      const id = await notifee.createTriggerNotification(
        {
          title: 'UNTIL Premium trial',
          body: reminderCopyForDay(day),
          android: { channelId: 'trial' },
        },
        {
          type: require('@notifee/react-native').TriggerType.TIMESTAMP,
          timestamp: triggerMs,
        }
      );
      ids.push(id);
    }

    if (ids.length > 0) {
      setString(STORAGE_KEYS.TRIAL_REMINDERS_SCHEDULED, '1');
    }
  } catch {
    /* Notifee not installed or permission denied */
  }
}

export async function cancelTrialLocalNotifications(): Promise<void> {
  try {
    const notifee = require('@notifee/react-native').default;
    await notifee.cancelAllNotifications();
    setString(STORAGE_KEYS.TRIAL_REMINDERS_SCHEDULED, '');
  } catch {
    //
  }
}
