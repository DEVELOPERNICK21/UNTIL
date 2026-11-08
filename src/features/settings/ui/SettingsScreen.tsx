/**
 * Settings & Profile — minimalistic UI: profile hero, ACCOUNT / CONFIGURATION
 * sections, Intentionality Focus card. Uses theme only; data via hooks.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Text, ScreenGradient, GlassCard } from '../../../shared/ui';
import { useObserveTimeState, useUpdateUserProfile } from '../../time';
import {
  useObserveSubscription,
  useAccessControl,
  useManageSubscription,
} from '../../premium';
import { useAppVersion } from '../../app-update';
import {
  useRetentionNotifications,
  useInAppReview,
  useTaskDeadlineNotifications,
} from '../../engagement';
import { useDailyNothingLimit } from '../../activity';
import { useAuthSession } from '../../account';
import {
  useAnalyticsConsent,
} from '../../../shared/analytics/useAnalyticsConsent';
import {
  useTheme,
  Spacing,
  Radius,
  Typography,
  Weight,
  getFontFamilyForWeight,
  FontFamily,
} from '../../../shared/theme';
import type { RootStackParamList } from '../../../shared/navigation/types';
import { logAnalyticsEvent } from '../../../shared/analytics/analytics';
import { promptDesktopDownload } from '../../../shared/desktopDownload';
import { useTranslation } from '../../../shared/i18n/useTranslation';
import { useLanguage } from '../../../shared/i18n/useLanguage';
import { getDeviceLanguage } from '../../../shared/i18n/i18nService';
import {
  SettingsRow,
  SettingsSwitchRow,
  settingsRowStyles,
} from './SettingsRow';
import {
  LanguagePickerModal,
  nativeLanguageName,
} from './LanguagePickerModal';

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

type IntentionalityMode = 'quiet' | 'radical';

export function SettingsScreen() {
  const { t, formatDate } = useTranslation();
  const { language, preference, setPreference } = useLanguage();
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
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
  const {
    enabled: taskDeadlineRemindersEnabled,
    setEnabled: setTaskDeadlineRemindersEnabled,
  } = useTaskDeadlineNotifications();
  const { analyticsEnabled, analyticsLocked, setAnalyticsEnabled } =
    useAnalyticsConsent();
  const { hasPremiumBundle } = useAccessControl();
  const { openManageSubscription } = useManageSubscription();
  const { signedIn, email } = useAuthSession();
  const { limitHours, setLimitHours } = useDailyNothingLimit();
  const { rateApp } = useInAppReview();
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
  const expectedYears = t('common.years', { count: userProfile.deathAge });
  const [bornYear, bornMonth] = (userProfile.birthDate ?? '')
    .split('-')
    .map(Number);
  const bornExpectedLine =
    userProfile.birthDate && userProfile.birthDate.length >= 10
      ? t('settings.profile.bornAndExpected', {
          month: formatDate(new Date(bornYear, (bornMonth ?? 1) - 1, 1), {
            month: 'short',
          }),
          year: bornYear,
          years: expectedYears,
        })
      : t('settings.profile.expectedOnly', { years: expectedYears });

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
                {t('settings.profile.name')}
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
                {t('settings.profile.lifeComplete', { percent: lifePercent })}
              </Text>
            </View>

            {/* ACCOUNT */}
            <View style={styles.section}>
              <Text
                variant="caption"
                style={[styles.sectionLabel, { color: theme.textSecondary }]}
              >
                {t('settings.section.account')}
              </Text>
              <GlassCard style={styles.sectionCard}>
                <SettingsRow
                  title={t('settings.birth.title')}
                  subtitle={
                    userProfile.birthDate
                      ? t('settings.birth.summary', {
                          birthDate: userProfile.birthDate,
                          years: expectedYears,
                        })
                      : t('settings.birth.tapToSet')
                  }
                  onPress={() => setShowEditProfile(!showEditProfile)}
                />
                <SettingsRow
                  title={t('settings.premium.title')}
                  subtitle={
                    isPremium
                      ? t('settings.premium.active')
                      : t('settings.premium.offer')
                  }
                  onPress={() => navigation.navigate('Premium')}
                />
                <SettingsRow
                  title={t('settings.manage.title')}
                  subtitle={t('settings.manage.subtitle')}
                  onPress={() => openManageSubscription('settings')}
                  accessibilityLabel={t('settings.manage.a11y')}
                />
                <SettingsRow
                  last
                  title={t('settings.account.title')}
                  subtitle={
                    signedIn
                      ? email ?? t('settings.account.signedIn')
                      : t('settings.account.signedOut')
                  }
                  onPress={() => navigation.navigate('Account')}
                />
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
                  {t('settings.edit.birthDate')}
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
                    {birthInput || t('settings.edit.pickDate')}
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
                      {t('common.done')}
                    </Text>
                  </TouchableOpacity>
                )}
                <Text
                  variant="caption"
                  color="secondary"
                  style={styles.editLabel}
                >
                  {t('settings.edit.lifespan')}
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
                    {t('common.save')}
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
                {t('settings.section.configuration')}
              </Text>
              <GlassCard style={styles.sectionCard}>
                <SettingsRow
                  title={t('settings.widgetDesign.title')}
                  subtitle={t('settings.widgetDesign.subtitle')}
                  onPress={() => navigation.navigate('Widget')}
                />
                <SettingsRow
                  title={t('settings.language.title')}
                  subtitle={
                    preference === 'system'
                      ? t('settings.language.systemCurrent', {
                          language: nativeLanguageName(language),
                        })
                      : nativeLanguageName(language)
                  }
                  onPress={() => setShowLanguagePicker(true)}
                  accessibilityLabel={t('settings.language.pickerA11y')}
                />
                <SettingsRow
                  title={t('settings.rate.title')}
                  subtitle={
                    Platform.OS === 'ios'
                      ? t('settings.rate.ios')
                      : t('settings.rate.android')
                  }
                  onPress={() => rateApp()}
                />
                <SettingsRow
                  title={t('settings.desktop.title')}
                  subtitle={t('settings.desktop.subtitle')}
                  onPress={promptDesktopDownload}
                  accessibilityLabel={t('settings.desktop.a11y')}
                />
                <View
                  style={[settingsRowStyles.row, { borderBottomColor: theme.glassBorder }]}
                >
                  <View style={settingsRowStyles.rowContent}>
                    <Text variant="body" style={{ color: theme.textPrimary }}>
                      {t('settings.lostTime.title')}
                    </Text>
                    <Text
                      variant="caption"
                      style={[
                        settingsRowStyles.rowSubtitle,
                        { color: theme.textSecondary },
                      ]}
                    >
                      {hasPremiumBundle
                        ? t('settings.lostTime.premiumOn')
                        : t('settings.lostTime.premiumOff')}
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
                              {t('settings.lostTime.hours', { hours: h })}
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
                          settingsRowStyles.chevron,
                          { color: theme.textSecondary },
                        ]}
                      >
                        ›
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
                <SettingsSwitchRow
                  title={t('settings.reminders.daily.title')}
                  subtitle={t('settings.reminders.daily.body')}
                  value={retentionRemindersEnabled}
                  onValueChange={handleRetentionReminderToggle}
                />
                <SettingsSwitchRow
                  title={t('settings.reminders.tasks.title')}
                  subtitle={t('settings.reminders.tasks.body')}
                  value={taskDeadlineRemindersEnabled}
                  onValueChange={setTaskDeadlineRemindersEnabled}
                />
                <SettingsSwitchRow
                  last
                  title={t('settings.analytics.title')}
                  subtitle={
                    analyticsLocked
                      ? t('settings.analytics.locked')
                      : t('settings.analytics.body')
                  }
                  value={analyticsEnabled}
                  onValueChange={setAnalyticsEnabled}
                  disabled={analyticsLocked}
                  switchAccessibilityLabel={t('settings.analytics.title')}
                />
              </GlassCard>
            </View>

            {/* Intentionality Focus card */}
            <GlassCard style={styles.intentCard}>
              <Text
                variant="title"
                style={[styles.intentTitle, { color: theme.textPrimary }]}
              >
                {t('settings.intent.title')}
              </Text>
              <Text
                variant="body"
                style={[styles.intentDesc, { color: theme.textSecondary }]}
              >
                {t('settings.intent.body')}
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
                    {t('settings.intent.quiet')}
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
                    {t('settings.intent.radical')}
                  </Text>
                </TouchableOpacity>
              </View>
            </GlassCard>

            <View
              style={[styles.versionRow, { borderTopColor: theme.divider }]}
            >
              <Text variant="caption" color="secondary">
                {t('settings.version')}
              </Text>
              <Text variant="body" color="primary" style={styles.versionValue}>
                {appVersion}
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
        <LanguagePickerModal
          visible={showLanguagePicker}
          preference={preference}
          deviceLanguage={getDeviceLanguage()}
          onSelect={choice => {
            setPreference(choice);
            setShowLanguagePicker(false);
          }}
          onClose={() => setShowLanguagePicker(false)}
        />
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
    letterSpacing: 0.4,
    marginBottom: Spacing[2],
    marginLeft: Spacing[1],
  },
  sectionCard: {
    paddingVertical: Spacing[1],
    paddingHorizontal: Spacing[3],
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
