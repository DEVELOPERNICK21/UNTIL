/**
 * MmkvSubscriptionRepository - MMKV-backed implementation of ISubscriptionRepository
 * Single Source of Truth for premium/subscription state.
 * Widgets read from the same MMKV that this uses.
 */

import type { ISubscriptionRepository } from '../../domain/repository/ISubscriptionRepository';
import { STORAGE_KEYS } from '../../persistence/schema';
import { getBoolean, setBoolean } from '../../persistence/mmkv';
import { DEFAULTS } from '../../persistence/schema';

type Subscriber = () => void;

export class MmkvSubscriptionRepository implements ISubscriptionRepository {
  private subscribers: Set<Subscriber> = new Set();

  getIsPremium(): boolean {
    return getBoolean(STORAGE_KEYS.PREMIUM_IS_ACTIVE) ?? DEFAULTS.PREMIUM_IS_ACTIVE;
  }

  setIsPremium(value: boolean): void {
    setBoolean(STORAGE_KEYS.PREMIUM_IS_ACTIVE, value);
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
