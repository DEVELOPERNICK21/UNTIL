/**
 * MmkvCountdownRepository - MMKV-backed countdowns for countdown widget.
 * Widgets read the same STORAGE_KEYS.COUNTDOWNS from MMKV / App Group.
 */

import type { ICountdownRepository } from '../domain/ports/ICountdownRepository';
import type { Countdown } from '../../../shared/types';
import { STORAGE_KEYS } from '../../../shared/persistence/schema';
import { getString, setString } from '../../../shared/persistence/mmkv';
import { randomId } from '../../../shared/utils/randomId';
import { todayIso } from '../../../shared/time/clock';
import { MAX_TITLE_LENGTH } from '../../../config/inputLimits';
import { isValidDateKey } from '../domain/daysLeft';

function loadCountdowns(): Countdown[] {
  const raw = getString(STORAGE_KEYS.COUNTDOWNS);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    // Drop anything that is not a deadline with a real date, so it can never reach the screen as "NaN days".
    return parsed.filter(
      (c): c is Countdown =>
        !!c && typeof c.id === 'string' && typeof c.title === 'string' && isValidDateKey(c.date),
    );
  } catch {
    return [];
  }
}

function saveCountdowns(list: Countdown[]): void {
  setString(STORAGE_KEYS.COUNTDOWNS, JSON.stringify(list));
}

type Subscriber = () => void;

export class MmkvCountdownRepository implements ICountdownRepository {
  private subscribers: Set<Subscriber> = new Set();

  getAll(): Countdown[] {
    return loadCountdowns();
  }

  add(title: string, date: string): Countdown {
    const countdown: Countdown = {
      id: randomId(),
      title: (title || 'Deadline').trim().slice(0, MAX_TITLE_LENGTH) || 'Deadline',
      date: isValidDateKey(date) ? date : todayIso(),
      createdAt: todayIso(),
    };
    // Single-item mode: keep exactly one deadline.
    saveCountdowns([countdown]);
    this.notifySubscribers();
    return countdown;
  }

  remove(id: string): void {
    const list = loadCountdowns().filter((c) => c.id !== id);
    saveCountdowns(list);
    this.notifySubscribers();
  }

  subscribe(callback: Subscriber): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  private notifySubscribers(): void {
    this.subscribers.forEach((cb) => cb());
  }
}
