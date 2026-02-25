/**
 * In-app update check using sp-react-native-in-app-updates.
 * Infrastructure adapter: implements app-update check; guards against missing
 * native module (e.g. Android checkNeedsUpdate undefined).
 */

import { Platform } from 'react-native';
import { getAppVersion } from './AppVersion';

type UpdatesAdapter = {
  checkNeedsUpdate: (opts: { curVersion: string }) => Promise<{ shouldUpdate: boolean }>;
  startUpdate: (opts: Record<string, unknown>) => Promise<void>;
};

let cached: UpdatesAdapter | null = null;
let resolved = false;

function getInAppUpdatesSafe(): UpdatesAdapter | null {
  if (cached !== null) return cached;
  if (resolved) return null;
  try {
    const SpInAppUpdates = require('sp-react-native-in-app-updates').default;
    if (typeof SpInAppUpdates !== 'function') {
      resolved = true;
      return null;
    }
    const instance = new SpInAppUpdates(__DEV__);
    if (!instance || typeof instance.checkNeedsUpdate !== 'function') {
      resolved = true;
      return null;
    }
    cached = {
      checkNeedsUpdate: instance.checkNeedsUpdate.bind(instance),
      startUpdate: (instance.startUpdate && instance.startUpdate.bind(instance)) || (() => Promise.resolve()),
    };
    return cached;
  } catch {
    resolved = true;
    return null;
  }
}

/**
 * Check if a newer version is available on the store and prompt to update.
 * No-op if the native module is unavailable (e.g. Android not linked).
 */
export function checkForAppUpdate(): void {
  const updates = getInAppUpdatesSafe();
  if (!updates) return;
  const curVersion = getAppVersion();
  updates
    .checkNeedsUpdate({ curVersion })
    .then((result) => {
      if (!result?.shouldUpdate) return;
      let updateOptions: Record<string, unknown> = {};
      if (Platform.OS === 'android') {
        try {
          const { IAUUpdateKind } = require('sp-react-native-in-app-updates');
          updateOptions = { updateType: IAUUpdateKind?.FLEXIBLE ?? 0 };
        } catch {
          return;
        }
      } else if (Platform.OS === 'ios') {
        updateOptions = {
          title: 'Update available',
          message: 'A new version of Until is available. Would you like to update now?',
          buttonUpgradeText: 'Update',
          buttonCancelText: 'Later',
        };
      }
      updates.startUpdate(updateOptions);
    })
    .catch(() => {
      // Store unreachable, user not signed in, or other failure — ignore
    });
}
