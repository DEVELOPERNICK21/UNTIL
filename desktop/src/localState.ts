/** Last known account state on this computer, so the extra keeps ticking offline. */
export interface DesktopLocalState {
  uid: string | null;
  email: string | null;
  birthDate: string | null;
  deathAge: number | null;
  deviceRegistered: boolean;
  entitlementActive: boolean;
}

const KEY = 'until.desktop.localState';

export const EMPTY_LOCAL_STATE: DesktopLocalState = {
  uid: null,
  email: null,
  birthDate: null,
  deathAge: null,
  deviceRegistered: false,
  entitlementActive: false,
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

/** The extra shows numbers only for a registered, signed-in machine. */
export function panelProfile(state: DesktopLocalState) {
  return {
    signedIn: Boolean(state.uid) && state.deviceRegistered,
    birthDate: state.birthDate,
    deathAge: state.deathAge,
  };
}
