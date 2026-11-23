/**
 * Keeping the screen on while Pause is showing. Best effort: a build without the native method, or a
 * bridge that throws, must never break the screen.
 */

import { NativeModules, Platform } from 'react-native';
import { setKeepScreenAwake } from '../src/shared/platform/keepAwake';

const original = NativeModules.WidgetBridge;

describe('setKeepScreenAwake', () => {
  afterEach(() => {
    NativeModules.WidgetBridge = original;
    jest.restoreAllMocks();
  });

  it.each(['android', 'ios'] as const)('asks the native bridge on %s', os => {
    jest.replaceProperty(Platform, 'OS', os);
    const native = jest.fn();
    NativeModules.WidgetBridge = { setKeepScreenAwake: native };

    setKeepScreenAwake(true);
    setKeepScreenAwake(false);

    expect(native.mock.calls).toEqual([[true], [false]]);
  });

  it('does nothing on other platforms', () => {
    jest.replaceProperty(Platform, 'OS', 'web');
    const native = jest.fn();
    NativeModules.WidgetBridge = { setKeepScreenAwake: native };

    setKeepScreenAwake(true);

    expect(native).not.toHaveBeenCalled();
  });

  it('does nothing, and does not throw, when the native method is missing (an older build)', () => {
    jest.replaceProperty(Platform, 'OS', 'android');
    NativeModules.WidgetBridge = {};
    expect(() => setKeepScreenAwake(true)).not.toThrow();

    NativeModules.WidgetBridge = undefined;
    expect(() => setKeepScreenAwake(true)).not.toThrow();
  });

  it('swallows a bridge that throws', () => {
    jest.replaceProperty(Platform, 'OS', 'ios');
    NativeModules.WidgetBridge = {
      setKeepScreenAwake: () => {
        throw new Error('bridge not ready');
      },
    };
    expect(() => setKeepScreenAwake(false)).not.toThrow();
  });
});
