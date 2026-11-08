/**
 * useLimitUpgradePrompt — what happens when someone on the free plan tries to add a second
 * deadline or counter: say what Premium adds, and offer the Premium screen. What they typed stays.
 */

import { useCallback } from 'react';
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../shared/navigation/types';
import { logAnalyticsEvent } from '../../../shared/analytics/analytics';
import { useTranslation } from '../../../shared/i18n/useTranslation';
import { PREMIUM_ITEM_LIMIT } from '../../../config/featureLimits';

export type LimitedFeature = 'deadlines' | 'counters';

export function useLimitUpgradePrompt(feature: LimitedFeature): () => void {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { t } = useTranslation();

  return useCallback(() => {
    void logAnalyticsEvent('premium_limit_hit', { feature });
    const params = { max: PREMIUM_ITEM_LIMIT };
    Alert.alert(
      feature === 'deadlines'
        ? t('premium.limit.deadlines.title')
        : t('premium.limit.counters.title'),
      feature === 'deadlines'
        ? t('premium.limit.deadlines.body', params)
        : t('premium.limit.counters.body', params),
      [
        { text: t('common.notNow'), style: 'cancel' },
        {
          text: t('premium.limit.see'),
          onPress: () => {
            void logAnalyticsEvent('premium_viewed', {
              source: 'limit_gate',
              feature,
            });
            navigation.navigate('Premium');
          },
        },
      ],
    );
  }, [feature, navigation, t]);
}
