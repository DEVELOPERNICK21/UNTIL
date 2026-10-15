/**
 * Firestore JS SDK version of the phone's FirestoreAccountCloudStoreAdapter.
 * Same paths and the same failure contract: device reads and writes throw, so
 * a network error never reads as a free slot.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  setDoc,
  type Firestore,
  type Unsubscribe,
} from 'firebase/firestore';
import type { IAccountCloudStore } from '@until/domain/ports/IAccountCloudStore';
import type { AccountDevice, CloudEntitlement, CloudUserProfile } from '@until/types';
import { withTimeout } from '@until/core/account/withTimeout';

const FIRESTORE_TIMEOUT_MS = 8000;

export class FirestoreJsAccountCloudStore implements IAccountCloudStore {
  constructor(private readonly db: Firestore) {}

  async getProfile(uid: string): Promise<CloudUserProfile | null> {
    const snap = await withTimeout(
      getDoc(doc(this.db, 'users', uid)),
      FIRESTORE_TIMEOUT_MS,
      'getProfile',
    );
    return snap.exists() ? (snap.data() as CloudUserProfile) : null;
  }

  /**
   * Calls `onChange` now and every time the phone changes the profile. `fromCache` is true while
   * the answer is only what this machine remembers, so it must not count as "synced". Errors are
   * ignored: offline, the numbers keep ticking from the last profile and it picks up again later.
   */
  watchProfile(
    uid: string,
    onChange: (profile: CloudUserProfile | null, fromCache: boolean) => void,
  ): Unsubscribe {
    return onSnapshot(
      doc(this.db, 'users', uid),
      snap =>
        onChange(
          snap.exists() ? (snap.data() as CloudUserProfile) : null,
          snap.metadata.fromCache,
        ),
      () => {},
    );
  }

  async upsertProfile(uid: string, patch: Partial<CloudUserProfile>): Promise<void> {
    await withTimeout(
      setDoc(doc(this.db, 'users', uid), { ...patch, updatedAt: Date.now() }, { merge: true }),
      FIRESTORE_TIMEOUT_MS,
      'upsertProfile',
    );
  }

  async listDevices(uid: string): Promise<AccountDevice[]> {
    const snap = await withTimeout(
      getDocs(collection(this.db, 'users', uid, 'devices')),
      FIRESTORE_TIMEOUT_MS,
      'listDevices',
    );
    return snap.docs.map(d => d.data() as AccountDevice);
  }

  async upsertDevice(uid: string, device: AccountDevice): Promise<void> {
    await withTimeout(
      setDoc(doc(this.db, 'users', uid, 'devices', device.id), { ...device }, { merge: true }),
      FIRESTORE_TIMEOUT_MS,
      'upsertDevice',
    );
  }

  async setDeviceActive(uid: string, deviceId: string, active: boolean): Promise<void> {
    await withTimeout(
      setDoc(doc(this.db, 'users', uid, 'devices', deviceId), { active }, { merge: true }),
      FIRESTORE_TIMEOUT_MS,
      'setDeviceActive',
    );
  }

  /** Throws on failure so callers can tell "no entitlement" from "unknown". */
  async getEntitlement(uid: string): Promise<CloudEntitlement | null> {
    const snap = await withTimeout(
      getDoc(doc(this.db, 'users', uid, 'entitlement', 'current')),
      FIRESTORE_TIMEOUT_MS,
      'getEntitlement',
    );
    return snap.exists() ? (snap.data() as CloudEntitlement) : null;
  }

  async setEntitlement(): Promise<void> {
    throw new Error('Entitlement is written by the phone, not the desktop.');
  }

  async deleteUserData(): Promise<void> {
    throw new Error('Account deletion happens on the phone.');
  }
}
