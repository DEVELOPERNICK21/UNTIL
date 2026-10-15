import type { CloudEntitlement } from '@until/shared/types';

/** Last known account state on this computer, so the extra keeps ticking offline. */
export interface DesktopLocalState {
  uid: string | null;
  email: string | null;
  birthDate: string | null;
  deathAge: number | null;
  deviceRegistered: boolean;
  entitlementActive: boolean;
  /** When this machine last heard from the account (ms since the epoch). Null before the first time. */
  syncedAt: number | null;
}

const KEY = 'until.desktop.localState';
export const LOCAL_STATE_KEY = KEY;

export const EMPTY_LOCAL_STATE: DesktopLocalState = {
  uid: null,
  email: null,
  birthDate: null,
  deathAge: null,
  deviceRegistered: false,
  entitlementActive: false,
  syncedAt: null,
};

export function loadLocalState(): DesktopLocalState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return EMPTY_LOCAL_STATE;
    return { ...EMPTY_LOCAL_STATE, ...(JSON.parse(raw) as Partial<DesktopLocalState>) };
  } catch {
    return EMPTY_LOCAL_STATE;
  }
}

export function saveLocalState(state: DesktopLocalState): void {
  localStorage.setItem(KEY, JSON.stringify(state));
}

/**
 * `null` means the account has no entitlement. `'unknown'` means the read
 * failed: keep what this machine last knew for the same account, so a network
 * error never strips premium.
 */
export function entitlementAfterRead(
  previous: DesktopLocalState,
  uid: string,
  read: Pick<CloudEntitlement, 'active'> | null | 'unknown',
): boolean {
  if (read === 'unknown') return previous.uid === uid && previous.entitlementActive;
  return read?.active === true;
}

/** The extra shows numbers only for a registered, signed-in machine. */
export function panelProfile(state: DesktopLocalState) {
  return {
    signedIn: Boolean(state.uid) && state.deviceRegistered,
    birthDate: state.birthDate,
    deathAge: state.deathAge,
  };
}
