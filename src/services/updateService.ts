import { Platform, Linking } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import { getNumber, getString, setNumber, setString } from '../persistence/mmkv';
import { STORAGE_KEYS } from '../persistence/schema';

export type UpdateType = 'FORCE_UPDATE' | 'OPTIONAL_UPDATE' | 'NO_UPDATE';

export interface UpdateConfig {
  latest_version: string;
  minimum_supported_version: string;
  force_update?: boolean;
  store_url_android?: string;
  store_url_ios?: string;
}

export interface UpdateCheckResult {
  type: UpdateType;
  storeUrl?: string;
  latestVersion?: string;
}

// Remote JSON config for app updates. Served from your marketing site.
// Implement a Next.js (or similar) API route at this path that returns the
// config in the documented format.
const UPDATE_CONFIG_URL =
  'https://developernick1-until.vercel.app/api/update-config';

const LAST_CHECK_KEY = STORAGE_KEYS.UPDATE_LAST_CHECK_AT;
const DISMISSED_VERSION_KEY = STORAGE_KEYS.UPDATE_DISMISSED_VERSION;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export function parseSemver(version: string): [number, number, number] {
  const [major, minor, patch] = version.split('.').map(part => {
    const n = Number(part.replace(/[^\d]/g, ''));
    return Number.isFinite(n) ? n : 0;
  });

  return [major ?? 0, minor ?? 0, patch ?? 0] as [number, number, number];
}

export function compareSemver(a: string, b: string): -1 | 0 | 1 {
  const [aMaj, aMin, aPatch] = parseSemver(a);
  const [bMaj, bMin, bPatch] = parseSemver(b);

  if (aMaj !== bMaj) return aMaj < bMaj ? -1 : 1;
  if (aMin !== bMin) return aMin < bMin ? -1 : 1;
  if (aPatch !== bPatch) return aPatch < bPatch ? -1 : 1;
  return 0;
}

/** Integer versionCode comparison (Play Store version code, e.g. 7 vs 8). */
export function compareVersionCode(a: string, b: string): -1 | 0 | 1 {
  const aNum = parseInt(a.replace(/[^\d]/g, ''), 10) || 0;
  const bNum = parseInt(b.replace(/[^\d]/g, ''), 10) || 0;
  if (aNum < bNum) return -1;
  if (aNum > bNum) return 1;
  return 0;
}

/**
 * Installed version for update checks. On Android this must be versionCode
 * (build.gradle versionCode), which matches Play Console and update-config.
 */
export async function getInstalledVersionForUpdateCheck(): Promise<string> {
  try {
    const deviceInfo = DeviceInfo as typeof DeviceInfo & {
      getBuildNumberSync?: () => string;
    };
    const syncBuild = deviceInfo.getBuildNumberSync?.();
    if (typeof syncBuild === 'string' && syncBuild.trim()) {
      return syncBuild.trim();
    }

    const build: unknown = deviceInfo.getBuildNumber();
    if (typeof build === 'string' && build.trim()) {
      return build.trim();
    }
    if (
      build &&
      typeof build === 'object' &&
      'then' in build &&
      typeof (build as Promise<unknown>).then === 'function'
    ) {
      const resolved = await (build as Promise<string>);
      if (typeof resolved === 'string' && resolved.trim()) {
        return resolved.trim();
      }
    }

    const marketing = DeviceInfo.getVersion();
    if (typeof marketing === 'string' && marketing.trim()) {
      return marketing.trim();
    }
  } catch {
    // fall through
  }
  return '0';
}

export function wasOptionalUpdateDismissed(latestVersion: string): boolean {
  return getString(DISMISSED_VERSION_KEY) === latestVersion;
}

export function recordOptionalUpdateDismissed(latestVersion: string): void {
  setString(DISMISSED_VERSION_KEY, latestVersion);
}

export function getStoreUrl(config: UpdateConfig): string | undefined {
  if (Platform.OS === 'android') {
    return config.store_url_android;
  }
  if (Platform.OS === 'ios') {
    return config.store_url_ios;
  }
  return undefined;
}

export function shouldSkipUpdateCheck(now: number = Date.now()): boolean {
  // return false; // TEMP: always check for testing
  const last = getNumber(LAST_CHECK_KEY);
  if (!last) return false;
  return now - last < ONE_DAY_MS;
}

export function recordUpdateCheck(now: number = Date.now()): void {
  setNumber(LAST_CHECK_KEY, now);
}

export async function fetchUpdateConfig(): Promise<UpdateConfig | null> {
  try {
    const response = await fetch(UPDATE_CONFIG_URL, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      return null;
    }

    const json = (await response.json()) as UpdateConfig;
    return json;
  } catch {
    return null;
  }
}

export async function checkForAppUpdate(): Promise<UpdateCheckResult> {
  const config = await fetchUpdateConfig();
  if (!config) {
    return { type: 'NO_UPDATE' };
  }

  // Compare against versionCode (Android) / build number (iOS) — must match update-config.
  const currentVersion = await getInstalledVersionForUpdateCheck();
  const { minimum_supported_version, latest_version } = config;
  const storeUrl = getStoreUrl(config);
  const compare = compareVersionCode;

  if (compare(currentVersion, minimum_supported_version) === -1) {
    return {
      type: 'FORCE_UPDATE',
      storeUrl,
      latestVersion: latest_version,
    };
  }

  // Up to date or ahead of store (e.g. internal build) — no prompt.
  if (compare(currentVersion, latest_version) >= 0) {
    return { type: 'NO_UPDATE' };
  }

  if (wasOptionalUpdateDismissed(latest_version)) {
    return { type: 'NO_UPDATE' };
  }

  return {
    type: 'OPTIONAL_UPDATE',
    storeUrl,
    latestVersion: latest_version,
  };
}

export async function openStoreUrl(url?: string): Promise<void> {
  if (!url) return;
  try {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    }
  } catch {
    // ignore
  }
}

// DEBUG / manual testing helper – call from a button to inspect behaviour.
export async function testUpdateNow(): Promise<void> {
  try {
    console.log('[UpdateTest] App version (name):', DeviceInfo.getVersion());
    console.log(
      '[UpdateTest] Build / versionCode:',
      await getInstalledVersionForUpdateCheck(),
    );
    console.log('[UpdateTest] URL:', UPDATE_CONFIG_URL);

    const response = await fetch(UPDATE_CONFIG_URL, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    console.log(
      '[UpdateTest] HTTP status:',
      response.status,
      'ok:',
      response.ok,
    );

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      console.log('[UpdateTest] Non-OK response body:', text);
      return;
    }

    const config = (await response.json()) as UpdateConfig;
    console.log('[UpdateTest] Remote config parsed:', config);

    const result = await checkForAppUpdate();
    console.log(
      '[UpdateTest] Result:',
      result.type,
      'storeUrl:',
      result.storeUrl,
    );
  } catch (e) {
    console.log('[UpdateTest] Error while testing update:', e);
  }
}
