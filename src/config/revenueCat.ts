import { Platform } from 'react-native';

export const REVENUECAT_ENTITLEMENT_PREMIUM = 'premium';

/**
 * Picks the RevenueCat key for a platform. RevenueCat's Test Store keys ("test_...") run a
 * simulated store; in a release build that would show real people a fake purchase sheet and
 * record nothing, so there it counts as no key at all.
 */
export function selectRevenueCatKey(options: {
  os: string;
  ios?: string;
  android?: string;
  dev: boolean;
}): string {
  const key = (options.os === 'ios' ? options.ios : options.android) ?? '';
  const trimmed = key.trim();
  if (!options.dev && trimmed.startsWith('test_')) return '';
  return trimmed;
}

export function getRevenueCatApiKey(): string {
  // The env values are inlined at build time (see babel.config.js).
  return selectRevenueCatKey({
    os: Platform.OS,
    ios: process.env.REVENUECAT_API_KEY_IOS,
    android: process.env.REVENUECAT_API_KEY_ANDROID,
    dev: __DEV__,
  });
}
