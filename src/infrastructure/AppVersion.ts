/**
 * Safe app version for display and in-app update check.
 * Uses react-native-device-info when available; falls back to package.json to avoid
 * "getVersion is undefined" on Android when the native module isn't ready.
 */


// package.json is at repo root; from src/infrastructure that's ../../package.json
const packageJson = require('../../package.json') as { version?: string };
const PACKAGE_VERSION = typeof packageJson?.version === 'string' ? packageJson.version : '0.0.0';

let cachedVersion: string | null = null;

/**
 * Returns the current app version (native when possible, else package.json).
 * Safe to call on both iOS and Android; never throws.
 */
export function getAppVersion(): string {
  if (cachedVersion != null) return cachedVersion;
  try {
    const DeviceInfo = require('react-native-device-info').default;
    if (DeviceInfo && typeof DeviceInfo.getVersion === 'function') {
      const v = DeviceInfo.getVersion();
      if (typeof v === 'string' && v) {
        cachedVersion = v;
        return cachedVersion;
      }
    }
  } catch {
    // native module not linked or getVersion undefined (e.g. Android)
  }
  cachedVersion = PACKAGE_VERSION;
  return cachedVersion;
}

/**
 * Build number / version code (optional for display).
 */
export function getBuildNumber(): string | null {
  try {
    const DeviceInfo = require('react-native-device-info').default;
    if (DeviceInfo?.getBuildNumber) {
      const n = DeviceInfo.getBuildNumber();
      return typeof n === 'string' ? n : null;
    }
  } catch {
    //
  }
  return null;
}
