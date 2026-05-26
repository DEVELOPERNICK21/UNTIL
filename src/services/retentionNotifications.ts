/**
 * Local retention notifications: one useful progress-based reminder per day.
 */

import { Platform } from 'react-native';
import {
  buildRetentionNotificationSchedule,
  getLocalDateKey,
} from '../domain/notifications/retentionNotificationCopy';
import { TRIAL_REMINDER_DAYS } from '../config/monetization';
import { TRIAL_DURATION_MS } from '../config/accessConstants';
import { getNumber, getString, setNumber, setString } from '../persistence/mmkv';
import { STORAGE_KEYS } from '../persistence/schema';
import { logAnalyticsEvent } from './analytics';
import { getTrialDayIndex } from './trialReminders';

const CHANNEL_ID = 'retention';
const DEFAULT_ENABLED = false;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const MIN_RESCHEDULE_INTERVAL_MS = 6 * 60 * 60 * 1000;

let scheduleInFlight = false;

function parseIds(raw: string | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === 'string')
      : [];
  } catch {
    return [];
  }
}

function saveIds(ids: string[]): void {
  setString(STORAGE_KEYS.RETENTION_NOTIFICATIONS_IDS, JSON.stringify(ids));
}

function getYearProgress(date: Date = new Date()): number {
  const start = new Date(date.getFullYear(), 0, 1).getTime();
  const end = new Date(date.getFullYear() + 1, 0, 1).getTime();
  return Math.min(1, Math.max(0, (date.getTime() - start) / (end - start)));
}

function parseBirthDate(raw: string): Date | null {
  const [year, month, day] = raw.split('-').map(Number);
  if (!year || !month || !day) return null;
  const parsed = new Date(year, month - 1, day);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getLifeWeeksLived(now: Date = new Date()): number | undefined {
  const birthDateRaw = getString(STORAGE_KEYS.USER_BIRTH_DATE);
  if (!birthDateRaw) {
    return undefined;
  }
  const birthDate = parseBirthDate(birthDateRaw);
  if (!birthDate) return undefined;
  const livedDays = Math.max(
    0,
    Math.floor((now.getTime() - birthDate.getTime()) / ONE_DAY_MS)
  );
  return Math.floor(livedDays / 7);
}

function isPreviewReminderDate(date: Date): boolean {
  const trialStart = getNumber(STORAGE_KEYS.TRIAL_START_DATE);
  if (trialStart == null || trialStart <= 0) return false;
  if (date.getTime() > trialStart + TRIAL_DURATION_MS) return false;
  const day = getTrialDayIndex(trialStart, date.getTime());
  return TRIAL_REMINDER_DAYS.includes(day);
}

export function getRetentionNotificationsEnabled(): boolean {
  const raw = getString(STORAGE_KEYS.RETENTION_NOTIFICATIONS_ENABLED);
  if (raw === '0') return false;
  if (raw === '1') return true;
  return DEFAULT_ENABLED;
}

export function recordRetentionAppOpen(date: Date = new Date()): void {
  setString(STORAGE_KEYS.RETENTION_NOTIFICATIONS_LAST_APP_OPEN_DATE, getLocalDateKey(date));
  setNumber(STORAGE_KEYS.RETENTION_NOTIFICATIONS_LAST_APP_OPEN_HOUR, date.getHours());
}

async function requestRetentionNotificationPermissionOnce(): Promise<void> {
  if (Platform.OS !== 'android') return;
  if (
    getString(STORAGE_KEYS.RETENTION_NOTIFICATIONS_PERMISSION_REQUESTED) === '1'
  ) {
    return;
  }
  setString(STORAGE_KEYS.RETENTION_NOTIFICATIONS_PERMISSION_REQUESTED, '1');
  try {
    const notifee = require('@notifee/react-native').default;
    await notifee.requestPermission();
  } catch {
    /* Permission prompt unavailable */
  }
}

export async function cancelRetentionNotifications(): Promise<void> {
  if (Platform.OS !== 'android') return;
  const ids = parseIds(getString(STORAGE_KEYS.RETENTION_NOTIFICATIONS_IDS));
  if (ids.length === 0) return;
  try {
    const notifee = require('@notifee/react-native').default;
    await Promise.all(ids.map(id => notifee.cancelNotification(id)));
  } catch {
    /* Notifee unavailable */
  } finally {
    saveIds([]);
  }
}

export async function setRetentionNotificationsEnabled(
  enabled: boolean
): Promise<void> {
  setString(STORAGE_KEYS.RETENTION_NOTIFICATIONS_ENABLED, enabled ? '1' : '0');
  await logAnalyticsEvent(
    enabled ? 'retention_notification_enabled' : 'retention_notification_disabled'
  );
  if (enabled) {
    await requestRetentionNotificationPermissionOnce();
    await scheduleRetentionNotifications(new Date(), { force: true });
  } else {
    await cancelRetentionNotifications();
  }
}

export async function scheduleRetentionNotifications(
  now: Date = new Date(),
  options: { force?: boolean } = {}
): Promise<void> {
  if (Platform.OS !== 'android') return;
  if (scheduleInFlight) return;
  if (!getRetentionNotificationsEnabled()) {
    await cancelRetentionNotifications();
    return;
  }

  const lastScheduledAt = getNumber(
    STORAGE_KEYS.RETENTION_NOTIFICATIONS_SCHEDULED_AT
  );
  if (
    !options.force &&
    lastScheduledAt != null &&
    now.getTime() - lastScheduledAt < MIN_RESCHEDULE_INTERVAL_MS
  ) {
    return;
  }

  scheduleInFlight = true;
  const lastAppOpenDateKey = getString(
    STORAGE_KEYS.RETENTION_NOTIFICATIONS_LAST_APP_OPEN_DATE
  );
  const lastAppOpenHour = getNumber(
    STORAGE_KEYS.RETENTION_NOTIFICATIONS_LAST_APP_OPEN_HOUR
  );
  const schedule = buildRetentionNotificationSchedule({
    now,
    enabled: true,
    yearProgress: getYearProgress(now),
    lifeWeeksLived: getLifeWeeksLived(now),
    lastAppOpenDateKey,
    lastAppOpenHour,
    daysAhead: 7,
  }).filter(item => !isPreviewReminderDate(item.triggerAt));

  try {
    const notifee = require('@notifee/react-native').default;
    const { TriggerType } = require('@notifee/react-native');
    await notifee.createChannel({
      id: CHANNEL_ID,
      name: 'Daily Time Reminders',
    });

    await cancelRetentionNotifications();

    const ids: string[] = [];
    for (const item of schedule) {
      await notifee.createTriggerNotification(
        {
          id: item.id,
          title: item.title,
          body: item.body,
          data: { type: 'retention', dateKey: item.dateKey },
          android: { channelId: CHANNEL_ID },
        },
        {
          type: TriggerType.TIMESTAMP,
          timestamp: item.triggerAt.getTime(),
        }
      );
      ids.push(item.id);
    }

    saveIds(ids);
    setNumber(STORAGE_KEYS.RETENTION_NOTIFICATIONS_SCHEDULED_AT, now.getTime());
    await logAnalyticsEvent('retention_notification_scheduled', {
      count: ids.length,
    });
  } catch {
    /* Notifee unavailable or permission denied */
  } finally {
    scheduleInFlight = false;
  }
}
