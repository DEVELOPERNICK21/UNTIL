/**
 * MmkvCustomCounterRepository - MMKV-backed custom counters for tap-to-increment widget.
 * Widgets read the same STORAGE_KEYS.CUSTOM_COUNTERS from MMKV / App Group.
 */

import type { ICustomCounterRepository } from '../domain/ports/ICustomCounterRepository';
import type { CustomCounter } from '../../../shared/types';
import { STORAGE_KEYS } from '../../../shared/persistence/schema';
import { getString, setString } from '../../../shared/persistence/mmkv';
import { randomId } from '../../../shared/utils/randomId';
import { MAX_TITLE_LENGTH } from '../../../config/inputLimits';

function loadCounters(): CustomCounter[] {
  const raw = getString(STORAGE_KEYS.CUSTOM_COUNTERS);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** A stored count that is not a sane whole number counts as zero, so one bad write cannot poison every later tap. */
function safeCount(count: unknown): number {
  return typeof count === 'number' && Number.isFinite(count) && count > 0
    ? Math.floor(count)
    : 0;
}

function saveCounters(counters: CustomCounter[]): void {
  setString(STORAGE_KEYS.CUSTOM_COUNTERS, JSON.stringify(counters));
}

type Subscriber = () => void;

export class MmkvCustomCounterRepository implements ICustomCounterRepository {
  private subscribers: Set<Subscriber> = new Set();

  getAll(): CustomCounter[] {
    return loadCounters();
  }

  add(title: string): CustomCounter {
    const trimmed = title.trim().slice(0, MAX_TITLE_LENGTH).trim() || 'Counter';
    const counter: CustomCounter = {
      id: randomId(),
      title: trimmed,
      count: 0,
    };
    // Single-item mode: keep exactly one counter.
    saveCounters([counter]);
    this.notifySubscribers();
    return counter;
  }

  remove(id: string): void {
    const list = loadCounters().filter((c) => c.id !== id);
    saveCounters(list);
    this.notifySubscribers();
  }

  increment(id: string): void {
    this.setCount(id, count => safeCount(count) + 1);
  }

  decrement(id: string): void {
    this.setCount(id, count => Math.max(0, safeCount(count) - 1));
  }

  reset(id: string): void {
    this.setCount(id, () => 0);
  }

  private setCount(id: string, next: (count: number) => number): void {
    const list = loadCounters();
    const index = list.findIndex((c) => c.id === id);
    if (index === -1) return;
    list[index] = { ...list[index], count: next(list[index].count) };
    saveCounters(list);
    this.notifySubscribers();
  }

  replaceAll(counters: CustomCounter[]): void {
    const valid = Array.isArray(counters) ? counters : [];
    saveCounters(valid);
    this.notifySubscribers();
  }

  subscribe(callback: Subscriber): () => void {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  private notifySubscribers(): void {
    this.subscribers.forEach((cb) => cb());
  }
}
