/**
 * Soft evening “still time to notice today” presence-streak saver.
 * Kind tone — protect investment, no guilt threats.
 *
 * After a day is noticed, schedules tomorrow evening so the spine stays warm.
 */

import { Platform } from 'react-native';
import type { PresenceStreakState } from '../domain/presence/presenceStreak';
import { STORAGE_KEYS } from '../persistence/schema';
import { getString, setString } from '../persistence/mmkv';
import { requestNotificationPermission } from './notificationPermission';
import { wearDayWhisper } from '../theme/emotionalCopy';

const CHANNEL_ID = 'presence';

function localEveningAt(dayOffset: number, now: Date = new Date()): Date {
  const d = new Date(now);
  d.setDate(d.getDate() + dayOffset);
  d.setHours(21, 0, 0, 0);
  return d;
}

/** Next soft saver window: tonight 9pm if not noticed; else tomorrow 9pm. */
function nextSaverTime(
  noticedToday: boolean,
  now: Date = new Date(),
): Date {
  if (noticedToday) {
    return localEveningAt(1, now);
  }
  const tonight = localEveningAt(0, now);
  if (tonight.getTime() > now.getTime()) {
    return tonight;
  }
  return localEveningAt(1, now);
}

/** Schedule soft saver if a presence streak exists. */
export async function schedulePresenceStreakSaver(
  state: PresenceStreakState,
  dayProgress: number = 0.5,
): Promise<void> {
  if (Platform.OS !== 'android' && Platform.OS !== 'ios') return;

  try {
    const notifee = require('@notifee/react-native').default;
    const { TriggerType, AndroidImportance } = require('@notifee/react-native');

    const prevId = getString(STORAGE_KEYS.PRESENCE_STREAK_SAVER_ID);
    if (prevId) {
      try {
        await notifee.cancelNotification(prevId);
      } catch {
        /* ignore */
      }
      setString(STORAGE_KEYS.PRESENCE_STREAK_SAVER_ID, '');
    }

    if (state.count < 1) {
      return;
    }

    const ok = await requestNotificationPermission('presence_streak');
    if (!ok) return;

    if (Platform.OS === 'android') {
      await notifee.createChannel({
        id: CHANNEL_ID,
        name: 'Presence',
        importance: AndroidImportance.DEFAULT,
      });
    }

    const when = nextSaverTime(state.noticedToday);
    const id = `presence-saver-${when.toISOString().slice(0, 10)}`;
    const whisper = wearDayWhisper(dayProgress);

    await notifee.createTriggerNotification(
      {
        id,
        title: 'Ember is still here',
        body:
          state.count >= 2
            ? `${whisper} — your ${state.count}-day presence is still open.`
            : `${whisper} — open UNTIL once to notice what’s left of today.`,
        android: { channelId: CHANNEL_ID, pressAction: { id: 'default' } },
        ios: { sound: 'default' },
      },
      {
        type: TriggerType.TIMESTAMP,
        timestamp: when.getTime(),
      },
    );
    setString(STORAGE_KEYS.PRESENCE_STREAK_SAVER_ID, id);
  } catch {
    /* best-effort */
  }
}

export async function cancelPresenceStreakSaver(): Promise<void> {
  const prevId = getString(STORAGE_KEYS.PRESENCE_STREAK_SAVER_ID);
  if (!prevId) return;
  try {
    const notifee = require('@notifee/react-native').default;
    await notifee.cancelNotification(prevId);
  } catch {
    /* ignore */
  }
  setString(STORAGE_KEYS.PRESENCE_STREAK_SAVER_ID, '');
}
