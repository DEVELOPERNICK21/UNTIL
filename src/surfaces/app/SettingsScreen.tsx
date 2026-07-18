/**
 * Settings & Profile — minimalistic UI: profile hero, ACCOUNT / CONFIGURATION
 * sections, Intentionality Focus card. Uses theme only; data via hooks.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  Switch,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Text, ScreenGradient, GlassCard } from '../../ui';
import {
  useObserveTimeState,
  useUpdateUserProfile,
  useObserveSubscription,
  useAppVersion,
  useRetentionNotifications,
  useAccessControl,
  useDailyNothingLimit,
} from '../../hooks';
import {
  useTheme,
  Spacing,
  Radius,
  Typography,
  Weight,
  getFontFamilyForWeight,
  FontFamily,
} from '../../theme';
import type { RootStackParamList } from '../../navigation/RootNavigator';
import { logAnalyticsEvent } from '../../services/analytics';

function parseBirthDate(str: string): Date {
  if (!str || str.length < 10) return new Date(1990, 0, 1);
  const [y, m, d] = str.split('-').map(Number);
  if (Number.isNaN(y) || Number.isNaN(m) || Number.isNaN(d))
    return new Date(1990, 0, 1);
  const date = new Date(y, (m ?? 1) - 1, d ?? 1);
  return isNaN(date.getTime()) ? new Date(1990, 0, 1) : date;
}

function toBirthDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const MONTHS = [
  'JAN',
  'FEB',
  'MAR',
  'APR',
  'MAY',
  'JUN',
  'JUL',
  'AUG',
  'SEP',
  'OCT',
  'NOV',
  'DEC',
];

function formatBornExpected(
  birthDate: string | null,
  deathAge: number,
): string {
  if (!birthDate || birthDate.length < 10) return `EXPECTED: ${deathAge} YEARS`;
  const [y, m] = birthDate.split('-').map(Number);
  const month = MONTHS[(m ?? 1) - 1] ?? '';
  return `BORN: ${month} ${y}  +  EXPECTED: ${deathAge} YEARS`;
}

type IntentionalityMode = 'quiet' | 'radical';

export function SettingsScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList, 'Settings'>>();
  const { userProfile, timeState } = useObserveTimeState();
  const updateUserProfile = useUpdateUserProfile();
  const { isPremium } = useObserveSubscription();
  const appVersion = useAppVersion();
  const {
    enabled: retentionRemindersEnabled,
    setEnabled: setRetentionRemindersEnabled,
  } = useRetentionNotifications();
  const { hasPremiumBundle } = useAccessControl();
  const { limitHours, setLimitHours } = useDailyNothingLimit();
  const theme = useTheme();

  const [birthInput, setBirthInput] = useState(userProfile.birthDate ?? '');
  const [deathInput, setDeathInput] = useState(String(userProfile.deathAge));
  const [showBirthPicker, setShowBirthPicker] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [intentionality, setIntentionality] =
    useState<IntentionalityMode>('quiet');

  const birthDateForPicker = useMemo(
    () => parseBirthDate(birthInput),
    [birthInput],
  );

  const lifePercent = Math.round((timeState?.life ?? 0) * 100);
  const bornExpectedLine = formatBornExpected(
    userProfile.birthDate,
    userProfile.deathAge,
  );

  useEffect(() => {
    setBirthInput(userProfile.birthDate ?? '');
    setDeathInput(String(userProfile.deathAge));
  }, [userProfile.birthDate, userProfile.deathAge]);

  const handleSave = () => {
    if (birthInput) {
      const age = parseInt(deathInput, 10);
      const isFirstTimeSetting = !userProfile.birthDate;
      updateUserProfile(birthInput, isNaN(age) || age <= 0 ? 80 : age);
      void logAnalyticsEvent('settings_birth_date_saved', {
        is_first_time: isFirstTimeSetting,
      });
      setShowEditProfile(false);
    }
  };

  const handleRetentionReminderToggle = (enabled: boolean) => {
    setRetentionRemindersEnabled(enabled);
  };

  return (
    <View style={styles.container}>
      <ScreenGradient>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboard}
        >
          <ScrollView
            contentContainerStyle={[
              styles.content,
              { paddingBottom: Spacing[6] },
            ]}
            showsVerticalScrollIndicator={false}
          >
            {/* Profile hero — centered, minimal */}
            <View style={styles.profileHero}>
              <View style={[styles.avatarRing, { borderColor: theme.divider }]}>
                <View
                  style={[
                    styles.avatar,
                    { backgroundColor: theme.cardLighter },
                  ]}
                >
                  <Text
                    variant="sectionTitle"
                    style={{ color: theme.textSecondary }}
                  >
                    UNTIL
                  </Text>
                </View>
                <View
                  style={[
                    styles.avatarEditBadge,
                    { backgroundColor: theme.background },
                  ]}
                >
                  <Text style={[styles.editIcon, { color: theme.textPrimary }]}>
                    ✎
                  </Text>
                </View>
              </View>
              <Text
                variant="title"
                style={[styles.profileName, { color: theme.textPrimary }]}
              >
                Profile
              </Text>
              <Text
                variant="caption"
                style={[styles.profileMeta, { color: theme.textSecondary }]}
              >
                {bornExpectedLine}
              </Text>
              <Text
                variant="caption"
                style={[styles.profileMeta, { color: theme.textSecondary }]}
              >
                REALITY: {lifePercent}% JOURNEY COMPLETED
              </Text>
            </View>

            {/* ACCOUNT */}
            <View style={styles.section}>
              <Text
                variant="caption"
                style={[styles.sectionLabel, { color: theme.textSecondary }]}
              >
                ACCOUNT
              </Text>
              <GlassCard style={styles.sectionCard}>
                <TouchableOpacity
                  style={[styles.row, { borderBottomColor: theme.glassBorder }]}
                  onPress={() => setShowEditProfile(!showEditProfile)}
                  activeOpacity={0.7}
                >
                  <View style={styles.rowContent}>
                    <Text variant="body" style={{ color: theme.textPrimary }}>
                      Birth & lifespan
                    </Text>
                    <Text
                      variant="caption"
                      style={[
                        styles.rowSubtitle,
                        { color: theme.textSecondary },
                      ]}
                    >
                      {userProfile.birthDate
                        ? `${userProfile.birthDate} · ${userProfile.deathAge} years`
                        : 'Tap to set'}
                    </Text>
                  </View>
                  <Text
                    style={[styles.chevron, { color: theme.textSecondary }]}
                  >
                    ›
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.row, styles.rowLast]}
                  onPress={() => navigation.navigate('Premium')}
                  activeOpacity={0.7}
                >
                  <View style={styles.rowContent}>
                    <Text variant="body" style={{ color: theme.textPrimary }}>
                      Premium
                    </Text>
                    <Text
                      variant="caption"
                      style={[
                        styles.rowSubtitle,
                        { color: theme.textSecondary },
                      ]}
                    >
                      {isPremium
                        ? 'Active — manage in Google Play'
                        : 'Yearly subscription or lifetime'}
                    </Text>
                  </View>
                  <Text
                    style={[styles.chevron, { color: theme.textSecondary }]}
                  >
                    ›
                  </Text>
                </TouchableOpacity>
              </GlassCard>
            </View>

            {/* Edit profile card — inline when expanded */}
            {showEditProfile && (
              <GlassCard style={styles.editCard}>
                <Text
                  variant="caption"
                  color="secondary"
                  style={styles.editLabel}
                >
                  Birth date
                </Text>
                <TouchableOpacity
                  style={[styles.input, { borderColor: theme.glassBorder }]}
                  onPress={() => setShowBirthPicker(true)}
                >
                  <Text
                    variant="body"
                    color={birthInput ? 'primary' : 'secondary'}
                    style={styles.inputText}
                  >
                    {birthInput || 'Tap to pick date'}
                  </Text>
                </TouchableOpacity>
                {showBirthPicker && (
                  <DateTimePicker
                    value={birthDateForPicker}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    maximumDate={new Date()}
                    onChange={(_, d) => {
                      if (Platform.OS === 'android') setShowBirthPicker(false);
                      if (d) setBirthInput(toBirthDateString(d));
                    }}
                  />
                )}
                {Platform.OS === 'ios' && showBirthPicker && (
                  <TouchableOpacity
                    style={styles.pickerDone}
                    onPress={() => setShowBirthPicker(false)}
                  >
                    <Text variant="caption" color="primary">
                      Done
                    </Text>
                  </TouchableOpacity>
                )}
                <Text
                  variant="caption"
                  color="secondary"
                  style={styles.editLabel}
                >
                  Expected lifespan (years)
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      borderColor: theme.glassBorder,
                      color: theme.textPrimary,
                    },
                  ]}
                  value={deathInput}
                  onChangeText={setDeathInput}
                  placeholder="80"
                  placeholderTextColor={theme.textSecondary}
                  selectionColor={theme.percent}
                  keyboardType="number-pad"
                />
                <TouchableOpacity
                  style={[styles.saveBtn, { backgroundColor: theme.percent }]}
                  onPress={handleSave}
                >
                  <Text variant="sectionTitle" style={styles.saveBtnLabel}>
                    Save
                  </Text>
                </TouchableOpacity>
              </GlassCard>
            )}

            {/* CONFIGURATION */}
            <View style={styles.section}>
              <Text
                variant="caption"
                style={[styles.sectionLabel, { color: theme.textSecondary }]}
              >
                CONFIGURATION
              </Text>
              <GlassCard style={styles.sectionCard}>
                <TouchableOpacity
                  style={[styles.row, { borderBottomColor: theme.glassBorder }]}
                  onPress={() => navigation.navigate('Widget')}
                  activeOpacity={0.7}
                >
                  <View style={styles.rowContent}>
                    <Text variant="body" style={{ color: theme.textPrimary }}>
                      Widget Design
                    </Text>
                    <Text
                      variant="caption"
                      style={[
                        styles.rowSubtitle,
                        { color: theme.textSecondary },
                      ]}
                    >
                      Lockscreen & Home aesthetics
                    </Text>
                  </View>
                  <Text
                    style={[styles.chevron, { color: theme.textSecondary }]}
                  >
                    ›
                  </Text>
                </TouchableOpacity>
                <View
                  style={[styles.row, { borderBottomColor: theme.glassBorder }]}
                >
                  <View style={styles.rowContent}>
                    <Text variant="body" style={{ color: theme.textPrimary }}>
                      Lost-time alert limit
                    </Text>
                    <Text
                      variant="caption"
                      style={[
                        styles.rowSubtitle,
                        { color: theme.textSecondary },
                      ]}
                    >
                      {hasPremiumBundle
                        ? 'Red alert when wasted hours hit this daily cap.'
                        : 'Premium — nudge when you lose too much of today.'}
                    </Text>
                    {hasPremiumBundle ? (
                      <View style={styles.limitChips}>
                        {[1, 2, 3].map(h => (
                          <TouchableOpacity
                            key={h}
                            style={[
                              styles.limitChip,
                              {
                                borderColor:
                                  limitHours === h
                                    ? theme.percent
                                    : theme.glassBorder,
                                backgroundColor:
                                  limitHours === h
                                    ? 'rgba(232, 124, 32, 0.14)'
                                    : 'rgba(255, 255, 255, 0.04)',
                              },
                            ]}
                            onPress={() => {
                              setLimitHours(h);
                              void logAnalyticsEvent(
                                'intervention_limit_changed',
                                {
                                  hours: h,
                                },
                              );
                            }}
                            activeOpacity={0.8}
                          >
                            <Text
                              variant="caption"
                              style={{
                                color:
                                  limitHours === h
                                    ? theme.percent
                                    : theme.textSecondary,
                              }}
                            >
                              {h}h
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    ) : null}
                  </View>
                  {!hasPremiumBundle ? (
                    <TouchableOpacity
                      onPress={() => navigation.navigate('Premium')}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text
                        style={[
                          styles.chevron,
                          { color: theme.textSecondary },
                        ]}
                      >
                        ›
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
                <View style={[styles.row, styles.rowLast]}>
                  <View style={styles.rowContent}>
                    <Text variant="body" style={{ color: theme.textPrimary }}>
                      Daily Time Reminders
                    </Text>
                    <Text
                      variant="caption"
                      style={[
                        styles.rowSubtitle,
                        { color: theme.textSecondary },
                      ]}
                    >
                      One useful reminder per day. Uses your real progress. No
                      spam.
                    </Text>
                  </View>
                  <Switch
                    value={retentionRemindersEnabled}
                    onValueChange={handleRetentionReminderToggle}
                    trackColor={{
                      false: theme.divider,
                      true: 'rgba(232, 124, 32, 0.45)',
                    }}
                    thumbColor={
                      retentionRemindersEnabled
                        ? theme.percent
                        : theme.textSecondary
                    }
                  />
                </View>
              </GlassCard>
            </View>

            {/* Intentionality Focus card */}
            <GlassCard style={styles.intentCard}>
              <Text
                variant="title"
                style={[styles.intentTitle, { color: theme.textPrimary }]}
              >
                Intentionality Focus
              </Text>
              <Text
                variant="body"
                style={[styles.intentDesc, { color: theme.textSecondary }]}
              >
                Define the core essence of your current life stage. This will
                influence the tone of your Until insights.
              </Text>
              <View style={styles.radioGroup}>
                <TouchableOpacity
                  style={styles.radioRow}
                  onPress={() => setIntentionality('quiet')}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.radioOuter,
                      { borderColor: theme.glassBorder },
                    ]}
                  >
                    {intentionality === 'quiet' && (
                      <View
                        style={[
                          styles.radioInner,
                          { backgroundColor: theme.textPrimary },
                        ]}
                      />
                    )}
                  </View>
                  <Text
                    variant="sectionTitle"
                    style={[styles.radioLabel, { color: theme.textPrimary }]}
                  >
                    QUIET CONTEMPLATION
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.radioRow}
                  onPress={() => setIntentionality('radical')}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.radioOuter,
                      { borderColor: theme.glassBorder },
                    ]}
                  >
                    {intentionality === 'radical' && (
                      <View
                        style={[
                          styles.radioInner,
                          { backgroundColor: theme.textPrimary },
                        ]}
                      />
                    )}
                  </View>
                  <Text
                    variant="sectionTitle"
                    style={[styles.radioLabel, { color: theme.textPrimary }]}
                  >
                    RADICAL ACTION
                  </Text>
                </TouchableOpacity>
              </View>
            </GlassCard>

            <View
              style={[styles.versionRow, { borderTopColor: theme.divider }]}
            >
              <Text variant="caption" color="secondary">
                App version
              </Text>
              <Text variant="body" color="primary" style={styles.versionValue}>
                {appVersion}
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </ScreenGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboard: { flex: 1 },
  content: {
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[4],
  },
  profileHero: {
    alignItems: 'center',
    marginBottom: Spacing[5],
  },
  avatarRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing[3],
  },
  avatar: {
    width: 78,
    height: 78,
    borderRadius: 39,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEditBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  editIcon: {
    fontSize: 12,
  },
  profileName: {
    fontFamily: getFontFamilyForWeight(Weight.semibold),
    marginBottom: Spacing.xs,
  },
  profileMeta: {
    letterSpacing: 0.5,
    marginTop: Spacing.xs,
  },
  section: {
    marginBottom: Spacing[4],
  },
  sectionLabel: {
    letterSpacing: 1,
    marginBottom: Spacing[2],
    marginLeft: Spacing[1],
  },
  sectionCard: {
    paddingVertical: Spacing[1],
    paddingHorizontal: Spacing[3],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowContent: {
    flex: 1,
  },
  rowSubtitle: {
    marginTop: 2,
  },
  limitChips: {
    flexDirection: 'row',
    gap: Spacing[2],
    marginTop: Spacing[2],
  },
  limitChip: {
    paddingVertical: Spacing[1],
    paddingHorizontal: Spacing[3],
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  chevron: {
    fontSize: Typography.title,
    marginLeft: Spacing[2],
  },
  editCard: {
    marginBottom: Spacing[4],
  },
  editLabel: {
    marginBottom: Spacing[2],
  },
  input: {
    borderWidth: 1,
    borderRadius: Radius.sm,
    padding: Spacing[3],
    marginBottom: Spacing[3],
    minHeight: 48,
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  inputText: {
    fontSize: Typography.label,
  },
  pickerDone: {
    alignSelf: 'flex-end',
    paddingVertical: Spacing[1],
    marginBottom: Spacing[2],
  },
  saveBtn: {
    paddingVertical: Spacing[3],
    borderRadius: Radius.md,
    alignItems: 'center',
    marginTop: Spacing[2],
  },
  saveBtnLabel: {
    fontFamily: FontFamily.bold,
    color: '#FFFFFF',
  },
  intentCard: {
    marginBottom: Spacing[4],
    padding: Spacing[4],
  },
  intentTitle: {
    fontFamily: getFontFamilyForWeight(Weight.semibold),
    marginBottom: Spacing[2],
  },
  intentDesc: {
    marginBottom: Spacing[4],
    lineHeight: 22,
  },
  radioGroup: {
    gap: Spacing[3],
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  radioLabel: {
    fontFamily: getFontFamilyForWeight(Weight.medium),
    letterSpacing: 0.5,
  },
  versionRow: {
    marginTop: Spacing[4],
    paddingTop: Spacing[4],
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  versionValue: {
    marginTop: Spacing[1],
  },
});
