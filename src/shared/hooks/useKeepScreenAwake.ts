import { useEffect } from 'react';
import { setKeepScreenAwake } from '../platform/keepAwake';

/** Keeps the screen on while `active` is true, and always lets go when the screen goes away. */
export function useKeepScreenAwake(active: boolean = true): void {
  useEffect(() => {
    if (!active) return undefined;
    setKeepScreenAwake(true);
    return () => setKeepScreenAwake(false);
  }, [active]);
}
