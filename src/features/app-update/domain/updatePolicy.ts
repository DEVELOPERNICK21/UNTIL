/**
 * When to tell someone a newer version is out, and when to insist. Pure rules: the service reads
 * the remote config and the stored snooze, the sheet only draws the answer.
 *
 * Android and iOS are compared on their own build numbers (Android versionCode, iOS CFBundleVersion).
 * They are unrelated, and iOS's marketing version barely moves, so one shared number cannot work.
 */

import { ANDROID_PACKAGE_NAME } from '../../../config/storeUrls';
import { MS_PER_DAY } from '../../../shared/time/constants';

export type UpdatePlatform = 'android' | 'ios';

export interface PlatformUpdateConfig {
  latestBuild: number;
  /** Builds below this must update (the sheet cannot be dismissed). */
  minimumBuild: number;
  versionName: string | null;
  storeUrl: string | null;
  notes: string[];
}

export type UpdateDecision =
  | { kind: 'none' }
  | {
      kind: 'optional' | 'required';
      latestBuild: number;
      versionName: string | null;
      notes: string[];
      storeUrl: string;
    };

export interface SnoozeState {
  /** The latest build the person last said "Not now" to. */
  build: number | null;
  count: number;
  at: number | null;
}

export const NO_SNOOZE: SnoozeState = { build: null, count: 0, at: null };

/** "Not now" hides the sheet this long. */
export const SNOOZE_MS = 3 * MS_PER_DAY;
/** After this many "Not now" for one build the sheet stays away until a newer build is out. */
export const MAX_SNOOZES = 2;

const MAX_NOTES = 3;
const MAX_NOTE_LENGTH = 90;
const MAX_VERSION_NAME_LENGTH = 20;

const PACKAGE = ANDROID_PACKAGE_NAME.replace(/\./g, '\\.');
const ANDROID_URL = new RegExp(
  `^(https://play\\.google\\.com/store/apps/details\\?id=${PACKAGE}|market://details\\?id=${PACKAGE})(&\\S*)?$`,
);
const IOS_URL =
  /^(https:\/\/apps\.apple\.com\/([a-z]{2}\/)?app\/([^/\s]+\/)?id\d+(\?\S*)?|itms-apps:\/\/apps\.apple\.com\/\S*id\d+\S*)$/;

/** The config comes over the network, so only our own store listing may ever be opened. */
export function isTrustedStoreUrl(
  platform: UpdatePlatform,
  url: unknown,
): url is string {
  if (typeof url !== 'string') return false;
  return (platform === 'android' ? ANDROID_URL : IOS_URL).test(url);
}

function toBuild(value: unknown): number | null {
  const n = typeof value === 'string' ? Number(value.trim()) : value;
  return typeof n === 'number' && Number.isInteger(n) && n > 0 ? n : null;
}

/** Reads one platform's section of the remote config; anything malformed becomes null (no prompt). */
export function parseUpdateConfig(
  raw: unknown,
  platform: UpdatePlatform,
): PlatformUpdateConfig | null {
  if (!raw || typeof raw !== 'object') return null;
  const section = (raw as Record<string, unknown>)[platform];
  if (!section || typeof section !== 'object') return null;
  const s = section as Record<string, unknown>;

  const latestBuild = toBuild(s.latest_build);
  if (latestBuild == null) return null;
  // The floor can never sit above the newest build, or nobody could satisfy it.
  const minimumBuild = Math.min(toBuild(s.minimum_build) ?? 1, latestBuild);

  const notes = Array.isArray(s.notes)
    ? s.notes
        .filter((n): n is string => typeof n === 'string')
        .map(n => n.trim().slice(0, MAX_NOTE_LENGTH))
        .filter(n => n.length > 0)
        .slice(0, MAX_NOTES)
    : [];
  const versionName =
    typeof s.version_name === 'string' && s.version_name.trim()
      ? s.version_name.trim().slice(0, MAX_VERSION_NAME_LENGTH)
      : null;

  return {
    latestBuild,
    minimumBuild,
    versionName,
    storeUrl: isTrustedStoreUrl(platform, s.store_url) ? s.store_url : null,
    notes,
  };
}

function isSnoozed(
  latestBuild: number,
  snooze: SnoozeState,
  now: number,
): boolean {
  if (snooze.build !== latestBuild) return false;
  if (snooze.count >= MAX_SNOOZES) return true;
  return snooze.at != null && now - snooze.at < SNOOZE_MS;
}

export function decideUpdate(input: {
  installedBuild: number;
  config: PlatformUpdateConfig | null;
  snooze: SnoozeState;
  now: number;
}): UpdateDecision {
  const { installedBuild, config, snooze, now } = input;
  // No config, no listing to send them to, or a build number we could not read: stay quiet.
  if (!config || !config.storeUrl) return { kind: 'none' };
  if (!Number.isFinite(installedBuild) || installedBuild <= 0)
    return { kind: 'none' };

  const shared = {
    latestBuild: config.latestBuild,
    versionName: config.versionName,
    notes: config.notes,
    storeUrl: config.storeUrl,
  };
  if (installedBuild < config.minimumBuild)
    return { kind: 'required', ...shared };
  if (installedBuild >= config.latestBuild) return { kind: 'none' };
  if (isSnoozed(config.latestBuild, snooze, now)) return { kind: 'none' };
  return { kind: 'optional', ...shared };
}

/** The snooze after one more "Not now"; the count restarts for a newer build. */
export function snoozeAfterDismiss(
  previous: SnoozeState,
  latestBuild: number,
  now: number,
): SnoozeState {
  const count = previous.build === latestBuild ? previous.count + 1 : 1;
  return { build: latestBuild, count, at: now };
}
