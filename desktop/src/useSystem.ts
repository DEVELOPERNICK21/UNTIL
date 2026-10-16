import { useCallback, useEffect, useState } from 'react';
import { getVersion } from '@tauri-apps/api/app';
import { markLaunchAtLoginAsked, shouldAskLaunchAtLogin } from './loginConsent';
import {
  UPDATE_CHECK_INTERVAL_MS,
  getLaunchAtLogin,
  installUpdateIfAny,
  setLaunchAtLogin,
} from './system';

/**
 * Launch at login and self-update, for the bar at the foot of the panel. In `tauri dev` both are
 * switched off (see system.ts): `launchAtLogin` stays null, so the bar shows no switch. Opening at
 * login is never switched on for the person: `askLaunchAtLogin` is true once, until they answer.
 */
export function useSystem() {
  const [launchAtLogin, setLogin] = useState<boolean | null>(null);
  const [updateReady, setUpdateReady] = useState(false);
  const [askLaunchAtLogin, setAsk] = useState(false);
  const [version, setVersion] = useState('');

  useEffect(() => {
    let alive = true;

    void getVersion()
      .then(v => alive && setVersion(v))
      .catch(() => {});

    void (async () => {
      try {
        const on = await getLaunchAtLogin();
        if (!alive) return;
        setLogin(on);
        if (on == null) return;
        if (on) markLaunchAtLoginAsked(localStorage);
        else if (shouldAskLaunchAtLogin(localStorage, on)) setAsk(true);
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

  const answerLaunchAtLogin = useCallback(
    (on: boolean) => {
      markLaunchAtLoginAsked(localStorage);
      setAsk(false);
      if (on) toggleLaunchAtLogin(true);
    },
    [toggleLaunchAtLogin],
  );

  return {
    launchAtLogin,
    toggleLaunchAtLogin,
    askLaunchAtLogin,
    answerLaunchAtLogin,
    updateReady,
    version,
  };
}
