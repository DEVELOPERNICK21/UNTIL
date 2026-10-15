/**
 * Opening at login is the person's choice. Apple's review rules say a Mac app may not start itself at
 * login without consent, and Windows treats an unasked startup entry as a bad citizen, so the app
 * asks once and remembers the answer. This file has no Tauri imports so it can be tested alone.
 */

const ASKED_KEY = 'until.desktop.loginAsked';
/** Older builds switched it on silently the first time; anyone who has that key was never asked. */
const LEGACY_DEFAULT_KEY = 'until.desktop.loginDefaultApplied';

type Reader = Pick<Storage, 'getItem'>;
type Writer = Pick<Storage, 'setItem'>;

/** Ask only when it is off and the person has not answered (or been switched on) before. */
export function shouldAskLaunchAtLogin(storage: Reader, enabled: boolean): boolean {
  if (enabled) return false;
  try {
    return !storage.getItem(ASKED_KEY) && !storage.getItem(LEGACY_DEFAULT_KEY);
  } catch {
    return false;
  }
}

export function markLaunchAtLoginAsked(storage: Writer): void {
  try {
    storage.setItem(ASKED_KEY, '1');
  } catch {
    // Not worth failing over: the worst case is being asked again.
  }
}
