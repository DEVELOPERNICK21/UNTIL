/**
 * Free vs Premium contrast strip — loss aversion in one glance.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '../../../shared/ui';
import {
  useTheme,
  Spacing,
  Radius,
  Weight,
  getFontFamilyForWeight,
} from '../../../shared/theme';
import { PREMIUM_ITEM_LIMIT } from '../../../config/featureLimits';
import { useTranslation } from '../../../shared/i18n/useTranslation';

export function PaywallCompareStrip() {
  const theme = useTheme();
  const { t } = useTranslation();
  const freeItems = [
    t('premium.compare.dayWidget'),
    t('premium.compare.yearWidget'),
    t('premium.compare.share'),
    t('premium.compare.freeLimits'),
  ];
  const premiumItems = [
    t('premium.compare.monthWidget'),
    t('premium.compare.lifeScreen'),
    t('premium.compare.overlay'),
    t('premium.compare.premiumLimits', { max: PREMIUM_ITEM_LIMIT }),
  ];

  return (
    <View style={styles.wrap}>
      <View
        style={[
          styles.col,
          {
            borderColor: theme.divider,
            backgroundColor: theme.glassBg,
          },
        ]}
      >
        <Text
          variant="caption"
          style={{
            color: theme.textSecondary,
            marginBottom: Spacing[2],
            fontFamily: getFontFamilyForWeight(Weight.medium),
          }}
        >
          {t('premium.compare.free')}
        </Text>
        {freeItems.map(item => (
          <Text
            key={item}
            variant="caption"
            style={[styles.line, { color: theme.textSecondary }]}
          >
            · {item}
          </Text>
        ))}
      </View>

      <View
        style={[
          styles.col,
          styles.premiumCol,
          {
            borderColor: theme.percent,
            backgroundColor: 'rgba(232, 124, 32, 0.12)',
          },
        ]}
      >
        <Text
          variant="caption"
          style={{
            color: theme.percent,
            marginBottom: Spacing[2],
            fontFamily: getFontFamilyForWeight(Weight.semibold),
          }}
        >
          {t('premium.compare.premium')}
        </Text>
        {premiumItems.map(item => (
          <Text
            key={item}
            variant="caption"
            style={[styles.line, { color: theme.textPrimary }]}
          >
            ✓ {item}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    gap: Spacing[2],
    marginBottom: Spacing[4],
  },
  col: {
    flex: 1,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing[3],
  },
  premiumCol: {},
  line: {
    lineHeight: 18,
    marginBottom: 4,
  },
});
