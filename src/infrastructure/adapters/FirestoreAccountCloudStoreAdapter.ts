/**
 * FirestoreAccountCloudStoreAdapter — Firestore-backed IAccountCloudStore.
 *
 * Paths (owner-only, see firestore.rules at repo root):
 * - users/{uid}                     -> CloudUserProfile fields
 * - users/{uid}/devices/{deviceId}  -> AccountDevice
 * - users/{uid}/entitlement/current -> CloudEntitlement (single doc)
 *
 * Requires a Firestore database to exist for the project (Firebase Console ->
 * Firestore Database -> Create database) and rules deployed via
 * `firebase deploy --only firestore:rules`.
 */

import type { IAccountCloudStore } from '../../domain/ports/IAccountCloudStore';
import type { AccountDevice, CloudEntitlement, CloudUserProfile } from '../../types';
import { withTimeout } from '../../core/account/withTimeout';
import { recordCrashError } from '../../services/analytics';

/** Firestore without a created DB (or offline) can hang; fail fast so sign-in can finish. */
const FIRESTORE_TIMEOUT_MS = 8000;

interface DocSnapshotLike<T> {
  exists: boolean;
  data(): T | undefined;
}

interface QuerySnapshotLike<T> {
  docs: DocSnapshotLike<T>[];
}

interface DocRefLike {
  __docRef: true;
}

interface FirestoreModule {
  doc: (path: string, ...segments: string[]) => DocRefLike;
  collection: (path: string, ...segments: string[]) => DocRefLike;
  getDoc: <T>(ref: DocRefLike) => Promise<DocSnapshotLike<T>>;
  getDocs: <T>(ref: DocRefLike) => Promise<QuerySnapshotLike<T>>;
  setDoc: (ref: DocRefLike, data: Record<string, unknown>, options?: { merge?: boolean }) => Promise<void>;
}

/**
 * Lazily resolves the Firestore module. Returns null if the native FIRApp
 * was never configured, mirroring the guard in services/analytics.ts.
 */
function getFirestoreModule(): FirestoreModule | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getApp, getApps } = require('@react-native-firebase/app') as {
      getApp: () => unknown;
      getApps: () => unknown[];
    };
    if (getApps().length === 0) return null;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getFirestore, doc, collection, getDoc, getDocs, setDoc } = require('@react-native-firebase/firestore') as {
      getFirestore: (app: unknown) => unknown;
      doc: (db: unknown, path: string, ...segments: string[]) => DocRefLike;
      collection: (db: unknown, path: string, ...segments: string[]) => DocRefLike;
      getDoc: <T>(ref: DocRefLike) => Promise<DocSnapshotLike<T>>;
      getDocs: <T>(ref: DocRefLike) => Promise<QuerySnapshotLike<T>>;
      setDoc: (
        ref: DocRefLike,
        data: Record<string, unknown>,
        options?: { merge?: boolean }
      ) => Promise<void>;
    };
    const db = getFirestore(getApp());
    return {
      doc: (path, ...segments) => doc(db, path, ...segments),
      collection: (path, ...segments) => collection(db, path, ...segments),
      getDoc,
      getDocs,
      setDoc,
    };
  } catch (e) {
    recordCrashError(e, 'FirestoreAccountCloudStoreAdapter.getFirestoreModule');
    return null;
  }
}

export class FirestoreAccountCloudStoreAdapter implements IAccountCloudStore {
  async getProfile(uid: string): Promise<CloudUserProfile | null> {
    const db = getFirestoreModule();
    if (!db) return null;
    try {
      const snap = await withTimeout(
        db.getDoc<CloudUserProfile>(db.doc('users', uid)),
        FIRESTORE_TIMEOUT_MS,
        'getProfile'
      );
      return snap.exists ? (snap.data() ?? null) : null;
    } catch (e) {
      recordCrashError(e, 'FirestoreAccountCloudStoreAdapter.getProfile');
      return null;
    }
  }

  async upsertProfile(uid: string, patch: Partial<CloudUserProfile>): Promise<void> {
    const db = getFirestoreModule();
    if (!db) return;
    try {
      await withTimeout(
        db.setDoc(db.doc('users', uid), { ...patch, updatedAt: Date.now() }, { merge: true }),
        FIRESTORE_TIMEOUT_MS,
        'upsertProfile'
      );
    } catch (e) {
      recordCrashError(e, 'FirestoreAccountCloudStoreAdapter.upsertProfile');
    }
  }

  /**
   * Device reads and writes throw on failure. An empty list must only ever mean
   * "this account has no devices", otherwise a network error would read as a
   * free slot and the 3-device cap would stop holding.
   */
  async listDevices(uid: string): Promise<AccountDevice[]> {
    const db = getFirestoreModule();
    if (!db) {
      throw new Error('Cloud storage is unavailable on this build.');
    }
    try {
      const snap = await withTimeout(
        db.getDocs<AccountDevice>(db.collection('users', uid, 'devices')),
        FIRESTORE_TIMEOUT_MS,
        'listDevices'
      );
      return snap.docs.map(d => d.data()).filter((d): d is AccountDevice => d !== undefined);
    } catch (e) {
      recordCrashError(e, 'FirestoreAccountCloudStoreAdapter.listDevices');
      throw new Error('Could not read the devices on this account.');
    }
  }

  async upsertDevice(uid: string, device: AccountDevice): Promise<void> {
    const db = getFirestoreModule();
    if (!db) {
      throw new Error('Cloud storage is unavailable on this build.');
    }
    try {
      await withTimeout(
        db.setDoc(db.doc('users', uid, 'devices', device.id), { ...device }, { merge: true }),
        FIRESTORE_TIMEOUT_MS,
        'upsertDevice'
      );
    } catch (e) {
      recordCrashError(e, 'FirestoreAccountCloudStoreAdapter.upsertDevice');
      throw new Error('Could not register this device on the account.');
    }
  }

  async setDeviceActive(uid: string, deviceId: string, active: boolean): Promise<void> {
    const db = getFirestoreModule();
    if (!db) {
      throw new Error('Cloud storage is unavailable on this build.');
    }
    try {
      await withTimeout(
        db.setDoc(db.doc('users', uid, 'devices', deviceId), { active }, { merge: true }),
        FIRESTORE_TIMEOUT_MS,
        'setDeviceActive'
      );
    } catch (e) {
      recordCrashError(e, 'FirestoreAccountCloudStoreAdapter.setDeviceActive');
      throw new Error('Could not update this device on the account.');
    }
  }

  async getEntitlement(uid: string): Promise<CloudEntitlement | null> {
    const db = getFirestoreModule();
    if (!db) return null;
    try {
      const snap = await withTimeout(
        db.getDoc<CloudEntitlement>(db.doc('users', uid, 'entitlement', 'current')),
        FIRESTORE_TIMEOUT_MS,
        'getEntitlement'
      );
      return snap.exists ? (snap.data() ?? null) : null;
    } catch (e) {
      recordCrashError(e, 'FirestoreAccountCloudStoreAdapter.getEntitlement');
      return null;
    }
  }

  async setEntitlement(uid: string, entitlement: CloudEntitlement): Promise<void> {
    const db = getFirestoreModule();
    if (!db) return;
    try {
      await withTimeout(
        db.setDoc(db.doc('users', uid, 'entitlement', 'current'), { ...entitlement }),
        FIRESTORE_TIMEOUT_MS,
        'setEntitlement'
      );
    } catch (e) {
      recordCrashError(e, 'FirestoreAccountCloudStoreAdapter.setEntitlement');
    }
  }
}
