/**
 * MmkvSubscriptionRepository - MMKV-backed implementation of ISubscriptionRepository
 * Single Source of Truth for premium/subscription state.
 * Widgets read from the same MMKV that this uses.
 */

import type { ISubscriptionRepository } from '../../domain/repository/ISubscriptionRepository';
import type { PurchaseType, SubscriptionState } from '../../types';
import { STORAGE_KEYS, DEFAULTS } from '../../persistence/schema';
import {
  getBoolean,
  setBoolean,
  getString,
  setString,
  getNumber,
  setNumber,
  remove,
} from '../../persistence/mmkv';

type Subscriber = () => void;

const PURCHASE_TYPES: readonly PurchaseType[] = ['monthly', 'yearly', 'lifetime'];

function parsePurchaseType(raw: string | undefined | null): PurchaseType | null {
  if (!raw || !raw.trim()) return null;
  const v = raw.trim() as PurchaseType;
  return PURCHASE_TYPES.includes(v) ? v : null;
}

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

  getPurchaseType(): PurchaseType | null {
    return parsePurchaseType(getString(STORAGE_KEYS.PURCHASE_TYPE));
  }

  setPurchaseType(value: PurchaseType | null): void {
    if (value) {
      setString(STORAGE_KEYS.PURCHASE_TYPE, value);
    } else {
      remove(STORAGE_KEYS.PURCHASE_TYPE);
    }
    this.notifySubscribers();
  }

  getPurchaseDate(): number | null {
    const v = getNumber(STORAGE_KEYS.PURCHASE_DATE);
    return v != null && v > 0 ? v : null;
  }

  setPurchaseDate(ms: number | null): void {
    if (ms != null && ms > 0) {
      setNumber(STORAGE_KEYS.PURCHASE_DATE, ms);
    } else {
      remove(STORAGE_KEYS.PURCHASE_DATE);
    }
    this.notifySubscribers();
  }

  getPurchaseToken(): string | null {
    const v = getString(STORAGE_KEYS.PURCHASE_TOKEN);
    return v && v.trim() ? v.trim() : null;
  }

  setPurchaseToken(token: string | null): void {
    if (token) {
      setString(STORAGE_KEYS.PURCHASE_TOKEN, token.trim());
    } else {
      remove(STORAGE_KEYS.PURCHASE_TOKEN);
    }
    this.notifySubscribers();
  }

  getTrialStartDate(): number | null {
    const v = getNumber(STORAGE_KEYS.TRIAL_START_DATE);
    return v != null && v > 0 ? v : null;
  }

  setTrialStartDate(ms: number | null): void {
    if (ms != null && ms > 0) {
      setNumber(STORAGE_KEYS.TRIAL_START_DATE, ms);
    } else {
      remove(STORAGE_KEYS.TRIAL_START_DATE);
    }
    this.notifySubscribers();
  }

  getAppOpenCount(): number {
    const v = getNumber(STORAGE_KEYS.ENGAGEMENT_APP_OPEN_COUNT);
    return v != null && v >= 0 ? v : DEFAULTS.ENGAGEMENT_APP_OPEN_COUNT;
  }

  setAppOpenCount(n: number): void {
    setNumber(STORAGE_KEYS.ENGAGEMENT_APP_OPEN_COUNT, Math.max(0, n));
    this.notifySubscribers();
  }

  incrementAppOpenCount(): number {
    const next = this.getAppOpenCount() + 1;
    this.setAppOpenCount(next);
    return next;
  }

  getLifeScreenViewed(): boolean {
    return getBoolean(STORAGE_KEYS.ENGAGEMENT_LIFE_SCREEN_VIEWED) === true;
  }

  setLifeScreenViewed(value: boolean): void {
    setBoolean(STORAGE_KEYS.ENGAGEMENT_LIFE_SCREEN_VIEWED, value);
    this.notifySubscribers();
  }

  getLifeUnlockUntil(): number | null {
    const v = getNumber(STORAGE_KEYS.ENGAGEMENT_LIFE_UNLOCK_UNTIL);
    return v != null && v > 0 ? v : null;
  }

  setLifeUnlockUntil(ms: number | null): void {
    if (ms != null && ms > 0) {
      setNumber(STORAGE_KEYS.ENGAGEMENT_LIFE_UNLOCK_UNTIL, ms);
    } else {
      remove(STORAGE_KEYS.ENGAGEMENT_LIFE_UNLOCK_UNTIL);
    }
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
