/**
 * Gentler-style selectable plan cards — radio + price on the right.
 */

import React from 'react';
import { View, StyleSheet, Pressable, Vibration } from 'react-native';
import { Text } from '../../ui';
import {
  useTheme,
  Spacing,
  Radius,
  Weight,
  getFontFamilyForWeight,
} from '../../theme';

export type PaywallPlanOption = {
  productId: string;
  title: string;
  subtitle?: string;
  price: string;
  /** e.g. "/year" or empty for one-time */
  periodLabel?: string;
  /** Strikethrough anchor (e.g. monthly × 12) */
  comparePrice?: string;
  badge?: string;
};

interface PaywallPlanCardsProps {
  plans: PaywallPlanOption[];
  selectedId: string;
  onSelect: (productId: string) => void;
}

function RadioIndicator({ selected }: { selected: boolean }) {
  const theme = useTheme();

  if (selected) {
    return (
      <View style={[styles.radioOn, { backgroundColor: theme.percent }]}>
        <Text variant="micro" style={styles.check}>
          ✓
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.radioOff,
        { borderColor: theme.textSecondary },
      ]}
    />
  );
}

export function PaywallPlanCards({
  plans,
  selectedId,
  onSelect,
}: PaywallPlanCardsProps) {
  const theme = useTheme();

  return (
    <View style={styles.wrap}>
      {plans.map(plan => {
        const selected = plan.productId === selectedId;
        return (
          <Pressable
            key={plan.productId}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={`${plan.title}, ${plan.price}${
              plan.periodLabel ? ` ${plan.periodLabel}` : ''
            }${plan.badge ? `, ${plan.badge}` : ''}`}
            onPress={() => {
              Vibration.vibrate(8);
              onSelect(plan.productId);
            }}
            style={[
              styles.card,
              {
                borderColor: selected ? theme.percent : theme.glassBorder,
                backgroundColor: selected
                  ? 'rgba(232, 124, 32, 0.12)'
                  : theme.glassBg,
                minHeight: 64,
              },
            ]}
          >
            {plan.badge ? (
              <View style={[styles.badge, { backgroundColor: theme.percent }]}>
                <Text variant="micro" style={styles.badgeText}>
                  {plan.badge}
                </Text>
              </View>
            ) : null}

            <View style={styles.row}>
              <RadioIndicator selected={selected} />

              <View style={styles.copy}>
                <Text
                  variant="body"
                  style={{
                    color: theme.textPrimary,
                    fontFamily: getFontFamilyForWeight(Weight.semibold),
                  }}
                >
                  {plan.title}
                </Text>
                {plan.subtitle ? (
                  <Text
                    variant="caption"
                    color="secondary"
                    style={styles.subtitle}
                  >
                    {plan.subtitle}
                  </Text>
                ) : null}
              </View>

              <View style={styles.priceCol}>
                <Text
                  variant="body"
                  style={{
                    color: theme.textPrimary,
                    fontFamily: getFontFamilyForWeight(Weight.bold),
                    textAlign: 'right',
                  }}
                >
                  {plan.price}
                  {plan.periodLabel ?? ''}
                </Text>
                {plan.comparePrice ? (
                  <Text
                    variant="caption"
                    style={[
                      styles.comparePrice,
                      { color: theme.textSecondary },
                    ]}
                  >
                    {plan.comparePrice}
                  </Text>
                ) : null}
              </View>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: Spacing[2],
    marginBottom: Spacing[3],
  },
  card: {
    borderWidth: 1.5,
    borderRadius: Radius.lg,
    padding: Spacing[3],
    position: 'relative',
    overflow: 'hidden',
  },
  badge: {
    position: 'absolute',
    top: -10,
    right: Spacing[3],
    paddingHorizontal: Spacing[2],
    paddingVertical: 3,
    borderRadius: Radius.full,
    zIndex: 1,
  },
  badgeText: {
    color: '#000',
    fontFamily: getFontFamilyForWeight(Weight.semibold),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
  },
  radioOn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOff: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
  },
  check: {
    color: '#000',
    lineHeight: 14,
    fontFamily: getFontFamilyForWeight(Weight.bold),
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  subtitle: {
    marginTop: 2,
    lineHeight: 16,
  },
  priceCol: {
    alignItems: 'flex-end',
    maxWidth: '42%',
  },
  comparePrice: {
    textDecorationLine: 'line-through',
    marginTop: 2,
    textAlign: 'right',
  },
});
