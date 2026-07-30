/**
 * IAccountCloudStore - Port for the cloud (Firestore) account store.
 * Holds profile sync, registered devices, and cloud entitlement per uid.
 */

import type { AccountDevice, CloudEntitlement, CloudUserProfile } from '../../types';

export interface IAccountCloudStore {
  getProfile(uid: string): Promise<CloudUserProfile | null>;
  upsertProfile(uid: string, patch: Partial<CloudUserProfile>): Promise<void>;
  listDevices(uid: string): Promise<AccountDevice[]>;
  upsertDevice(uid: string, device: AccountDevice): Promise<void>;
  setDeviceActive(uid: string, deviceId: string, active: boolean): Promise<void>;
  getEntitlement(uid: string): Promise<CloudEntitlement | null>;
  setEntitlement(uid: string, entitlement: CloudEntitlement): Promise<void>;
}
