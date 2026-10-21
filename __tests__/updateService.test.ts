const mockNumbers = new Map<string, number>();
jest.mock('../src/shared/persistence/mmkv', () => ({
  getNumber: (key: string) => mockNumbers.get(key),
  setNumber: (key: string, value: number) => void mockNumbers.set(key, value),
}));
jest.mock('../src/shared/analytics/analytics', () => ({
  recordCrashError: jest.fn(),
}));

let mockOs: string = 'android';
const mockOpenURL = jest.fn().mockResolvedValue(undefined);
jest.mock('react-native', () => ({
  Platform: {
    get OS() {
      return mockOs;
    },
  },
  Linking: { openURL: (...a: unknown[]) => mockOpenURL(...a) },
}));
let mockBuild: string = '30';
jest.mock('react-native-device-info', () => ({
  __esModule: true,
  default: { getBuildNumber: () => mockBuild },
}));

import {
  checkForAppUpdate,
  getInstalledBuild,
  openStoreListing,
  shouldSkipUpdateCheck,
  snoozeUpdate,
} from '../src/features/app-update/services/updateService';
import { SNOOZE_MS } from '../src/features/app-update/domain/updatePolicy';
import { STORAGE_KEYS } from '../src/shared/persistence/schema';
import { MS_PER_HOUR } from '../src/shared/time/constants';

const PLAY = 'https://play.google.com/store/apps/details?id=app.until.time';
const NOW = 1_000_000_000_000;

function serve(body: unknown, ok = true) {
  (global as unknown as { fetch: unknown }).fetch = jest
    .fn()
    .mockResolvedValue({
      ok,
      json: async () => body,
    });
}

const remote = {
  schema: 2,
  android: {
    latest_build: 40,
    minimum_build: 1,
    version_name: '1.4',
    store_url: PLAY,
    notes: ['Fewer crashes'],
  },
  ios: {
    latest_build: 12,
    store_url: 'https://apps.apple.com/app/until/id1234567890',
  },
};

describe('app update service', () => {
  beforeEach(() => {
    mockNumbers.clear();
    mockOs = 'android';
    mockBuild = '30';
    mockOpenURL.mockClear();
  });

  it('reads the installed build as a number, or 0 when it cannot', () => {
    expect(getInstalledBuild()).toBe(30);
    mockBuild = 'abc';
    expect(getInstalledBuild()).toBe(0);
  });

  it('offers the update when this platform has a newer build', async () => {
    serve(remote);
    const decision = await checkForAppUpdate(NOW);
    expect(decision).toMatchObject({
      kind: 'optional',
      latestBuild: 40,
      versionName: '1.4',
      storeUrl: PLAY,
    });
    // A prompt is asked about again next launch, so it is not throttled.
    expect(mockNumbers.has(STORAGE_KEYS.UPDATE_LAST_CHECK_AT)).toBe(false);
  });

  it('compares iOS with the iOS build, never the Android one', async () => {
    mockOs = 'ios';
    mockBuild = '12';
    serve(remote);
    // iOS is at build 12 of 12 while Android's 40 would have called it out of date.
    expect((await checkForAppUpdate(NOW)).kind).toBe('none');
  });

  it('stays quiet and remembers it for a few hours when up to date', async () => {
    mockBuild = '40';
    serve(remote);
    expect((await checkForAppUpdate(NOW)).kind).toBe('none');
    expect(shouldSkipUpdateCheck(NOW + MS_PER_HOUR)).toBe(true);
    expect(shouldSkipUpdateCheck(NOW + 7 * MS_PER_HOUR)).toBe(false);
  });

  it('does not throttle or prompt when the website cannot be reached', async () => {
    (global as unknown as { fetch: unknown }).fetch = jest
      .fn()
      .mockRejectedValue(new TypeError('Network request failed'));
    expect((await checkForAppUpdate(NOW)).kind).toBe('none');
    serve({}, false);
    expect((await checkForAppUpdate(NOW)).kind).toBe('none');
    expect(shouldSkipUpdateCheck(NOW)).toBe(false);
  });

  it('does nothing on a platform without a store', async () => {
    mockOs = 'web';
    serve(remote);
    expect((await checkForAppUpdate(NOW)).kind).toBe('none');
  });

  it('keeps quiet after "Not now" until the snooze ends', async () => {
    serve(remote);
    snoozeUpdate(40, NOW);
    expect((await checkForAppUpdate(NOW + 1)).kind).toBe('none');
    expect((await checkForAppUpdate(NOW + SNOOZE_MS)).kind).toBe('optional');
  });

  it('opens only our own listing for this platform', async () => {
    await openStoreListing(PLAY);
    expect(mockOpenURL).toHaveBeenCalledWith(PLAY);

    mockOpenURL.mockClear();
    await openStoreListing('https://evil.example/store');
    await openStoreListing('https://apps.apple.com/app/until/id1234567890'); // an iOS link on Android
    expect(mockOpenURL).not.toHaveBeenCalled();
  });
});
