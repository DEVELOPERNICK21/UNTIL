/**
 * A small "Premium · Yearly plan" pill for the profile. Shows nothing without Premium; a tap
 * opens the Premium screen, where the full plan card lives.
 */

import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from '../../../shared/ui';
import { Spacing, Radius, useTheme } from '../../../shared/theme';
import { navigateToPremium } from '../../../shared/navigation/rootNavigationRef';
import { useTranslation } from '../../../shared/i18n/useTranslation';
import { useObserveSubscription } from '../hooks/useObserveSubscription';
import { usePlan } from '../hooks/usePlan';
import { planName } from './planLabels';

export function PlanChip() {
  const theme = useTheme();
  const { t } = useTranslation();
  const { isPremium } = useObserveSubscription();
  const { plan } = usePlan();
  if (!isPremium) return null;

  const label = plan
    ? t('premium.plan.chip', { plan: planName(plan.kind, t) })
    : t('premium.plan.chipGeneric');
  return (
    <TouchableOpacity
      onPress={navigateToPremium}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[styles.chip, { borderColor: theme.percent }]}
    >
      <Text variant="caption" style={{ color: theme.percent }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    marginTop: Spacing[2],
    paddingVertical: Spacing[1],
    paddingHorizontal: Spacing[3],
    borderWidth: 1,
    borderRadius: Radius.lg,
  },
});
