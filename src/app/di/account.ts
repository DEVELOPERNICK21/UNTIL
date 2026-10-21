/**
 * Account feature. Wired after premium because sign-in re-checks local purchase proof.
 */

import { Platform } from 'react-native';
import { ObserveAuthSessionUseCase } from '../../features/account/domain/useCases/ObserveAuthSessionUseCase';
import { SyncAccountProfileUseCase } from '../../features/account/domain/useCases/SyncAccountProfileUseCase';
import { useThemeStore } from '../../shared/theme/themeStore';
import { RegisterDeviceUseCase } from '../../features/account/domain/useCases/RegisterDeviceUseCase';
import { recordCrashError } from '../../shared/analytics/analytics';
import { BindEntitlementToAccountUseCase } from '../../features/account/domain/useCases/BindEntitlementToAccountUseCase';
import { CompleteAccountSignInUseCase } from '../../features/account/domain/useCases/CompleteAccountSignInUseCase';
import { SignInWithAppleUseCase } from '../../features/account/domain/useCases/SignInWithAppleUseCase';
import { SignInWithGoogleUseCase } from '../../features/account/domain/useCases/SignInWithGoogleUseCase';
import { SignInWithEmailUseCase } from '../../features/account/domain/useCases/SignInWithEmailUseCase';
import { CreateAccountWithEmailUseCase } from '../../features/account/domain/useCases/CreateAccountWithEmailUseCase';
import { SendPasswordResetUseCase } from '../../features/account/domain/useCases/SendPasswordResetUseCase';
import { SignOutUseCase } from '../../features/account/domain/useCases/SignOutUseCase';
import { ReleaseThisDeviceUseCase } from '../../features/account/domain/useCases/ReleaseThisDeviceUseCase';
import { DeleteAccountUseCase } from '../../features/account/domain/useCases/DeleteAccountUseCase';
import { RemoveAccountDeviceUseCase } from '../../features/account/domain/useCases/RemoveAccountDeviceUseCase';
import {
  accountCloudStore,
  authService,
  authSessionRepository,
  deviceIdProvider,
  subscriptionRepository,
  timeRepository,
} from './repositories';
import {
  identifyPurchasesUserUseCase,
  resetPurchasesUserUseCase,
  restorePurchasesUseCase,
  verifySubscriptionUseCase,
} from './premium';
import {
  syncPremiumAfterEntitlementChange,
  syncPremiumBridge,
} from './callbacks';
import { assertAccountAgeGateUseCase } from './ageGate';

/**
 * Account use cases. Wired last because they reuse the purchase use cases above
 * to re-check local entitlement proof before writing it to the account.
 */

const accountPlatform = (): 'ios' | 'android' =>
  Platform.OS === 'ios' ? 'ios' : 'android';

/** Best-effort human label for the device list (e.g. "Pixel 7"). */
function currentDeviceLabel(): string | null {
  try {
    const DeviceInfo = require('react-native-device-info').default;
    const model = DeviceInfo?.getModel?.();
    return typeof model === 'string' && model ? model : null;
  } catch {
    return null;
  }
}

/** App version shown next to each device in the account list. */
function currentAppVersion(): string | null {
  try {
    const DeviceInfo = require('react-native-device-info').default;
    const version = DeviceInfo?.getVersion?.();
    return typeof version === 'string' && version ? version : null;
  } catch {
    return null;
  }
}

export const observeAuthSessionUseCase = new ObserveAuthSessionUseCase(
  authSessionRepository
);

export const syncAccountProfileUseCase = new SyncAccountProfileUseCase(
  timeRepository,
  accountCloudStore,
  {
    get: () => useThemeStore.getState().themeMode,
    set: value => {
      if (value === 'light' || value === 'dark' || value === 'system') {
        void useThemeStore.getState().setThemeMode(value);
      }
    },
  }
);

export const registerDeviceUseCase = new RegisterDeviceUseCase(
  accountCloudStore,
  deviceIdProvider,
  accountPlatform,
  currentDeviceLabel,
  recordCrashError,
  currentAppVersion
);

export const bindEntitlementToAccountUseCase = new BindEntitlementToAccountUseCase(
  subscriptionRepository,
  authSessionRepository,
  accountCloudStore,
  accountPlatform,
  {
    restorePurchases: restorePurchasesUseCase,
    verifySubscription: verifySubscriptionUseCase,
  },
  syncPremiumAfterEntitlementChange,
  recordCrashError
);

export const completeAccountSignInUseCase = new CompleteAccountSignInUseCase(
  authSessionRepository,
  syncAccountProfileUseCase,
  registerDeviceUseCase,
  bindEntitlementToAccountUseCase,
  identifyPurchasesUserUseCase,
  accountCloudStore,
  recordCrashError,
  syncPremiumBridge
);

export const signInWithAppleUseCase = new SignInWithAppleUseCase(
  authService,
  completeAccountSignInUseCase,
  assertAccountAgeGateUseCase
);

export const signInWithGoogleUseCase = new SignInWithGoogleUseCase(
  authService,
  completeAccountSignInUseCase,
  assertAccountAgeGateUseCase
);

export const signInWithEmailUseCase = new SignInWithEmailUseCase(
  authService,
  completeAccountSignInUseCase,
  assertAccountAgeGateUseCase
);

export const createAccountWithEmailUseCase = new CreateAccountWithEmailUseCase(
  authService,
  completeAccountSignInUseCase,
  assertAccountAgeGateUseCase
);

export const sendPasswordResetUseCase = new SendPasswordResetUseCase(authService);

export const signOutUseCase = new SignOutUseCase(
  authService,
  authSessionRepository,
  subscriptionRepository,
  resetPurchasesUserUseCase,
  recordCrashError,
  syncPremiumAfterEntitlementChange,
  new ReleaseThisDeviceUseCase(accountCloudStore, deviceIdProvider, recordCrashError)
);

export const deleteAccountUseCase = new DeleteAccountUseCase(
  authService,
  accountCloudStore,
  resetPurchasesUserUseCase,
  signOutUseCase,
  recordCrashError
);

export const removeAccountDeviceUseCase = new RemoveAccountDeviceUseCase(
  accountCloudStore,
  authSessionRepository,
  deviceIdProvider,
  registerDeviceUseCase,
  bindEntitlementToAccountUseCase,
  syncPremiumBridge
);
