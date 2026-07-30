/**
 * MmkvAuthSessionRepository - MMKV-backed implementation of IAuthSessionRepository
 * Local mirror of the signed-in Firebase session + this device's cloud-premium eligibility.
 */

import type {
  AuthSessionState,
  IAuthSessionRepository,
} from '../../domain/repository/IAuthSessionRepository';
import { STORAGE_KEYS, DEFAULTS } from '../../persistence/schema';
import { getBoolean, setBoolean, getString, setString, remove } from '../../persistence/mmkv';

type Subscriber = () => void;

export class MmkvAuthSessionRepository implements IAuthSessionRepository {
  private subscribers: Set<Subscriber> = new Set();

  getUid(): string | null {
    const v = getString(STORAGE_KEYS.AUTH_UID);
    return v && v.trim() ? v.trim() : null;
  }

  setUid(uid: string | null): void {
    if (uid) {
      setString(STORAGE_KEYS.AUTH_UID, uid.trim());
    } else {
      remove(STORAGE_KEYS.AUTH_UID);
    }
    this.notifySubscribers();
  }

  getEmail(): string | null {
    const v = getString(STORAGE_KEYS.AUTH_EMAIL);
    return v && v.trim() ? v.trim() : null;
  }

  setEmail(email: string | null): void {
    if (email) {
      setString(STORAGE_KEYS.AUTH_EMAIL, email.trim());
    } else {
      remove(STORAGE_KEYS.AUTH_EMAIL);
    }
    this.notifySubscribers();
  }

  getDevicePremiumAllowed(): boolean {
    return (
      getBoolean(STORAGE_KEYS.AUTH_DEVICE_PREMIUM_ALLOWED) ??
      DEFAULTS.AUTH_DEVICE_PREMIUM_ALLOWED
    );
  }

  setDevicePremiumAllowed(value: boolean): void {
    setBoolean(STORAGE_KEYS.AUTH_DEVICE_PREMIUM_ALLOWED, value);
    this.notifySubscribers();
  }

  clear(): void {
    remove(STORAGE_KEYS.AUTH_UID);
    remove(STORAGE_KEYS.AUTH_EMAIL);
    remove(STORAGE_KEYS.AUTH_DEVICE_PREMIUM_ALLOWED);
    this.notifySubscribers();
  }

  getState(): AuthSessionState {
    return {
      uid: this.getUid(),
      email: this.getEmail(),
      devicePremiumAllowed: this.getDevicePremiumAllowed(),
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
