import { Platform, Linking } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import { getNumber, setNumber } from '../persistence/mmkv';

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
}

// TODO: point this to your real remote JSON on your website.

const UPDATE_CONFIG_URL =
  'https://developernick1-until.vercel.app/api/update-config.json';

const LAST_CHECK_KEY = 'last_update_check_at';
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

  const currentVersion = DeviceInfo.getVersion();
  const { minimum_supported_version, latest_version } = config;
  const storeUrl = getStoreUrl(config);

  if (compareSemver(currentVersion, minimum_supported_version) === -1) {
    return {
      type: 'FORCE_UPDATE',
      storeUrl,
    };
  }

  if (compareSemver(currentVersion, latest_version) === -1) {
    return {
      type: 'OPTIONAL_UPDATE',
      storeUrl,
    };
  }

  return { type: 'NO_UPDATE' };
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
