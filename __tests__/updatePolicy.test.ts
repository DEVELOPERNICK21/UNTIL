import {
  MAX_SNOOZES,
  NO_SNOOZE,
  SNOOZE_MS,
  decideUpdate,
  isTrustedStoreUrl,
  parseUpdateConfig,
  snoozeAfterDismiss,
  type PlatformUpdateConfig,
} from '../src/features/app-update/domain/updatePolicy';

const PLAY = 'https://play.google.com/store/apps/details?id=app.until.time';
const APPLE = 'https://apps.apple.com/app/until/id1234567890';
const NOW = 1_000_000_000_000;

const config = (
  over: Partial<PlatformUpdateConfig> = {},
): PlatformUpdateConfig => ({
  latestBuild: 40,
  minimumBuild: 1,
  versionName: '1.4',
  storeUrl: PLAY,
  notes: ['Fewer crashes'],
  ...over,
});

describe('isTrustedStoreUrl', () => {
  it('accepts only our own listing on each platform', () => {
    expect(isTrustedStoreUrl('android', PLAY)).toBe(true);
    expect(isTrustedStoreUrl('android', `${PLAY}&hl=en`)).toBe(true);
    expect(
      isTrustedStoreUrl('android', 'market://details?id=app.until.time'),
    ).toBe(true);
    expect(isTrustedStoreUrl('ios', APPLE)).toBe(true);
    expect(
      isTrustedStoreUrl(
        'ios',
        'https://apps.apple.com/in/app/until/id1234567890',
      ),
    ).toBe(true);
    expect(
      isTrustedStoreUrl('ios', 'itms-apps://apps.apple.com/app/id1234567890'),
    ).toBe(true);
  });

  it('rejects other apps, other hosts, look-alikes and the old fake iOS id', () => {
    expect(
      isTrustedStoreUrl(
        'android',
        'https://play.google.com/store/apps/details?id=com.other.app',
      ),
    ).toBe(false);
    expect(
      isTrustedStoreUrl(
        'android',
        'https://evil.example/store/apps/details?id=app.until.time',
      ),
    ).toBe(false);
    expect(
      isTrustedStoreUrl(
        'android',
        'https://play.google.com.evil.example/store/apps/details?id=app.until.time',
      ),
    ).toBe(false);
    expect(isTrustedStoreUrl('android', 'javascript:alert(1)')).toBe(false);
    expect(isTrustedStoreUrl('ios', PLAY)).toBe(false);
    expect(
      isTrustedStoreUrl('ios', 'https://apps.apple.com.evil.example/app/id1'),
    ).toBe(false);
    expect(isTrustedStoreUrl('android', undefined)).toBe(false);
    expect(isTrustedStoreUrl('ios', 42)).toBe(false);
  });
});

describe('parseUpdateConfig', () => {
  const raw = {
    android: {
      latest_build: 40,
      minimum_build: '35',
      version_name: '1.4',
      store_url: PLAY,
      notes: [
        '  Fewer crashes ',
        '',
        'Widgets refresh on the minute',
        7,
        'a',
        'b',
      ],
    },
    ios: { latest_build: '12', store_url: 'https://evil.example/app' },
  };

  it('reads the section for the platform it is asked about', () => {
    expect(parseUpdateConfig(raw, 'android')).toEqual({
      latestBuild: 40,
      minimumBuild: 35,
      versionName: '1.4',
      storeUrl: PLAY,
      notes: ['Fewer crashes', 'Widgets refresh on the minute', 'a'],
    });
  });

  it('drops an untrusted store link and defaults the floor to 1', () => {
    expect(parseUpdateConfig(raw, 'ios')).toEqual({
      latestBuild: 12,
      minimumBuild: 1,
      versionName: null,
      storeUrl: null,
      notes: [],
    });
  });

  it('never lets the required floor sit above the latest build', () => {
    const parsed = parseUpdateConfig(
      { android: { latest_build: 10, minimum_build: 99, store_url: PLAY } },
      'android',
    );
    expect(parsed?.minimumBuild).toBe(10);
  });

  it('returns null for anything malformed so nobody gets a prompt from bad data', () => {
    for (const bad of [
      null,
      undefined,
      'x',
      3,
      {},
      { android: null },
      { android: {} },
      { android: { latest_build: 'abc' } },
      { android: { latest_build: 0 } },
      { android: { latest_build: 1.5 } },
    ]) {
      expect(parseUpdateConfig(bad, 'android')).toBeNull();
    }
  });

  it('shortens very long notes and version names', () => {
    const parsed = parseUpdateConfig(
      {
        android: {
          latest_build: 5,
          version_name: 'x'.repeat(50),
          store_url: PLAY,
          notes: ['y'.repeat(300)],
        },
      },
      'android',
    );
    expect(parsed?.notes[0]).toHaveLength(90);
    expect(parsed?.versionName).toHaveLength(20);
  });
});

