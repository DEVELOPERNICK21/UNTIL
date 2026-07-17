/**
 * Free vs Premium contrast strip — loss aversion in one glance.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '../../ui';
import {
  useTheme,
  Spacing,
  Radius,
  Weight,
  getFontFamilyForWeight,
} from '../../theme';

const FREE_ITEMS = ['Day widget', 'Year widget', 'Share'];
const PREMIUM_ITEMS = ['Month widget', 'Life screen', 'Overlay'];

export function PaywallCompareStrip() {
  const theme = useTheme();

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
          FREE FOREVER
        </Text>
        {FREE_ITEMS.map(item => (
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
          WITH PREMIUM
        </Text>
        {PREMIUM_ITEMS.map(item => (
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
