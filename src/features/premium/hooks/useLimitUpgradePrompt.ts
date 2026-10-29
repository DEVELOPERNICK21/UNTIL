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
import { PREMIUM_ITEM_LIMIT } from '../../../config/featureLimits';

export type LimitedFeature = 'deadlines' | 'counters';

const COPY: Record<LimitedFeature, { title: string; body: string }> = {
  deadlines: {
    title: 'More deadlines with Premium',
    body: `The free plan keeps one deadline. Premium holds up to ${PREMIUM_ITEM_LIMIT}, and your widget always shows the one that is nearest.`,
  },
  counters: {
    title: 'More counters with Premium',
    body: `The free plan keeps one counter. Premium holds up to ${PREMIUM_ITEM_LIMIT}, and you choose which one your widget shows.`,
  },
};

export function useLimitUpgradePrompt(feature: LimitedFeature): () => void {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return useCallback(() => {
    void logAnalyticsEvent('premium_limit_hit', { feature });
    Alert.alert(COPY[feature].title, COPY[feature].body, [
      { text: 'Not now', style: 'cancel' },
      {
        text: 'See Premium',
        onPress: () => {
          void logAnalyticsEvent('premium_viewed', { source: 'limit_gate', feature });
          navigation.navigate('Premium');
        },
      },
    ]);
  }, [feature, navigation]);
}
