/**
 * Launch at login and self-update. Both only run in release builds: in
 * `tauri dev` the login item would point at the dev binary, and there is no
 * signed update to compare against.
 */

import { disable, enable, isEnabled } from '@tauri-apps/plugin-autostart';
import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';

const IS_RELEASE = import.meta.env.PROD;
const LOGIN_DEFAULT_KEY = 'until.desktop.loginDefaultApplied';
export const UPDATE_CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;

/** A menu bar app that is gone after a restart feels broken, so default to on once. */
export async function applyLaunchAtLoginDefault(): Promise<void> {
  if (!IS_RELEASE || localStorage.getItem(LOGIN_DEFAULT_KEY)) return;
  localStorage.setItem(LOGIN_DEFAULT_KEY, '1');
  if (!(await isEnabled())) await enable();
}

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
