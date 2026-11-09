import { useCallback } from 'react';
import { Alert, Linking, Platform } from 'react-native';
import { SUBSCRIPTION_MANAGE_URLS } from '../../../config/monetization';
import { logAnalyticsEvent } from '../../../shared/analytics/analytics';
import { useTranslation } from '../../../shared/i18n/useTranslation';

/**
 * Opens the store's subscription page where the user can cancel.
 * No account or email needed, so cancelling takes as few steps as subscribing.
 */
export function useManageSubscription() {
  const { t } = useTranslation();
  const openManageSubscription = useCallback((source: string) => {
    const url =
      Platform.OS === 'ios'
        ? SUBSCRIPTION_MANAGE_URLS.ios
        : SUBSCRIPTION_MANAGE_URLS.android;
    void logAnalyticsEvent('manage_subscription_opened', { source });
    void Linking.openURL(url).catch(() => {
      Alert.alert(
        t('premium.alert.manageTitle'),
        t(
          Platform.OS === 'ios'
            ? 'premium.alert.manageIos'
            : 'premium.alert.manageAndroid',
        ),
      );
    });
  }, [t]);

  return { openManageSubscription };
}
