import React, { useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Text, GlassCard } from '../../../shared/ui';
import { Spacing, useTheme, getFontFamilyForWeight, Weight } from '../../../shared/theme';
import type { RootStackParamList } from '../../../shared/navigation/types';
import { logAnalyticsEvent } from '../../../shared/analytics/analytics';
import { useCountdowns } from '../hooks/useCountdowns';

type Nav = NativeStackNavigationProp<RootStackParamList>;

/**
 * Home's way into countdowns. It shows the next one coming up, or invites you to add the first.
 * Countdowns used to be reachable only from the widgets screen, so most people never found them.
 */
export function CountdownHomeCard() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const { countdowns, refresh } = useCountdowns();

  // Coming back from the countdowns screen should show what was just added.
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const next = countdowns
    .filter(c => c.daysUntil >= 0)
    .sort((a, b) => a.daysUntil - b.daysUntil)[0];

  const open = useCallback(() => {
    void logAnalyticsEvent('countdown_home_card_tapped', { has_countdown: next != null });
    navigation.navigate('Countdowns');
  }, [navigation, next]);

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={open} accessibilityRole="button">
      <GlassCard style={styles.card}>
        <View style={styles.row}>
          <View style={styles.text}>
            <Text variant="micro" color="secondary" style={styles.eyebrow}>
              {next ? 'NEXT COUNTDOWN' : 'COUNTDOWNS'}
            </Text>
            <Text
              variant="body"
              numberOfLines={1}
              style={{
                color: theme.textPrimary,
                fontFamily: getFontFamilyForWeight(Weight.semibold),
              }}
            >
              {next ? next.title : 'Count down to something'}
            </Text>
            {!next ? (
              <Text variant="caption" color="secondary" numberOfLines={1}>
                An exam, a trip, a birthday, a deadline.
              </Text>
            ) : null}
          </View>
          <View style={[styles.pill, { borderColor: theme.glassBorder }]}>
            <Text
              variant="caption"
              style={{
                color: theme.percent,
                fontFamily: getFontFamilyForWeight(Weight.semibold),
              }}
            >
              {next ? next.daysLabel : 'Add'}
            </Text>
          </View>
        </View>
      </GlassCard>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing[3],
    paddingVertical: Spacing[2],
    paddingHorizontal: Spacing[3],
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3] },
  text: { flex: 1, gap: 2 },
  eyebrow: { letterSpacing: 1 },
  pill: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 999,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[1],
  },
});
