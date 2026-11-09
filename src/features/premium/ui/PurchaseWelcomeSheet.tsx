/**
 * "Welcome to Premium": the greeting shown once when a plan becomes active (bought, restored
 * or carried over from another device). Says which plan, what it unlocked and when it ends
 * or renews, then gets out of the way.
 */

import React from 'react';
import { Modal, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from '../../../shared/ui';
import {
  Spacing,
  Radius,
  Weight,
  getFontFamilyForWeight,
  useTheme,
} from '../../../shared/theme';
import { useTranslation } from '../../../shared/i18n/useTranslation';
import type { TranslationKey } from '../../../shared/i18n/translate';
import type { PurchaseWelcome } from '../hooks/usePurchaseWelcome';
import { planName, timelineText } from './planLabels';

const GREETING_KEY = {
  morning: 'premium.welcome.greeting.morning',
  afternoon: 'premium.welcome.greeting.afternoon',
  evening: 'premium.welcome.greeting.evening',
} as const;

/** What Premium unlocked, named with the same labels as the paywall tiles. */
const UNLOCKED: TranslationKey[] = [
  'premium.tiles.month.label',
  'premium.tiles.life.label',
  'premium.tiles.overlay.label',
  'premium.tiles.deadlines.label',
  'premium.tiles.alerts.label',
];

interface PurchaseWelcomeSheetProps {
  welcome: Pick<PurchaseWelcome, 'visible' | 'kind' | 'timeline' | 'greeting'>;
  onClose: () => void;
  onSeePlan: () => void;
}

export function PurchaseWelcomeSheet({ welcome, onClose, onSeePlan }: PurchaseWelcomeSheetProps) {
  const theme = useTheme();
  const { t, formatDate } = useTranslation();
  if (!welcome.visible || !welcome.kind) return null;

  const when = timelineText(welcome.timeline, t, formatDate);
  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View
          accessibilityViewIsModal
          accessibilityLabel={t('premium.welcome.a11y')}
          style={[styles.card, { backgroundColor: theme.cardBaseAlpha }]}
        >
          <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
            <Text variant="caption" style={[styles.greeting, { color: theme.percent }]}>
              {t(GREETING_KEY[welcome.greeting])}
            </Text>
            <Text
              variant="title"
              style={{
                color: theme.textPrimary,
                fontFamily: getFontFamilyForWeight(Weight.semibold),
              }}
            >
              {t('premium.welcome.title')}
            </Text>
            <Text variant="body" style={[styles.planLine, { color: theme.textPrimary }]}>
              {t('premium.welcome.active', { plan: planName(welcome.kind, t) })}
            </Text>
            {when ? (
              <Text variant="caption" style={{ color: theme.textSecondary }}>
                {when}
              </Text>
            ) : null}

            <Text variant="caption" style={[styles.heading, { color: theme.textSecondary }]}>
              {t('premium.welcome.unlockedHeading')}
            </Text>
            {UNLOCKED.map(key => (
              <View key={key} style={styles.row}>
                <View style={[styles.dot, { backgroundColor: theme.percent }]} />
                <Text variant="body" style={{ color: theme.textPrimary, flex: 1 }}>
                  {t(key)}
                </Text>
              </View>
            ))}

            <Text variant="caption" style={[styles.thanks, { color: theme.textSecondary }]}>
              {t('premium.welcome.thanks')}
            </Text>
          </ScrollView>

          <TouchableOpacity
            style={[styles.primary, { backgroundColor: theme.percent }]}
            onPress={onClose}
            activeOpacity={0.9}
            accessibilityRole="button"
          >
            <Text variant="sectionTitle" style={styles.primaryLabel}>
              {t('premium.welcome.cta')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondary}
            onPress={onSeePlan}
            activeOpacity={0.7}
            accessibilityRole="button"
          >
            <Text variant="body" style={{ color: theme.textSecondary }}>
              {t('premium.welcome.seePlan')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    justifyContent: 'center',
    padding: Spacing[4],
  },
  card: { borderRadius: Radius.lg, padding: Spacing[4], maxHeight: '90%' },
  greeting: { letterSpacing: 0.5, marginBottom: Spacing[1] },
  planLine: { marginTop: Spacing[2] },
  heading: { letterSpacing: 1, marginTop: Spacing[4], marginBottom: Spacing[2] },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2], marginBottom: Spacing[1] },
  dot: { width: 6, height: 6, borderRadius: 3 },
  thanks: { marginTop: Spacing[3], marginBottom: Spacing[3] },
  primary: {
    borderRadius: Radius.md,
    paddingVertical: Spacing[3],
    alignItems: 'center',
    marginBottom: Spacing[2],
    minHeight: 48,
    justifyContent: 'center',
  },
  primaryLabel: { color: '#FFFFFF', textAlign: 'center' },
  secondary: { alignItems: 'center', paddingVertical: Spacing[2] },
});
