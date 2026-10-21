const mockLog = jest.fn();
const mockRecord = jest.fn();
jest.mock('@react-native-firebase/app', () => ({
  getApp: () => ({}),
  getApps: () => [{}],
}));
jest.mock('@react-native-firebase/crashlytics', () => ({
  getCrashlytics: () => ({}),
  log: (...a: unknown[]) => mockLog(...a),
  recordError: (...a: unknown[]) => mockRecord(...a),
  setUserId: jest.fn(),
  setAttributes: jest.fn(),
  setCrashlyticsCollectionEnabled: jest.fn(),
}));
jest.mock('../src/shared/analytics/analyticsConsent', () => ({
  isAnalyticsAllowed: () => true,
  isCrashReportingAllowed: () => true,
  subscribeAnalyticsConsent: jest.fn(),
}));
jest.mock('../src/shared/analytics/posthogClient', () => ({
  applyPostHogConsent: jest.fn(),
  capturePostHogEvent: jest.fn(),
  getPostHogClient: () => null,
}));

import { isTransientNetworkError } from '../src/shared/analytics/transientErrors';
import { recordCrashError } from '../src/shared/analytics/analytics';

describe('isTransientNetworkError', () => {
  it.each([
    'Network request failed',
    'TypeError: Network request failed',
    '[firestore/unavailable] The service is currently unavailable.',
    '[firestore/deadline-exceeded] Deadline exceeded',
    'auth/network-request-failed',
    'Request timed out',
    'Failed to fetch',
  ])('treats %p as offline noise', message => {
    expect(isTransientNetworkError(new Error(message))).toBe(true);
  });

  it.each([
    '[firestore/permission-denied] The caller does not have permission',
    'Could not register this device on the account.',
    'Cannot read properties of undefined',
    '',
  ])('keeps %p as a real error', message => {
    expect(isTransientNetworkError(new Error(message))).toBe(false);
  });

  it('copes with non-Error values', () => {
    expect(isTransientNetworkError('Network request failed')).toBe(true);
    expect(isTransientNetworkError(undefined)).toBe(false);
    expect(isTransientNetworkError({ message: 'Network request failed' })).toBe(
      false,
    );
  });
});

describe('recordCrashError', () => {
  beforeEach(() => {
    mockLog.mockReset();
    mockRecord.mockReset();
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('logs offline errors but does not report them', () => {
    recordCrashError(
      new TypeError('Network request failed'),
      'TrialPreviewApiAdapter.sync',
    );
    expect(mockRecord).not.toHaveBeenCalled();
    expect(mockLog).toHaveBeenCalledWith(
      expect.anything(),
      'TrialPreviewApiAdapter.sync',
    );
    expect(mockLog).toHaveBeenCalledWith(
      expect.anything(),
      'offline: Network request failed',
    );
  });

  it('still reports real errors', () => {
    const error = new Error('[firestore/permission-denied] no');
    recordCrashError(error, 'FirestoreAccountCloudStoreAdapter.upsertDevice');
    expect(mockRecord).toHaveBeenCalledWith(expect.anything(), error);
  });
});