describe('decideUpdate', () => {
  const run = (over: Partial<Parameters<typeof decideUpdate>[0]> = {}) =>
    decideUpdate({
      installedBuild: 33,
      config: config(),
      snooze: NO_SNOOZE,
      now: NOW,
      ...over,
    });

  it('offers an update when a newer build is out', () => {
    expect(run()).toEqual({
      kind: 'optional',
      latestBuild: 40,
      versionName: '1.4',
      notes: ['Fewer crashes'],
      storeUrl: PLAY,
    });
  });

  it('says nothing when up to date, or ahead of the store (an internal build)', () => {
    expect(run({ installedBuild: 40 }).kind).toBe('none');
    expect(run({ installedBuild: 41 }).kind).toBe('none');
  });

  it('requires an update below the minimum build, and that ignores any snooze', () => {
    const snoozed = { build: 40, count: MAX_SNOOZES, at: NOW };
    expect(
      run({ config: config({ minimumBuild: 35 }), snooze: snoozed }).kind,
    ).toBe('required');
    expect(run({ config: config({ minimumBuild: 33 }) }).kind).toBe('optional');
  });

  it('stays quiet without a config, a trusted listing, or a readable installed build', () => {
    expect(run({ config: null }).kind).toBe('none');
    expect(run({ config: config({ storeUrl: null }) }).kind).toBe('none');
    expect(run({ installedBuild: NaN }).kind).toBe('none');
    expect(run({ installedBuild: 0 }).kind).toBe('none');
  });

  it('hides the sheet for three days after "Not now", then shows it again', () => {
    const snooze = snoozeAfterDismiss(NO_SNOOZE, 40, NOW);
    expect(run({ snooze, now: NOW + SNOOZE_MS - 1 }).kind).toBe('none');
    expect(run({ snooze, now: NOW + SNOOZE_MS }).kind).toBe('optional');
  });

  it('stops asking about a build after the second "Not now"', () => {
    const second = snoozeAfterDismiss(
      snoozeAfterDismiss(NO_SNOOZE, 40, NOW),
      40,
      NOW + SNOOZE_MS,
    );
    expect(second.count).toBe(MAX_SNOOZES);
    expect(run({ snooze: second, now: NOW + 30 * SNOOZE_MS }).kind).toBe(
      'none',
    );
  });

  it('asks again as soon as a newer build ships', () => {
    const second = snoozeAfterDismiss(
      snoozeAfterDismiss(NO_SNOOZE, 40, NOW),
      40,
      NOW + SNOOZE_MS,
    );
    expect(
      run({ snooze: second, config: config({ latestBuild: 41 }), now: NOW + 1 })
        .kind,
    ).toBe('optional');
  });
});

describe('snoozeAfterDismiss', () => {
  it('counts up for the same build and restarts for a newer one', () => {
    const first = snoozeAfterDismiss(NO_SNOOZE, 40, NOW);
    expect(first).toEqual({ build: 40, count: 1, at: NOW });
    expect(snoozeAfterDismiss(first, 40, NOW + 5)).toEqual({
      build: 40,
      count: 2,
      at: NOW + 5,
    });
    expect(snoozeAfterDismiss(first, 41, NOW + 5)).toEqual({
      build: 41,
      count: 1,
      at: NOW + 5,
    });
  });
});
