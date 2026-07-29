import React, { useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Text, ScreenGradient, LifeWeeksGrid } from '../../ui';
import {
  useTheme,
  Spacing,
  Typography,
  Weight,
  getFontFamilyForWeight,
  Radius,
} from '../../theme';
import {
  useAnalytics,
  useLifeWeeks,
  useObserveTimeState,
  useOnboardingFunnel,
} from '../../hooks';
import type { AuthStackParamList } from '../../navigation/AuthNavigator';

type AuthNav = NativeStackNavigationProp<
  AuthStackParamList,
  'LifeWeeksPreview'
>;

export function LifeWeeksPreviewScreen() {
  const navigation = useNavigation<AuthNav>();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { userProfile, timeState } = useObserveTimeState();
  const { logEvent } = useAnalytics();
  const { setStep } = useOnboardingFunnel();

  const { totalWeeks, livedWeeks, renderWeeks } = useLifeWeeks(
    userProfile.deathAge,
    timeState.remainingDaysLife,
  );

  const livedWeeksLabel = livedWeeks.toLocaleString();
  const totalWeeksLabel = totalWeeks.toLocaleString();

  useEffect(() => {
    logEvent('life_preview_seen');
  }, [logEvent]);

  const handleEnterPresent = () => {
    logEvent('onboarding_life_aha', {
      lived_weeks: livedWeeks,
      total_weeks: totalWeeks,
    });
    setStep('q_values');
    navigation.navigate('Onboarding');
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <ScreenGradient>
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: Math.max(insets.bottom, Spacing[4]) + 96 },
            ]}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.header}>
              <TouchableOpacity
                onPress={handleBack}
                style={styles.backHit}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Text variant="body" style={{ color: theme.textPrimary }}>
                  ‹
                </Text>
              </TouchableOpacity>
              <View style={styles.headerCenter}>
                <Text
                  variant="caption"
                  style={[styles.identityLabel, { color: theme.textSecondary }]}
                >
                  TIMELINE
                </Text>
              </View>
              <View style={styles.headerRight} />
            </View>

            <View style={styles.card}>
              <View style={styles.cardContent}>
                <Text style={[styles.title, { color: theme.textPrimary }]}>
                  You have lived{' '}
                </Text>
                <Text style={[styles.titleEmphasis, { color: theme.percent }]}>
                  {livedWeeksLabel}{' '}
                  <Text style={[{ color: '#FFFFFF' }]}>weeks </Text>/{' '}
                  {totalWeeksLabel}
                  <Text style={[{ color: '#FFFFFF' }]}> weeks </Text>
                </Text>
                <LifeWeeksGrid
                  livedWeeks={livedWeeks}
                  renderWeeks={renderWeeks}
                  fillColor={theme.percent}
                />
              </View>
            </View>
          </ScrollView>

          <View
            style={[
              styles.footer,
              { paddingBottom: Math.max(insets.bottom, Spacing[3]) },
            ]}
          >
            <TouchableOpacity
              style={[styles.cta, { backgroundColor: theme.percent }]}
              onPress={handleEnterPresent}
              activeOpacity={0.85}
            >
              <Text variant="sectionTitle" style={styles.ctaLabel}>
                Enter the Present
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </ScreenGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[4],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
    marginBottom: Spacing[3],
  },
  backHit: {
    padding: Spacing[2],
    minWidth: 44,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRight: {
    minWidth: 44,
  },
  identityLabel: {
    letterSpacing: 2,
  },
  card: {
    borderRadius: Radius.lg,
    backgroundColor: 'black',
    paddingVertical: Spacing[6],
    paddingHorizontal: Spacing[4],
  },
  cardContent: {
    alignItems: 'center',
  },
  title: {
    fontFamily: getFontFamilyForWeight(Weight.semibold),
    fontSize: Typography.display,
    textAlign: 'center',
    // marginBottom: Spacing[5],
  },
  titleEmphasis: {
    fontSize: Typography.display,
    fontFamily: getFontFamilyForWeight(Weight.bold),
    marginBottom: Spacing[5],
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[3],
    backgroundColor: 'transparent',
  },
  cta: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing[3],
    borderRadius: Radius.md,
    minHeight: 56,
  },
  ctaLabel: {
    fontFamily: getFontFamilyForWeight(Weight.bold),
    color: '#FFFFFF',
  },
});
