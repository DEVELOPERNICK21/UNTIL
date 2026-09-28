/**
 * Guards against re-enabling session replay / touch capture by accident, and
 * checks that recording can never start without a stored opt-in.
 */
import * as fs from 'fs';
import * as path from 'path';

const mockStore = new Map<string, string>();
jest.mock('../src/persistence/mmkv', () => ({
  getString: (key: string) => mockStore.get(key),
  setString: (key: string, value: string) => {
    mockStore.set(key, value);
  },
}));

import {
  POSTHOG_AUTOCAPTURE,
  SESSION_REPLAY_ENABLED,
} from '../src/config/analytics';
import {
  canStartSessionReplay,
  isAnalyticsAllowed,
  isCrashReportingAllowed,
  markUnderMinimumAge,
  setAnalyticsConsent,
  setSessionRecordingConsent,
} from '../src/services/analyticsConsent';

beforeEach(() => mockStore.clear());

describe('privacy defaults', () => {
  it('keeps session replay and touch/screen autocapture off', () => {
    expect(SESSION_REPLAY_ENABLED).toBe(false);
    expect(POSTHOG_AUTOCAPTURE).toEqual({
      captureScreens: false,
      captureTouches: false,
    });
  });

  it('does not ship a session-replay or keystroke SDK', () => {
    const pkg = JSON.parse(
      fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8')
    ) as { dependencies: Record<string, string> };
    const banned = [
      'posthog-react-native-session-replay',
      '@logrocket/react-native',
      '@fullstory/react-native',
      '@sentry/react-native',
      'react-native-clarity',
      '@microsoft/react-native-clarity',
      'mixpanel-react-native',
      'hotjar',
    ];
    expect(Object.keys(pkg.dependencies).filter(d => banned.includes(d))).toEqual(
      []
    );
  });

  it('never allows recording without an explicit opt-in', () => {
    expect(canStartSessionReplay()).toBe(false);
    setSessionRecordingConsent('granted');
    expect(canStartSessionReplay()).toBe(SESSION_REPLAY_ENABLED);
  });

  it('honours a revoked analytics choice', () => {
    expect(isAnalyticsAllowed()).toBe(true);
    setAnalyticsConsent('denied');
    expect(isAnalyticsAllowed()).toBe(false);
    setAnalyticsConsent('granted');
    expect(isAnalyticsAllowed()).toBe(true);
  });

  it('turns off analytics, crash reporting and recording for under-13 users', () => {
    setAnalyticsConsent('granted');
    setSessionRecordingConsent('granted');
    markUnderMinimumAge();
    expect(isAnalyticsAllowed()).toBe(false);
    expect(isCrashReportingAllowed()).toBe(false);
    expect(canStartSessionReplay()).toBe(false);
  });
});
