/**
 * Asks the website which build is current for this platform and turns the answer into a decision
 * (see domain/updatePolicy). The sheet only draws that decision.
 */

import { Linking, Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import { getNumber, setNumber } from '../../../shared/persistence/mmkv';
import { STORAGE_KEYS } from '../../../shared/persistence/schema';
import { recordCrashError } from '../../../shared/analytics/analytics';
import { SITE_URL } from '../../../config/storeUrls';
import { MS_PER_HOUR, MS_PER_SECOND } from '../../../shared/time/constants';
import { withTimeout } from '../../../shared/utils/withTimeout';
import {
  NO_SNOOZE,
  decideUpdate,
  isTrustedStoreUrl,
  parseUpdateConfig,
  snoozeAfterDismiss,
  type SnoozeState,
  type UpdateDecision,
  type UpdatePlatform,
} from '../domain/updatePolicy';

/** Served by the website (website/src/app/api/update-config); the values live in website/src/domain/appUpdate.ts. */
const UPDATE_CONFIG_URL = `${SITE_URL}/api/update-config`;
const FETCH_TIMEOUT_MS = 8 * MS_PER_SECOND;
/** After an answer of "nothing to show", ask again no sooner than this. */
const QUIET_CHECK_EVERY_MS = 6 * MS_PER_HOUR;

function currentPlatform(): UpdatePlatform | null {
  if (Platform.OS === 'android') return 'android';
  if (Platform.OS === 'ios') return 'ios';
  return null;
}

/** Android versionCode / iOS build number: the integer the config compares against. 0 when unreadable. */
export function getInstalledBuild(): number {
  try {
    const build = Number.parseInt(String(DeviceInfo.getBuildNumber()), 10);
    return Number.isFinite(build) ? build : 0;
  } catch {
    return 0;
  }
}

function readSnooze(): SnoozeState {
  const build = getNumber(STORAGE_KEYS.UPDATE_SNOOZED_BUILD);
  if (build == null) return NO_SNOOZE;
  return {
    build,
    count: getNumber(STORAGE_KEYS.UPDATE_SNOOZE_COUNT) ?? 0,
    at: getNumber(STORAGE_KEYS.UPDATE_SNOOZE_AT) ?? null,
  };
}

/** Remember that the person said "Not now" to this build. */
export function snoozeUpdate(latestBuild: number, now: number = Date.now()): void {
  const next = snoozeAfterDismiss(readSnooze(), latestBuild, now);
  setNumber(STORAGE_KEYS.UPDATE_SNOOZED_BUILD, next.build ?? 0);
  setNumber(STORAGE_KEYS.UPDATE_SNOOZE_COUNT, next.count);
  setNumber(STORAGE_KEYS.UPDATE_SNOOZE_AT, next.at ?? now);
}

export function shouldSkipUpdateCheck(now: number = Date.now()): boolean {
  const last = getNumber(STORAGE_KEYS.UPDATE_LAST_CHECK_AT);
  return last != null && now - last < QUIET_CHECK_EVERY_MS;
}

async function fetchConfigJson(): Promise<unknown | null> {
  try {
    const response = await withTimeout(
      fetch(UPDATE_CONFIG_URL, { method: 'GET', headers: { Accept: 'application/json' } }),
      FETCH_TIMEOUT_MS,
      'updateConfig',
    );
    if (!response.ok) return null;
    return await response.json();
  } catch (e) {
    recordCrashError(e, 'updateService.fetchConfigJson');
    return null;
  }
}

/**
 * The answer for this launch. A "required" or "optional" answer is asked again next launch (so a
 * required update can never be skipped by the throttle); a quiet answer is cached for a few hours.
 */
export async function checkForAppUpdate(now: number = Date.now()): Promise<UpdateDecision> {
  const platform = currentPlatform();
  if (!platform) return { kind: 'none' };

  const json = await fetchConfigJson();
  if (json == null) return { kind: 'none' };

  const decision = decideUpdate({
    installedBuild: getInstalledBuild(),
    config: parseUpdateConfig(json, platform),
    snooze: readSnooze(),
    now,
  });
  if (decision.kind === 'none') setNumber(STORAGE_KEYS.UPDATE_LAST_CHECK_AT, now);
  return decision;
}

/** Opens our own store listing. The URL came over the network, so it is checked again here. */
export async function openStoreListing(url: string): Promise<void> {
  const platform = currentPlatform();
  if (!platform || !isTrustedStoreUrl(platform, url)) return;
  try {
    await Linking.openURL(url);
  } catch (e) {
    recordCrashError(e, 'updateService.openStoreListing');
  }
}
