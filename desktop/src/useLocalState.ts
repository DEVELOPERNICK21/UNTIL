import { useEffect, useState } from 'react';
import { LOCAL_STATE_KEY, loadLocalState, type DesktopLocalState } from './localState';

/**
 * The saved account state, kept current. The panel window talks to the account and saves what it
 * hears; the widgets and the notch island are other windows, so they get a `storage` event the
 * moment it is saved and redraw at once, instead of waiting for their next tick.
 */
export function useLocalState(): DesktopLocalState {
  const [state, setState] = useState(loadLocalState);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === null || event.key === LOCAL_STATE_KEY) setState(loadLocalState());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  return state;
}
