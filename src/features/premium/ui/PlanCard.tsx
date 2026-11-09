/**
 * "Your plan": what was bought, since when, when it renews or ends, and where it is billed.
 * Shown on the Premium screen and in the account. Falls back to a plain "Premium is active"
 * when Premium has no store plan (a license key, or Premium carried over from the account).
 */

import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from '../../../shared/ui';
import {
  Spacing,
  Radius,
  Weight,
  getFontFamilyForWeight,
  useTheme,
} from '../../../shared/theme';
import { useTranslation } from '../../../shared/i18n/useTranslation';
import { useManageSubscription } from '../hooks/useManageSubscription';
import { useObserveSubscription } from '../hooks/useObserveSubscription';
import { usePlan } from '../hooks/usePlan';
import { planName, sinceText, storeName, timelineText } from './planLabels';

export function PlanCard() {
  const theme = useTheme();
  const { t, formatDate } = useTranslation();
  const { isPremium } = useObserveSubscription();
  const { plan, timeline } = usePlan();
  const { openManageSubscription } = useManageSubscription();
  if (!isPremium) return null;

  const when = timelineText(timeline, t, formatDate);
  const details = plan
    ? [sinceText(plan, t, formatDate), storeName(plan.store, t)].filter(Boolean)
    : [];
  const canManage = plan != null && plan.kind !== 'lifetime';

  return (
    <View
      style={[styles.card, { borderColor: theme.percent, backgroundColor: theme.glassBg }]}
      accessibilityLabel={
        plan ? `${t('premium.plan.heading')}: ${planName(plan.kind, t)}` : undefined
      }
    >
      <Text variant="caption" style={[styles.heading, { color: theme.textSecondary }]}>
        {t('premium.plan.heading')}
      </Text>
      <Text
        variant="title"
        style={{
          color: theme.textPrimary,
          fontFamily: getFontFamilyForWeight(Weight.semibold),
        }}
      >
        {plan ? planName(plan.kind, t) : t('premium.plan.generic')}
      </Text>
      {when ? (
        <Text variant="body" style={[styles.line, { color: theme.textPrimary }]}>
          {when}
        </Text>
      ) : null}
      {plan?.billingIssue ? (
        <Text variant="caption" style={[styles.line, { color: theme.percent }]}>
          {t('premium.plan.billingIssue')}
        </Text>
      ) : null}
      {details.length > 0 ? (
        <Text variant="caption" style={[styles.line, { color: theme.textSecondary }]}>
          {details.join(' · ')}
        </Text>
      ) : null}
      {canManage ? (
        <TouchableOpacity
          onPress={() => openManageSubscription('plan_card')}
          style={styles.manage}
          accessibilityRole="button"
          accessibilityLabel={t('premium.manage.a11y')}
        >
          <Text variant="caption" style={[styles.manageText, { color: theme.textSecondary }]}>
            {t('premium.manage.link')}
          </Text>
        </TouchableOpacity>
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
  heading: { letterSpacing: 1, marginBottom: Spacing[1] },
  line: { marginTop: Spacing[1] },
  manage: { alignSelf: 'flex-start', marginTop: Spacing[2], paddingVertical: Spacing[1] },
  manageText: { textDecorationLine: 'underline' },
});
