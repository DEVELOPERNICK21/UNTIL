/**
 * Desktop composition root. The phone's src/di.ts stays phone-only; this file
 * wires the same use cases to Firebase JS and browser storage.
 */

import { RegisterDeviceUseCase } from '@until/features/account/domain/useCases/RegisterDeviceUseCase';
import { CompleteDesktopSignInUseCase } from '@until/features/account/domain/useCases/CompleteDesktopSignInUseCase';
import { db } from './firebase';
import { FirestoreJsAccountCloudStore } from './adapters/FirestoreJsAccountCloudStore';
import { LocalStorageDeviceIdProvider, getDesktopPlatform } from './adapters/desktopDevice';

const logError = (error: unknown, context: string) => {
  console.warn(`[UNTIL] ${context}`, error);
};

export const cloudStore = new FirestoreJsAccountCloudStore(db);
export const deviceIdProvider = new LocalStorageDeviceIdProvider();

const registerDevice = new RegisterDeviceUseCase(
  cloudStore,
  deviceIdProvider,
  getDesktopPlatform,
  () => null,
  logError,
);

export const completeDesktopSignIn = new CompleteDesktopSignInUseCase(
  cloudStore,
  registerDevice,
  logError,
);
