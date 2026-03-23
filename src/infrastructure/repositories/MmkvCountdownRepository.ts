/**
 * MmkvCountdownRepository - MMKV-backed countdowns for countdown widget.
 * Widgets read the same STORAGE_KEYS.COUNTDOWNS from MMKV / App Group.
 */

import type { ICountdownRepository } from '../../domain/repository/ICountdownRepository';
import type { Countdown } from '../../types';
import { STORAGE_KEYS } from '../../persistence/schema';
import { getString, setString } from '../../persistence/mmkv';

function randomId(): string {
  return Math.random().toString(36).slice(2, 12);
}

function loadCountdowns(): Countdown[] {
  const raw = getString(STORAGE_KEYS.COUNTDOWNS);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed : [];
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
      title: (title || 'Deadline').trim() || 'Deadline',
      date: date || new Date().toISOString().slice(0, 10),
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
