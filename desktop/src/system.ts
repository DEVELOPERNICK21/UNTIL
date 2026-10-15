/**
 * Launch at login and self-update. Both only run in release builds: in
 * `tauri dev` the login item would point at the dev binary, and there is no
 * signed update to compare against. Login is opt-in (see loginConsent.ts).
 */

import { disable, enable, isEnabled } from '@tauri-apps/plugin-autostart';
import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';

const IS_RELEASE = import.meta.env.PROD;
export const UPDATE_CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;

export async function getLaunchAtLogin(): Promise<boolean | null> {
  if (!IS_RELEASE) return null;
  return isEnabled();
}

export async function setLaunchAtLogin(on: boolean): Promise<void> {
  if (on) await enable();
  else await disable();
}

/** Downloads and installs a newer signed build. Resolves true when a restart will apply it. */
export async function installUpdateIfAny(): Promise<boolean> {
  if (!IS_RELEASE) return false;
  const update = await check();
  if (!update) return false;
  await update.downloadAndInstall();
  return true;
}

export async function restartApp(): Promise<void> {
  await relaunch();
}
