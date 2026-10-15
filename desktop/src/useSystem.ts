import { useCallback, useEffect, useState } from 'react';
import {
  UPDATE_CHECK_INTERVAL_MS,
  applyLaunchAtLoginDefault,
  getLaunchAtLogin,
  installUpdateIfAny,
  setLaunchAtLogin,
} from './system';

/**
 * Launch at login and self-update, for the bar at the foot of the panel. In `tauri dev` both are
 * switched off (see system.ts): `launchAtLogin` stays null, so the bar shows no switch.
 */
export function useSystem() {
  const [launchAtLogin, setLogin] = useState<boolean | null>(null);
  const [updateReady, setUpdateReady] = useState(false);

  useEffect(() => {
    let alive = true;

    void (async () => {
      try {
        await applyLaunchAtLoginDefault();
        const on = await getLaunchAtLogin();
        if (alive) setLogin(on);
      } catch {
        // No login item to read (a plain browser, or a build without the plugin).
      }
    })();

    const check = () => {
      void installUpdateIfAny()
        .then(ready => {
          if (alive && ready) setUpdateReady(true);
        })
        .catch(() => {});
    };
    check();
    const id = setInterval(check, UPDATE_CHECK_INTERVAL_MS);

    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  const toggleLaunchAtLogin = useCallback((on: boolean) => {
    setLogin(on);
    void setLaunchAtLogin(on).catch(() => setLogin(!on));
  }, []);

  return { launchAtLogin, toggleLaunchAtLogin, updateReady };
}
