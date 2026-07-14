/**
 * MMKV presence streak (daily “noticed” habit).
 */

import type { IPresenceRepository } from '../../domain/repository/IPresenceRepository';
import type { PresenceStreakState } from '../../domain/presence/presenceStreak';
import {
  EMPTY_PRESENCE,
  localDateKey,
} from '../../domain/presence/presenceStreak';
import { STORAGE_KEYS } from '../../persistence/schema';
import { getNumber, getString, setNumber, setString } from '../../persistence/mmkv';

export class MmkvPresenceRepository implements IPresenceRepository {
  getState(): PresenceStreakState {
    const count = getNumber(STORAGE_KEYS.PRESENCE_STREAK_COUNT) ?? 0;
    const longest = getNumber(STORAGE_KEYS.PRESENCE_STREAK_LONGEST) ?? 0;
    const lastDateKey = getString(STORAGE_KEYS.PRESENCE_STREAK_LAST_DATE) || null;
    const freezeRaw = getString(STORAGE_KEYS.PRESENCE_STREAK_FREEZE);
    const freezeAvailable = freezeRaw !== '0';
    const today = localDateKey();
    return {
      count,
      longest: Math.max(longest, count),
      lastDateKey,
      freezeAvailable,
      noticedToday: lastDateKey === today,
    };
  }

  setState(state: PresenceStreakState): void {
    setNumber(STORAGE_KEYS.PRESENCE_STREAK_COUNT, state.count);
    setNumber(STORAGE_KEYS.PRESENCE_STREAK_LONGEST, state.longest);
    setString(STORAGE_KEYS.PRESENCE_STREAK_LAST_DATE, state.lastDateKey ?? '');
    setString(STORAGE_KEYS.PRESENCE_STREAK_FREEZE, state.freezeAvailable ? '1' : '0');
  }
}

export { EMPTY_PRESENCE };
