/**
 * Identity / Combined Reality Setup — collect birth date and expected lifespan.
 * Shown after onboarding; on complete saves profile and finishes auth flow.
 * Matches design: IDENTITY header, When were you born?, Expected Lifespan slider, SEE MY TIMELINE.
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
import { Text, ScreenGradient, Slider } from '../../ui';
import {
  useTheme,
  Spacing,
  Typography,
  Weight,
  getFontFamilyForWeight,
  FontFamily,
  Shadows,
  Radius,
} from '../../theme';
import { useUpdateUserProfile } from '../../hooks';
import type { AuthStackParamList } from '../../navigation/AuthNavigator';

const LIFESPAN_MIN = 45;
const LIFESPAN_MAX = 120;
const DEFAULT_LIFESPAN = 80;

function toBirthDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatDisplayDate(date: Date): string {
  const y = date.getFullYear();
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  const m = months[date.getMonth()];
  const d = date.getDate();
  return `${y} ${m} ${d}`;
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

  const [birthDate, setBirthDate] = useState(new Date(1990, 0, 1));
  const [showPicker, setShowPicker] = useState(false);
  const [lifespan, setLifespan] = useState(DEFAULT_LIFESPAN);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const birthDateStr = useMemo(() => toBirthDateString(birthDate), [birthDate]);

  const handleLifespanChange = useCallback((next: number) => {
    setLifespan(prev => {
      if (prev !== next) {
        Vibration.vibrate(5);
      }
      return next;
    });
  }, []);

  const handleSeeTimeline = async () => {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    await waitForNextFrame();

    try {
      await Promise.resolve(updateUserProfile(birthDateStr, lifespan));
      navigation.navigate('LifeWeeksPreview');
    } catch {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScreenGradient>
        <SafeAreaView style={styles.safe} edges={['top']}>
          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: Math.max(insets.bottom, Spacing[5]) + 80 },
            ]}
            showsVerticalScrollIndicator={false}
          >
            {/* Header: back + IDENTITY + faint EST. watermark */}
            <View style={styles.header}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
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
                  IDENTITY
                </Text>
              </View>
              <View style={styles.headerRight} />
            </View>
            {/* <View style={styles.watermarkWrap}>
              <Text style={[styles.watermark, { color: theme.textPrimary }]}>
                EST.
              </Text>
            </View> */}

            {/* When were you born? */}
            <View style={styles.section}>
              <Text
                variant="title"
                style={[styles.sectionTitle, { color: theme.textPrimary }]}
              >
                When were you{' '}
                <Text
                  style={{
                    fontFamily: FontFamily.bold,
                    fontSize: Typography.display,
                    color: percent,
                  }}
                >
                  BORN?
                </Text>
              </Text>
              <Text
                variant="caption"
                style={[styles.subtitle, { color: theme.textSecondary }]}
              >
                Select your date of birth to calibrate your timeline.
              </Text>
              <TouchableOpacity
                style={[styles.dateRow, { borderColor: theme.divider }]}
                onPress={() => setShowPicker(true)}
                activeOpacity={0.8}
              >
                <Text
                  variant="body"
                  style={[styles.currentDate, { color: theme.textPrimary }]}
                >
                  {formatDisplayDate(birthDate)}
                </Text>
              </TouchableOpacity>

              {showPicker && (
                <View style={styles.datePickerWrap}>
                  <DateTimePicker
                    value={birthDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'spinner'}
                    maximumDate={new Date()}
                    onChange={(
                      event: DateTimePickerEvent,
                      d?: Date | undefined,
                    ) => {
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
              )}
            </View>

            {/* Expected Lifespan */}
            <View style={styles.section}>
              <Text
                variant="title"
                style={[styles.sectionTitle, { color: theme.textPrimary }]}
              >
                Expected{' '}
                <Text style={[styles.accentText, { color: percent }]}>
                  LIFESPAN
                </Text>
              </Text>
              <Text
                variant="caption"
                style={[styles.subtitle, { color: theme.textSecondary }]}
              >
                Define your perspective on longevity.
              </Text>
              <View style={styles.lifespanValueWrap}>
                <Text style={[styles.lifespanValue, { color: percent }]}>
                  {lifespan}
                </Text>
                <Text
                  variant="caption"
                  style={[styles.targetLabel, { color: theme.textPrimary }]}
                >
                  TARGET
                </Text>
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
                  <Text
                    variant="caption"
                    style={{ color: theme.textSecondary }}
                  >
                    {LIFESPAN_MIN} YEARS
                  </Text>
                  <Text
                    variant="caption"
                    style={{ color: theme.textSecondary }}
                  >
                    {LIFESPAN_MAX} YEARS
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* CTA + footer */}
          <View
            style={[
              styles.footer,
              { paddingBottom: Math.max(insets.bottom, Spacing[3]) },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.cta,
                isSubmitting ? styles.ctaDisabled : null,
                { backgroundColor: percent },
              ]}
              onPress={handleSeeTimeline}
              activeOpacity={0.85}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text variant="sectionTitle" style={styles.ctaLabel}>
                    SEE MY TIMELINE
                  </Text>
                  <Text variant="sectionTitle" style={styles.ctaLabel}>
                    {' '}
                    →
                  </Text>
                </>
              )}
            </TouchableOpacity>
            <Text
              variant="micro"
              style={[styles.footerNote, { color: theme.textSecondary }]}
            >
              DATA PROCESSED LOCALLY FOR YOUR PRIVACY
            </Text>
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
    paddingTop: Spacing[2],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
    marginBottom: Spacing[2],
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
  watermarkWrap: {
    position: 'absolute',
    top: 33,
    // left: Spacing[4],
    right: Spacing[4],
    alignItems: 'center',
    pointerEvents: 'none',
    opacity: 0.12,
  },
  watermark: {
    fontSize: 72,
    fontFamily: getFontFamilyForWeight(Weight.bold),
    letterSpacing: 4,
  },
  section: {
    marginTop: Spacing[6],
  },
  sectionTitle: {
    fontFamily: getFontFamilyForWeight(Weight.semibold),
    marginBottom: Spacing.sm,
  },
  accentText: {
    fontFamily: FontFamily.bold,
    fontSize: Typography.display,
  },
  subtitle: {
    marginBottom: Spacing[3],
  },
  currentDate: {
    marginBottom: Spacing[2],
  },
  datePickerWrap: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  dateRow: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[3],
  },
  pickerDone: {
    alignSelf: 'flex-end',
    paddingVertical: Spacing[2],
    marginTop: Spacing[2],
  },
  lifespanValueWrap: {
    alignItems: 'center',
    marginBottom: Spacing[2],
  },
  lifespanValue: {
    fontSize: 56,
    fontFamily: getFontFamilyForWeight(Weight.bold),
  },
  targetLabel: {
    letterSpacing: 1,
    marginTop: Spacing.xs,
  },
  sliderWrap: {
    marginTop: Spacing[2],
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
    paddingHorizontal: 2,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[4],
    borderRadius: Radius.md,
    minHeight: 56,
    ...Shadows.card,
  },
  ctaDisabled: {
    opacity: 0.8,
  },
  ctaLabel: {
    fontFamily: getFontFamilyForWeight(Weight.bold),
    color: '#FFFFFF',
  },
  footerNote: {
    textAlign: 'center',
    letterSpacing: 1,
    marginTop: Spacing[3],
    opacity: 0.8,
  },
});
