/**
 * MmkvBadgeRepository - earned badges and celebration bookkeeping.
 * One JSON blob under STORAGE_KEYS.BADGES_STATE.
 */

import type {
  BadgeState,
  IBadgeRepository,
} from '../../domain/repository/IBadgeRepository';
import { EMPTY_BADGE_STATE } from '../../domain/repository/IBadgeRepository';
import { STORAGE_KEYS } from '../../persistence/schema';
import { getString, setString } from '../../persistence/mmkv';

type Subscriber = () => void;

function parseState(raw: string | undefined): BadgeState {
  if (!raw) return { ...EMPTY_BADGE_STATE, earned: {}, seen: [] };
  try {
    const parsed = JSON.parse(raw) as Partial<BadgeState> | null;
    const earned: Record<string, string> = {};
    if (parsed?.earned && typeof parsed.earned === 'object') {
      for (const [id, date] of Object.entries(parsed.earned)) {
        if (typeof date === 'string') earned[id] = date;
      }
    }
    const seen = Array.isArray(parsed?.seen)
      ? parsed.seen.filter((id): id is string => typeof id === 'string')
      : [];
    const streakCelebratedOn =
      typeof parsed?.streakCelebratedOn === 'string'
        ? parsed.streakCelebratedOn
        : null;
    return { earned, seen, streakCelebratedOn };
  } catch {
    return { ...EMPTY_BADGE_STATE, earned: {}, seen: [] };
  }
}

export class MmkvBadgeRepository implements IBadgeRepository {
  private subscribers: Set<Subscriber> = new Set();

  getState(): BadgeState {
    return parseState(getString(STORAGE_KEYS.BADGES_STATE));
  }

  setState(state: BadgeState): void {
    setString(STORAGE_KEYS.BADGES_STATE, JSON.stringify(state));
    this.subscribers.forEach(cb => cb());
  }

  subscribe(callback: Subscriber): () => void {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }
}
