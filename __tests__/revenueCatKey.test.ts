import { selectRevenueCatKey } from '../src/config/revenueCat';

describe('selectRevenueCatKey', () => {
  const keys = { ios: 'appl_ios', android: ' goog_android ' };

  it('returns the key for the platform, trimmed', () => {
    expect(selectRevenueCatKey({ os: 'android', ...keys, dev: false })).toBe('goog_android');
    expect(selectRevenueCatKey({ os: 'ios', ...keys, dev: false })).toBe('appl_ios');
  });

  it('returns nothing when the key is missing', () => {
    expect(selectRevenueCatKey({ os: 'android', dev: false })).toBe('');
  });

  it('allows the Test Store key while developing', () => {
    expect(selectRevenueCatKey({ os: 'android', android: 'test_abc', dev: true })).toBe('test_abc');
  });

  it('refuses the Test Store key in a release build', () => {
    expect(selectRevenueCatKey({ os: 'android', android: 'test_abc', dev: false })).toBe('');
    expect(selectRevenueCatKey({ os: 'ios', ios: 'test_abc', dev: false })).toBe('');
  });
});
