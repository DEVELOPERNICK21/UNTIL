/**
 * Your Journey — birth date and expected lifespan (Stitch: Your Journey screen).
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ScrollView,
  Vibration,
} from 'react-native';
import { ActivityIndicator } from 'react-native';
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { Text, Card, Slider } from '../../ui';
import {
  useTheme,
  Spacing,
  Typography,
  Weight,
  getFontFamilyForWeight,
  Radius,
  Shadows,
} from '../../theme';
import { useUpdateUserProfile } from '../../hooks';
import type { AuthStackParamList } from '../../navigation/AuthNavigator';

const LIFESPAN_MIN = 40;
const LIFESPAN_MAX = 120;
const DEFAULT_LIFESPAN = 80;

function toBirthDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatDisplayDate(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${m}/${d}/${date.getFullYear()}`;
}

function waitForNextFrame(): Promise<void> {
  return new Promise(resolve => {
    requestAnimationFrame(() => resolve());
  });
}

export function IdentitySetupScreen() {
  const navigation =
    useNavigation<
      NativeStackNavigationProp<AuthStackParamList, 'IdentitySetup'>
    >();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const percent = theme.percent;
  const updateUserProfile = useUpdateUserProfile();

  const [birthDate, setBirthDate] = useState(new Date(1995, 0, 1));
  const [showPicker, setShowPicker] = useState(false);
  const [lifespan, setLifespan] = useState(DEFAULT_LIFESPAN);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const birthDateStr = useMemo(() => toBirthDateString(birthDate), [birthDate]);

  const handleLifespanChange = useCallback((next: number) => {
    setLifespan(prev => {
      if (prev !== next) Vibration.vibrate(5);
      return next;
    });
  }, []);

  const submitProfile = useCallback(
    async (dateStr: string, years: number) => {
      if (isSubmitting) return;
      setIsSubmitting(true);
      await waitForNextFrame();
      try {
        await Promise.resolve(updateUserProfile(dateStr, years));
        navigation.navigate('LifeWeeksPreview');
      } catch {
        setIsSubmitting(false);
      }
    },
    [isSubmitting, updateUserProfile, navigation],
  );

  const handleViewMyLife = () => {
    submitProfile(birthDateStr, lifespan);
  };

  const handleSkip = () => {
    Vibration.vibrate(10);
    submitProfile(toBirthDateString(birthDate), lifespan);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.brandHeader}>
          <View style={styles.brandLeft}>
            <Text variant="body" style={{ color: percent }}>
              ⏳
            </Text>
            <Text
              variant="sectionTitle"
              style={[styles.brandTitle, { color: theme.textPrimary }]}
            >
              UNTIL
            </Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom, Spacing.lg) + 88 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.intro}>
            <Text
              variant="display"
              style={[styles.headline, { color: theme.textPrimary }]}
            >
              When did your journey begin?
            </Text>
            <Text
              variant="body"
              style={[styles.introBody, { color: theme.textSecondary }]}
            >
              We use your birth date and expected lifespan to calculate your life
              progress. Data stays local to your device.
            </Text>
          </View>

          <View style={styles.fieldBlock}>
            <View style={styles.fieldLabelRow}>
              <Text
                variant="micro"
                style={[styles.fieldLabel, { color: theme.textSecondary }]}
              >
                BIRTH DATE
              </Text>
              <Text
                variant="micro"
                style={[styles.fieldLabelMuted, { color: theme.textSecondary }]}
              >
                ESTABLISHED
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.datePill,
                {
                  borderColor: theme.divider,
                  backgroundColor: theme.cardLighter,
                },
              ]}
              onPress={() => setShowPicker(true)}
              activeOpacity={0.85}
            >
              <Text
                variant="title"
                style={[styles.dateValue, { color: theme.textPrimary }]}
              >
                {formatDisplayDate(birthDate)}
              </Text>
              <Text variant="body" style={{ color: theme.textSecondary }}>
                📅
              </Text>
            </TouchableOpacity>
            {showPicker ? (
              <View style={styles.datePickerWrap}>
                <DateTimePicker
                  value={birthDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'spinner'}
                  maximumDate={new Date()}
                  onChange={(event: DateTimePickerEvent, d?: Date) => {
                    if (event.type === 'dismissed' || !d) {
                      setShowPicker(false);
                      return;
                    }
                    setBirthDate(d);
                    Vibration.vibrate(10);
                    setShowPicker(false);
                  }}
                />
              </View>
            ) : null}
          </View>

          <View style={styles.fieldBlock}>
            <View style={styles.fieldLabelRow}>
              <Text
                variant="micro"
                style={[styles.fieldLabel, { color: theme.textSecondary }]}
              >
                EXPECTED LIFESPAN
              </Text>
              <View style={styles.lifespanValueRow}>
                <Text
                  variant="title"
                  style={{ color: percent, fontFamily: getFontFamilyForWeight(Weight.semibold) }}
                >
                  {lifespan}
                </Text>
                <Text
                  variant="micro"
                  style={[styles.yearsLabel, { color: theme.textSecondary }]}
                >
                  {' '}
                  YEARS
                </Text>
              </View>
            </View>
            <View style={styles.sliderWrap}>
              <Slider
                value={lifespan}
                minimumValue={LIFESPAN_MIN}
                maximumValue={LIFESPAN_MAX}
                onValueChange={handleLifespanChange}
                step={1}
              />
              <View style={styles.sliderLabels}>
                <Text variant="micro" style={{ color: theme.textSecondary }}>
                  {LIFESPAN_MIN}
                </Text>
                <Text variant="micro" style={{ color: theme.textSecondary }}>
                  {LIFESPAN_MAX}
                </Text>
              </View>
            </View>
          </View>

          <Card style={styles.infoCard} lighter>
            <Text variant="body" style={{ color: theme.textSecondary }}>
              ℹ️ Lifespan estimates are based on global averages (approx.
              73–85 years), but you can customize this to reflect your personal
              goals or heritage. This metric serves as a gentle reminder of the
              finite nature of time.
            </Text>
          </Card>
        </ScrollView>

        <View
          style={[
            styles.footer,
            { paddingBottom: Math.max(insets.bottom, Spacing.lg) },
          ]}
        >
          <TouchableOpacity onPress={handleSkip} style={styles.footerSkip}>
            <Text variant="body" style={{ color: theme.textSecondary }}>
              ✕ Skip
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.ctaPill,
              isSubmitting ? styles.ctaDisabled : null,
              { backgroundColor: percent },
            ]}
            onPress={handleViewMyLife}
            activeOpacity={0.85}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Text variant="sectionTitle" style={styles.ctaLabel}>
                  View My Life
                </Text>
                <Text variant="sectionTitle" style={styles.ctaLabel}>
                  {' '}
                  →
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  brandHeader: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    minHeight: 44,
  },
  brandLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  brandTitle: {
    letterSpacing: 1,
    fontFamily: getFontFamilyForWeight(Weight.semibold),
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  intro: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  headline: {
    textAlign: 'center',
  },
  introBody: {
    textAlign: 'center',
    lineHeight: Typography.body * 1.5,
    maxWidth: 340,
  },
  fieldBlock: {
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fieldLabel: {
    letterSpacing: 2,
  },
  fieldLabelMuted: {
    letterSpacing: 2,
    opacity: 0.5,
  },
  dateValue: {
    flex: 1,
  },
  datePill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    minHeight: 72,
  },
  datePickerWrap: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  lifespanValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  yearsLabel: {
    letterSpacing: 1,
  },
  sliderWrap: {
    paddingTop: Spacing.sm,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  infoCard: {
    marginTop: Spacing.sm,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  footerSkip: {
    paddingVertical: Spacing.sm,
  },
  ctaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.full,
    minHeight: 48,
    ...Shadows.card,
  },
  ctaDisabled: {
    opacity: 0.8,
  },
  ctaLabel: {
    fontFamily: getFontFamilyForWeight(Weight.semibold),
    color: '#FFFFFF',
  },
});
