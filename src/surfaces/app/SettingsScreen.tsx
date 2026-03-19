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
  Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Text, ScreenGradient, Card } from '../../ui';
import {
  useObserveTimeState,
  useUpdateUserProfile,
  useObserveSubscription,
} from '../../hooks';
import { getAppVersionUseCase } from '../../di';
import {
  useTheme,
  Spacing,
  Radius,
  Typography,
  Weight,
  getFontFamilyForWeight,
  FontFamily,
} from '../../theme';
import { useThemeStore } from '../../stores/themeStore';
import type { RootStackParamList } from '../../navigation/RootNavigator';

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

const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];

function formatBornExpected(birthDate: string | null, deathAge: number): string {
  if (!birthDate || birthDate.length < 10) return `EXPECTED: ${deathAge} YEARS`;
  const [y, m] = birthDate.split('-').map(Number);
  const month = MONTHS[(m ?? 1) - 1] ?? '';
  return `BORN: ${month} ${y}  +  EXPECTED: ${deathAge} YEARS`;
}

const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=app.until.time';

type ThemeOptionValue = 'light' | 'dark' | 'system';
const THEME_OPTIONS: { value: ThemeOptionValue; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
];

type IntentionalityMode = 'quiet' | 'radical';

export function SettingsScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList, 'Settings'>>();
  const { userProfile, timeState } = useObserveTimeState();
  const updateUserProfile = useUpdateUserProfile();
  const { isPremium } = useObserveSubscription();
  const theme = useTheme();
  const themeMode = useThemeStore(s => s.themeMode);
  const setThemeMode = useThemeStore(s => s.setThemeMode);

  const [birthInput, setBirthInput] = useState(userProfile.birthDate ?? '');
  const [deathInput, setDeathInput] = useState(String(userProfile.deathAge));
  const [showBirthPicker, setShowBirthPicker] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [intentionality, setIntentionality] = useState<IntentionalityMode>('quiet');

  const birthDateForPicker = useMemo(
    () => parseBirthDate(birthInput),
    [birthInput],
  );

  const lifePercent = Math.round((timeState?.life ?? 0) * 100);
  const bornExpectedLine = formatBornExpected(userProfile.birthDate, userProfile.deathAge);

  useEffect(() => {
    setBirthInput(userProfile.birthDate ?? '');
    setDeathInput(String(userProfile.deathAge));
  }, [userProfile.birthDate, userProfile.deathAge]);

  const handleSave = () => {
    if (birthInput) {
      const age = parseInt(deathInput, 10);
      updateUserProfile(birthInput, isNaN(age) || age <= 0 ? 80 : age);
      setShowEditProfile(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScreenGradient>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboard}
        >
          <ScrollView
            contentContainerStyle={[styles.content, { paddingBottom: Spacing[6] }]}
            showsVerticalScrollIndicator={false}
          >
            {/* Profile hero — centered, minimal */}
            <View style={styles.profileHero}>
              <View style={[styles.avatarRing, { borderColor: theme.divider }]}>
                <View style={[styles.avatar, { backgroundColor: theme.cardLighter }]}>
                  <Text variant="sectionTitle" style={{ color: theme.textSecondary }}>
                    UNTIL
                  </Text>
                </View>
                <View style={[styles.avatarEditBadge, { backgroundColor: theme.background }]}>
                  <Text style={[styles.editIcon, { color: theme.textPrimary }]}>✎</Text>
                </View>
              </View>
              <Text variant="title" style={[styles.profileName, { color: theme.textPrimary }]}>
                Profile
              </Text>
              <Text variant="caption" style={[styles.profileMeta, { color: theme.textSecondary }]}>
                {bornExpectedLine}
              </Text>
              <Text variant="caption" style={[styles.profileMeta, { color: theme.textSecondary }]}>
                REALITY: {lifePercent}% JOURNEY COMPLETED
              </Text>
            </View>

            {/* ACCOUNT */}
            <View style={styles.section}>
              <Text variant="caption" style={[styles.sectionLabel, { color: theme.textSecondary }]}>
                ACCOUNT
              </Text>
              <TouchableOpacity
                style={[styles.row, { borderBottomColor: theme.divider }]}
                onPress={() => setShowEditProfile(!showEditProfile)}
                activeOpacity={0.7}
              >
                <View style={styles.rowContent}>
                  <Text variant="body" style={{ color: theme.textPrimary }}>Birth & lifespan</Text>
                  <Text variant="caption" style={[styles.rowSubtitle, { color: theme.textSecondary }]}>
                    {userProfile.birthDate ? `${userProfile.birthDate} · ${userProfile.deathAge} years` : 'Tap to set'}
                  </Text>
                </View>
                <Text style={[styles.chevron, { color: theme.textSecondary }]}>›</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.row, styles.rowLast, { borderBottomColor: theme.divider }]}
                onPress={() => !isPremium && Platform.OS === 'android' && Linking.openURL(PLAY_STORE_URL)}
                activeOpacity={0.7}
              >
                <View style={styles.rowContent}>
                  <Text variant="body" style={{ color: theme.textPrimary }}>Premium</Text>
                  <Text variant="caption" style={[styles.rowSubtitle, { color: theme.textSecondary }]}>
                    {isPremium ? 'Active — managed via your store account' : 'Not active'}
                  </Text>
                </View>
                <Text style={[styles.chevron, { color: theme.textSecondary }]}>›</Text>
              </TouchableOpacity>
            </View>

            {/* Edit profile card — inline when expanded */}
            {showEditProfile && (
              <Card style={styles.editCard}>
                <Text variant="caption" color="secondary" style={styles.editLabel}>Birth date</Text>
                <TouchableOpacity
                  style={[styles.input, { borderColor: theme.divider }]}
                  onPress={() => setShowBirthPicker(true)}
                >
                  <Text variant="body" color={birthInput ? 'primary' : 'secondary'} style={styles.inputText}>
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
                  <TouchableOpacity style={styles.pickerDone} onPress={() => setShowBirthPicker(false)}>
                    <Text variant="caption" color="primary">Done</Text>
                  </TouchableOpacity>
                )}
                <Text variant="caption" color="secondary" style={styles.editLabel}>Expected lifespan (years)</Text>
                <TextInput
                  style={[styles.input, { borderColor: theme.divider }]}
                  value={deathInput}
                  onChangeText={setDeathInput}
                  placeholder="80"
                  placeholderTextColor={theme.textSecondary}
                  keyboardType="number-pad"
                />
                <TouchableOpacity
                  style={[styles.saveBtn, { backgroundColor: theme.percent }]}
                  onPress={handleSave}
                >
                  <Text variant="sectionTitle" style={styles.saveBtnLabel}>Save</Text>
                </TouchableOpacity>
              </Card>
            )}

            {/* CONFIGURATION */}
            <View style={styles.section}>
              <Text variant="caption" style={[styles.sectionLabel, { color: theme.textSecondary }]}>
                CONFIGURATION
              </Text>
              <View style={[styles.appearanceRow, { borderBottomColor: theme.divider }]}>
                <Text variant="body" style={[styles.appearanceLabel, { color: theme.textPrimary }]}>
                  Appearance
                </Text>
                <Text variant="caption" style={[styles.appearanceSubtitle, { color: theme.textSecondary }]}>
                  Choose how UNTIL looks
                </Text>
                <View style={styles.themeChips}>
                  {THEME_OPTIONS.map(({ value, label }) => {
                    const isSelected = themeMode === value;
                    const chipTextColor = isSelected ? '#FFFFFF' : theme.textSecondary;
                    return (
                      <TouchableOpacity
                        key={value}
                        style={[
                          styles.chip,
                          isSelected
                            ? { backgroundColor: theme.percent, borderColor: theme.percent }
                            : { backgroundColor: theme.cardBase, borderColor: theme.divider },
                        ]}
                        onPress={() => setThemeMode(value)}
                        activeOpacity={0.75}
                      >
                        <Text
                          variant="caption"
                          style={[
                            styles.chipLabel,
                            { color: chipTextColor },
                            isSelected && styles.chipLabelSelected,
                          ]}
                        >
                          {label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
              <TouchableOpacity
                style={[styles.row, styles.rowLast, { borderBottomColor: theme.divider }]}
                onPress={() => navigation.navigate('Widget')}
                activeOpacity={0.7}
              >
                <View style={styles.rowContent}>
                  <Text variant="body" style={{ color: theme.textPrimary }}>Widget Design</Text>
                  <Text variant="caption" style={[styles.rowSubtitle, { color: theme.textSecondary }]}>
                    Lockscreen & Home aesthetics
                  </Text>
                </View>
                <Text style={[styles.chevron, { color: theme.textSecondary }]}>›</Text>
              </TouchableOpacity>
            </View>

            {/* Intentionality Focus card */}
            <Card style={styles.intentCard} lighter>
              <Text variant="title" style={[styles.intentTitle, { color: theme.textPrimary }]}>
                Intentionality Focus
              </Text>
              <Text variant="body" style={[styles.intentDesc, { color: theme.textSecondary }]}>
                Define the core essence of your current life stage. This will influence the tone of your Until insights.
              </Text>
              <View style={styles.radioGroup}>
                <TouchableOpacity
                  style={styles.radioRow}
                  onPress={() => setIntentionality('quiet')}
                  activeOpacity={0.7}
                >
                  <View style={[styles.radioOuter, { borderColor: theme.divider }]}>
                    {intentionality === 'quiet' && (
                      <View style={[styles.radioInner, { backgroundColor: theme.textPrimary }]} />
                    )}
                  </View>
                  <Text variant="sectionTitle" style={[styles.radioLabel, { color: theme.textPrimary }]}>
                    QUIET CONTEMPLATION
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.radioRow}
                  onPress={() => setIntentionality('radical')}
                  activeOpacity={0.7}
                >
                  <View style={[styles.radioOuter, { borderColor: theme.divider }]}>
                    {intentionality === 'radical' && (
                      <View style={[styles.radioInner, { backgroundColor: theme.textPrimary }]} />
                    )}
                  </View>
                  <Text variant="sectionTitle" style={[styles.radioLabel, { color: theme.textPrimary }]}>
                    RADICAL ACTION
                  </Text>
                </TouchableOpacity>
              </View>
            </Card>

            <View style={[styles.versionRow, { borderTopColor: theme.divider }]}>
              <Text variant="caption" color="secondary">App version</Text>
              <Text variant="body" color="primary" style={styles.versionValue}>
                {(() => {
                  const { version, buildNumber } = getAppVersionUseCase.execute();
                  return buildNumber ? `${version} (${buildNumber})` : version;
                })()}
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
  chevron: {
    fontSize: Typography.title,
    marginLeft: Spacing[2],
  },
  appearanceRow: {
    paddingVertical: Spacing[4],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  appearanceLabel: {
    fontFamily: getFontFamilyForWeight(Weight.medium),
    marginBottom: Spacing.xs,
  },
  appearanceSubtitle: {
    marginBottom: Spacing[3],
  },
  themeChips: {
    flexDirection: 'row',
    gap: Spacing[2],
    flexWrap: 'wrap',
  },
  chip: {
    paddingVertical: Spacing[2],
    paddingHorizontal: Spacing[3],
    borderRadius: Radius.md,
    borderWidth: 2,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipLabel: {
    fontFamily: getFontFamilyForWeight(Weight.medium),
    letterSpacing: 0.3,
  },
  chipLabelSelected: {
    fontFamily: getFontFamilyForWeight(Weight.semibold),
    color: '#FFFFFF',
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
