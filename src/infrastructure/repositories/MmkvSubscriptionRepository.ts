/**
 * MmkvSubscriptionRepository - MMKV-backed implementation of ISubscriptionRepository
 * Single Source of Truth for premium/subscription state.
 * Widgets read from the same MMKV that this uses.
 */

import type { ISubscriptionRepository } from '../../domain/repository/ISubscriptionRepository';
import type { SubscriptionState } from '../../types';
import { STORAGE_KEYS } from '../../persistence/schema';
import {
  getBoolean,
  setBoolean,
  getString,
  setString,
  getNumber,
  setNumber,
  remove,
} from '../../persistence/mmkv';
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

  getLicenseKey(): string | null {
    const v = getString(STORAGE_KEYS.SUBSCRIPTION_LICENSE_KEY);
    return v && v.trim() ? v.trim() : null;
  }

  setLicenseKey(key: string | null): void {
    if (key) {
      setString(STORAGE_KEYS.SUBSCRIPTION_LICENSE_KEY, key.trim());
    } else {
      remove(STORAGE_KEYS.SUBSCRIPTION_LICENSE_KEY);
    }
    this.notifySubscribers();
  }

  getDeviceId(): string | null {
    const v = getString(STORAGE_KEYS.SUBSCRIPTION_DEVICE_ID);
    return v && v.trim() ? v.trim() : null;
  }

  setDeviceId(id: string | null): void {
    if (id) {
      setString(STORAGE_KEYS.SUBSCRIPTION_DEVICE_ID, id.trim());
    } else {
      remove(STORAGE_KEYS.SUBSCRIPTION_DEVICE_ID);
    }
    this.notifySubscribers();
  }

  getLastVerifiedAt(): number | null {
    const v = getNumber(STORAGE_KEYS.SUBSCRIPTION_LAST_VERIFIED);
    return v != null && v > 0 ? v : null;
  }

  setLastVerifiedAt(ms: number): void {
    setNumber(STORAGE_KEYS.SUBSCRIPTION_LAST_VERIFIED, ms);
    this.notifySubscribers();
  }

  getState(): SubscriptionState {
    return {
      isPremium: this.getIsPremium(),
      deviceId: this.getDeviceId(),
      lastVerifiedAt: this.getLastVerifiedAt(),
    };
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
