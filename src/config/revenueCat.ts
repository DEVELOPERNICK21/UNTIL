import { Platform } from 'react-native';

export const REVENUECAT_ENTITLEMENT_PREMIUM = 'premium';

export function getRevenueCatApiKey(): string {
  const key =
    Platform.OS === 'ios'
      ? process.env.REVENUECAT_API_KEY_IOS
      : process.env.REVENUECAT_API_KEY_ANDROID;
  return (key ?? '').trim();
}
