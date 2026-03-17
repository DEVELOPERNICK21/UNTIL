import React, { useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Text, ScreenGradient } from '../../ui';
import {
  useTheme,
  Spacing,
  Typography,
  Weight,
  getFontFamilyForWeight,
  Radius,
} from '../../theme';
import { useObserveTimeState } from '../../hooks';
import { useOnboardingComplete } from '../onboarding';
import type { AuthStackParamList } from '../../navigation/AuthNavigator';

type AuthNav = NativeStackNavigationProp<AuthStackParamList, 'LifeWeeksPreview'>;

const WEEKS_PER_YEAR = 365.25 / 7;

export function LifeWeeksPreviewScreen() {
  const navigation = useNavigation<AuthNav>();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const completeAuth = useOnboardingComplete();
  const { userProfile, timeState } = useObserveTimeState();

  const { totalWeeks, livedWeeks } = useMemo(() => {
    const deathAge = userProfile.deathAge;
    const total = Math.round(deathAge * WEEKS_PER_YEAR);
    const remainingDaysLife = timeState.remainingDaysLife;
    const remainingWeeks =
      typeof remainingDaysLife === 'number'
        ? Math.max(0, Math.round(remainingDaysLife / 7))
        : 0;
    const lived = Math.max(0, Math.min(total, total - remainingWeeks));
    return { totalWeeks: total, livedWeeks: lived };
  }, [userProfile.deathAge, timeState.remainingDaysLife]);

  const weeksArray = useMemo(() => {
    const safeTotal = Math.min(totalWeeks, 5200);
    return Array.from({ length: safeTotal }, (_, i) => i < livedWeeks);
  }, [totalWeeks, livedWeeks]);

  const livedWeeksLabel = livedWeeks.toLocaleString();

  const handleEnterPresent = () => {
    completeAuth();
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
                <Text
                  style={[
                    styles.title,
                    { color: theme.textPrimary },
                  ]}
                >
                  You have lived{' '}
                  <Text style={[styles.titleEmphasis, { color: theme.percent }]}>
                    {livedWeeksLabel} weeks
                  </Text>
                </Text>

                <View style={styles.gridContainer}>
                  {weeksArray.map((isLived, index) => (
                    <View
                      key={index}
                      style={[
                        styles.weekDot,
                        isLived
                          ? { backgroundColor: theme.percent }
                          : styles.weekDotRemaining,
                      ]}
                    />
                  ))}
                </View>
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
    marginBottom: Spacing[5],
  },
  titleEmphasis: {
    fontFamily: getFontFamilyForWeight(Weight.bold),
  },
  gridContainer: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  weekDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 2,
    marginVertical: 3,
  },
  weekDotRemaining: {
    backgroundColor: '#4A4A4A',
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

