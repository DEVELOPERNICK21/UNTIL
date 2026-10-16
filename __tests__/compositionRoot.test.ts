/**
 * The composition root (app/di) is the one module that builds every repository and use case. The
 * unit tests never load it whole, so this smoke test does: every section must evaluate in order,
 * every use case must exist, and start-up wiring (widget sync, retention notifications) must run.
 * Native modules are replaced with in-memory stand-ins.
 */

jest.mock('react-native-mmkv', () => {
  const createMMKV = () => {
    const store = new Map<string, unknown>();
    return {
      set: (key: string, value: unknown) => store.set(key, value),
      getString: (key: string) => (typeof store.get(key) === 'string' ? store.get(key) : undefined),
      getNumber: (key: string) => (typeof store.get(key) === 'number' ? store.get(key) : undefined),
      getBoolean: (key: string) => (typeof store.get(key) === 'boolean' ? store.get(key) : undefined),
      contains: (key: string) => store.has(key),
      remove: (key: string) => store.delete(key),
      getAllKeys: () => Array.from(store.keys()),
      clearAll: () => store.clear(),
    };
  };
  return { createMMKV, MMKV: createMMKV };
});
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(() => Promise.resolve(null)),
    setItem: jest.fn(() => Promise.resolve()),
    removeItem: jest.fn(() => Promise.resolve()),
  },
}));
jest.mock('@react-native-firebase/app', () => ({}));
jest.mock('@react-native-firebase/auth', () => ({}));
jest.mock('@react-native-firebase/firestore', () => ({}));
jest.mock('@react-native-firebase/analytics', () => ({}));
jest.mock('@react-native-firebase/crashlytics', () => ({}));
jest.mock('@react-native-google-signin/google-signin', () => ({ GoogleSignin: {} }));
jest.mock('@invertase/react-native-apple-authentication', () => ({}));
jest.mock('react-native-purchases', () => ({}));
jest.mock('react-native-purchases-ui', () => ({}));
jest.mock('@notifee/react-native', () => ({}));
jest.mock('posthog-react-native', () => ({}));
jest.mock('react-native-device-info', () => ({ default: {} }));
jest.mock('sp-react-native-in-app-updates', () => ({}));
jest.mock('react-native-store-review', () => ({}));

import * as di from '../src/app/di';
import { widgetSync } from '../src/shared/platform/widgetSync';

describe('composition root', () => {
  it('builds every use case, repository and adapter it exports', () => {
    const missing = Object.entries(di)
      .filter(([, value]) => value === undefined || value === null)
      .map(([name]) => name);
    expect(missing).toEqual([]);
    expect(Object.keys(di).length).toBeGreaterThan(100);
  });

  it('registers the widget sync port at start-up', () => {
    expect(() => widgetSync.syncWidgetCache()).not.toThrow();
  });

  it('wires the use cases the hooks rely on', () => {
    expect(typeof di.observeTimeStateUseCase.observe).toBe('function');
    expect(typeof di.getAccessStateUseCase.execute).toBe('function');
    expect(typeof di.signOutUseCase.execute).toBe('function');
    expect(typeof di.runAppOpenSideEffectsUseCase.execute).toBe('function');
  });
});
