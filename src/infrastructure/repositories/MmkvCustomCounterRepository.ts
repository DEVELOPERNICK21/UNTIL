/**
 * MmkvCustomCounterRepository - MMKV-backed custom counters for tap-to-increment widget.
 * Widgets read the same STORAGE_KEYS.CUSTOM_COUNTERS from MMKV / App Group.
 */

import type { ICustomCounterRepository } from '../../domain/repository/ICustomCounterRepository';
import type { CustomCounter } from '../../types';
import { STORAGE_KEYS } from '../../persistence/schema';
import { getString, setString } from '../../persistence/mmkv';

function randomId(): string {
  return Math.random().toString(36).slice(2, 12);
}

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
    const list = loadCounters();
    const trimmed = title.trim() || 'Counter';
    const counter: CustomCounter = {
      id: randomId(),
      title: trimmed,
      count: 0,
    };
    list.push(counter);
    saveCounters(list);
    this.notifySubscribers();
    return counter;
  }

  remove(id: string): void {
    const list = loadCounters().filter((c) => c.id !== id);
    saveCounters(list);
    this.notifySubscribers();
  }

  increment(id: string): void {
    const list = loadCounters();
    const index = list.findIndex((c) => c.id === id);
    if (index === -1) return;
    list[index] = { ...list[index], count: list[index].count + 1 };
    saveCounters(list);
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
