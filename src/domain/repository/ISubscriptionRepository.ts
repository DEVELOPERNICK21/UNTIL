/**
 * ISubscriptionRepository - Port for premium/subscription state
 * Single Source of Truth: all reads/writes for premium go through this interface.
 * Supports one-device license binding (web purchase → license key → activate on device).
 */

import type { PurchaseType, SubscriptionState } from '../../types';

type Subscriber = () => void;

export interface ISubscriptionRepository {
  getIsPremium(): boolean;
  setIsPremium(value: boolean): void;
  getLicenseKey(): string | null;
  setLicenseKey(key: string | null): void;
  getDeviceId(): string | null;
  setDeviceId(id: string | null): void;
  getLastVerifiedAt(): number | null;
  setLastVerifiedAt(ms: number): void;

  /** Play / store purchase metadata (SSOT). Null type = no active store entitlement recorded. */
  getPurchaseType(): PurchaseType | null;
  setPurchaseType(value: PurchaseType | null): void;
  getPurchaseDate(): number | null;
  setPurchaseDate(ms: number | null): void;
  getPurchaseToken(): string | null;
  setPurchaseToken(token: string | null): void;

  /** First app open timestamp for 14-day trial (ms). */
  getTrialStartDate(): number | null;
  setTrialStartDate(ms: number | null): void;

  getAppOpenCount(): number;
  setAppOpenCount(n: number): void;
  incrementAppOpenCount(): number;

  getLifeScreenViewed(): boolean;
  setLifeScreenViewed(value: boolean): void;

  /** Life event-unlock window end (ms). */
  getLifeUnlockUntil(): number | null;
  setLifeUnlockUntil(ms: number | null): void;

  getState(): SubscriptionState;
  subscribe(callback: Subscriber): () => void;
}
