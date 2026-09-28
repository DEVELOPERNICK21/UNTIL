import { useCallback } from 'react';
import { Alert, Linking, Platform } from 'react-native';
import { SUBSCRIPTION_MANAGE_URLS } from '../config/monetization';
import { logAnalyticsEvent } from '../services/analytics';

/**
 * Opens the store's subscription page where the user can cancel.
 * No account or email needed, so cancelling takes as few steps as subscribing.
 */
export function useManageSubscription() {
  const openManageSubscription = useCallback((source: string) => {
    const url =
      Platform.OS === 'ios'
        ? SUBSCRIPTION_MANAGE_URLS.ios
        : SUBSCRIPTION_MANAGE_URLS.android;
    void logAnalyticsEvent('manage_subscription_opened', { source });
    void Linking.openURL(url).catch(() => {
      Alert.alert(
        'Could not open subscriptions',
        Platform.OS === 'ios'
          ? 'Open Settings › your name › Subscriptions to cancel.'
          : 'Open Google Play › Profile › Payments & subscriptions › Subscriptions to cancel.'
      );
    });
  }, []);

  return { openManageSubscription };
}
