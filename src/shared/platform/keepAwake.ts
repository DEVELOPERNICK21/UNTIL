/**
 * Keeps the screen from locking while something the person is following is on it (the breathing
 * circle of Pause). Native on both platforms: Android sets the window's keep-screen-on flag, iOS
 * turns off the idle timer. Best effort: a build without the native method does nothing, so the screen
 * simply times out as usual.
 */

import { NativeModules, Platform } from 'react-native';

type KeepAwakeBridge = { setKeepScreenAwake?: (enabled: boolean) => void };

export function setKeepScreenAwake(enabled: boolean): void {
  if (Platform.OS !== 'android' && Platform.OS !== 'ios') return;
  try {
    (NativeModules.WidgetBridge as KeepAwakeBridge | undefined)?.setKeepScreenAwake?.(enabled);
  } catch {
    // An older native build, or the bridge is not ready. Not worth interrupting anyone for.
  }
}
