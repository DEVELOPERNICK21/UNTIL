/**
 * Loss-frame card — names what keeps vanishing without Premium.
 * Honest claims only (real features + real preview expiry).
 */

import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '../../ui';
import {
  useTheme,
  Spacing,
  Radius,
  Weight,
  getFontFamilyForWeight,
} from '../../theme';
import {
  PAYWALL_LOSS_FRAME,
  formatPaywallLossHeadline,
  formatPaywallLossPreviewFooter,
} from '../../config/monetization';

interface PaywallLossFrameProps {
  lifeProgress?: number;
  trialActive: boolean;
  trialEndsAtMs: number | null;
}

export function PaywallLossFrame({
  lifeProgress,
  trialActive,
  trialEndsAtMs,
}: PaywallLossFrameProps) {
  const theme = useTheme();

  const headline = useMemo(
    () => formatPaywallLossHeadline(lifeProgress),
    [lifeProgress]
  );
  const previewFooter = useMemo(
    () => formatPaywallLossPreviewFooter(trialEndsAtMs, trialActive),
    [trialEndsAtMs, trialActive]
  );

  return (
    <View
      style={[
        styles.card,
        {
          borderColor: 'rgba(220, 60, 60, 0.35)',
          backgroundColor: 'rgba(220, 60, 60, 0.10)',
        },
      ]}
    >
      <Text
        variant="caption"
        style={[
          styles.eyebrow,
          {
            color: '#E85C5C',
            fontFamily: getFontFamilyForWeight(Weight.semibold),
          },
        ]}
      >
        {PAYWALL_LOSS_FRAME.eyebrow}
      </Text>

      <Text
        variant="body"
        style={[
          styles.headline,
          {
            color: theme.textPrimary,
            fontFamily: getFontFamilyForWeight(Weight.semibold),
          },
        ]}
      >
        {headline}
      </Text>

      <View style={styles.lossList}>
        {PAYWALL_LOSS_FRAME.losses.map(line => (
          <View key={line} style={styles.lossRow}>
            <Text
              variant="caption"
              style={{
                color: '#E85C5C',
                fontFamily: getFontFamilyForWeight(Weight.semibold),
                marginRight: Spacing[2],
              }}
            >
              ✕
            </Text>
            <Text
              variant="caption"
              style={[styles.lossText, { color: theme.textSecondary }]}
            >
              {line}
            </Text>
          </View>
        ))}
      </View>

      {previewFooter ? (
        <Text
          variant="caption"
          style={[
            styles.footer,
            {
              color: theme.percent,
              fontFamily: getFontFamilyForWeight(Weight.medium),
            },
          ]}
        >
          {previewFooter}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing[3],
    marginBottom: Spacing[4],
  },
  eyebrow: {
    letterSpacing: 1.2,
    marginBottom: Spacing[2],
  },
  headline: {
    lineHeight: 22,
    marginBottom: Spacing[3],
  },
  lossList: {
    gap: Spacing[2],
  },
  lossRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  lossText: {
    flex: 1,
    lineHeight: 18,
  },
  footer: {
    marginTop: Spacing[3],
    lineHeight: 18,
  },
});
