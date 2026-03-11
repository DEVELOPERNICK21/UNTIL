/**
 * ISubscriptionRepository - Port for premium/subscription state
 * Single Source of Truth: all reads/writes for premium go through this interface.
 * Supports one-device license binding (web purchase → license key → activate on device).
 */

import type { SubscriptionState } from '../../types';

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
  getState(): SubscriptionState;
  subscribe(callback: Subscriber): () => void;
}
