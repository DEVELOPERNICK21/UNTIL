import React, { useCallback, useEffect, useMemo } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Text, ScreenGradient } from '../../../shared/ui';
import { Spacing, Radius, Typography, useTheme } from '../../../shared/theme';
import type { ThemePalette } from '../../../shared/theme';
import { WidgetPreview } from './WidgetPreview';
import { useWidgetConfig } from '../hooks/useWidgetConfig';
import { useAccessControl } from '../../premium';
import { isPremiumWidgetConfigType } from '../config/widgetGating';
import {
  WIDGET_ACCENTS,
  isPremiumWidgetAccent,
} from '../config/widgetAccents';
import type { RootStackParamList } from '../../../shared/navigation/types';
import { useTranslation } from '../../../shared/i18n/useTranslation';
import { ToggleRow } from './ToggleRow';

export function WidgetCustomizationScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { hasPremiumBundle } = useAccessControl();
  const {
    config,
    hydrate,
    setType,
    setTheme,
    setLayout,
    setFont,
    setAccent,
    setShowMessage,
    setMessage,
  } = useWidgetConfig();

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  // The saved message is compared as written, so a preset saved in another language is not highlighted.
  const presets = useMemo(
    () => [
      t('widgets.custom.preset.1'),
      t('widgets.custom.preset.2'),
      t('widgets.custom.preset.3'),
    ],
    [t],
  );

  const askForPremium = useCallback(
    (title: string, message: string) => {
      Alert.alert(title, message, [
        { text: t('common.notNow'), style: 'cancel' },
        {
          text: t('widgets.custom.viewPremium'),
          onPress: () => navigation.navigate('Premium'),
        },
      ]);
    },
    [navigation, t],
  );

  const promptPremiumForWidget = useCallback(
    (type: string) =>
      askForPremium(
        t('widgets.custom.premiumWidget.title'),
        t(
          type === 'month'
            ? 'widgets.custom.premiumWidget.month'
            : 'widgets.custom.premiumWidget.life',
        ),
      ),
    [askForPremium, t],
  );

  const handleSelectType = useCallback(
    (value: string) => {
      if (isPremiumWidgetConfigType(value) && !hasPremiumBundle) {
        promptPremiumForWidget(value);
        return;
      }
      setType(value as Parameters<typeof setType>[0]);
    },
    [hasPremiumBundle, promptPremiumForWidget, setType],
  );

  const handleSelectAccent = useCallback(
    (value: string) => {
      if (isPremiumWidgetAccent(value) && !hasPremiumBundle) {
        askForPremium(
          t('widgets.custom.premiumAccent.title'),
          t('widgets.custom.premiumAccent.message'),
        );
        return;
      }
      setAccent(value as Parameters<typeof setAccent>[0]);
    },
    [askForPremium, hasPremiumBundle, setAccent, t],
  );

  const handleAddWidget = useCallback(() => {
    if (isPremiumWidgetConfigType(config.type) && !hasPremiumBundle) {
      promptPremiumForWidget(config.type);
      return;
    }
    Alert.alert(t('widgets.custom.addWidget'), t('widgets.custom.addAlert'), [
      { text: t('widgets.custom.ok') },
    ]);
  }, [config.type, hasPremiumBundle, promptPremiumForWidget, t]);

  return (
    <ScreenGradient>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        bounces
      >
        <Text variant="title" style={styles.title}>
          {t('widgets.custom.previewTitle')}
        </Text>

        <WidgetPreview config={config} />

        <View style={styles.section}>
          <SectionLabel label={t('widgets.custom.section.type')} />
          <HorizontalPills
            options={[
              { key: 'day', label: t('nav.today') },
              { key: 'month', label: t('nav.thisMonth') },
              { key: 'year', label: t('nav.thisYear') },
              { key: 'life', label: t('widgets.custom.type.life') },
            ]}
            selected={config.type}
            onSelect={handleSelectType}
          />
        </View>

        <View style={styles.section}>
          <SectionLabel label={t('widgets.custom.section.theme')} />
          <HorizontalPills
            options={[
              { key: 'light', label: t('widgets.custom.theme.light') },
              { key: 'dark', label: t('widgets.custom.theme.dark') },
              { key: 'amoled', label: t('widgets.custom.theme.amoled') },
            ]}
            selected={config.theme}
            onSelect={value => setTheme(value as any)}
          />
        </View>

        <View style={styles.section}>
          <SectionLabel label={t('widgets.custom.section.layout')} />
          <HorizontalPills
            options={[
              { key: 'minimal', label: t('widgets.custom.layout.minimal') },
              { key: 'detailed', label: t('widgets.custom.layout.detailed') },
            ]}
            selected={config.layout}
            onSelect={value => setLayout(value as any)}
          />
        </View>

        <View style={styles.section}>
          <SectionLabel label={t('widgets.custom.section.font')} />
          <HorizontalPills
            options={[
              { key: 'clean', label: t('widgets.custom.font.clean') },
              { key: 'emotional', label: t('widgets.custom.font.emotional') },
            ]}
            selected={config.font}
            onSelect={value => setFont(value as any)}
          />
        </View>

        <View style={styles.section}>
          <View style={styles.accentHeaderRow}>
            <SectionLabel label={t('widgets.custom.section.accent')} />
            {!hasPremiumBundle && (
              <Text
                variant="caption"
                color="secondary"
                style={styles.premiumTag}
              >
                {t('widgets.custom.premiumTag')}
              </Text>
            )}
          </View>
          <View style={styles.accentRow}>
            {WIDGET_ACCENTS.map(option => {
              const isActive = option.key === config.accent;
              const locked = option.premium && !hasPremiumBundle;
              return (
                <TouchableOpacity
                  key={option.key}
                  activeOpacity={0.8}
                  onPress={() => handleSelectAccent(option.key)}
                  style={styles.accentItem}
                >
                  <View
                    style={[
                      styles.accentSwatch,
                      { backgroundColor: option.color },
                      isActive && styles.accentSwatchActive,
                      locked && styles.accentSwatchLocked,
                    ]}
                  >
                    {locked && <Text style={styles.accentLockGlyph}>•</Text>}
                  </View>
                  <Text
                    variant="caption"
                    color={isActive ? 'primary' : 'secondary'}
                    style={styles.accentLabel}
                  >
                    {t(option.labelKey)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <SectionLabel label={t('widgets.custom.section.message')} />
          <ToggleRow
            label={t('widgets.custom.showMessage')}
            active={config.showMessage}
            onToggle={() => setShowMessage(!config.showMessage)}
          />
          {config.showMessage && (
            <View style={styles.messageSection}>
              <Text variant="caption" color="secondary" style={styles.subLabel}>
                {t('widgets.custom.presets')}
              </Text>
              <HorizontalPills
                options={presets.map(m => ({ key: m, label: m }))}
                selected={
                  presets.includes(config.message)
                    ? config.message
                    : undefined
                }
                onSelect={value => setMessage(value)}
                wrap
              />
              <Text variant="caption" color="secondary" style={styles.subLabel}>
                {t('widgets.custom.writeOwn')}
              </Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  value={config.message}
                  onChangeText={setMessage}
                  placeholder={t('widgets.custom.placeholder')}
                  placeholderTextColor={theme.textSecondary}
                  style={styles.input}
                  maxLength={80}
                />
              </View>
            </View>
          )}
        </View>

        <View style={styles.footerSpacer} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.primaryButton}
          onPress={handleAddWidget}
        >
          <Text style={styles.primaryButtonText}>
            {t('widgets.custom.addWidget')}
          </Text>
        </TouchableOpacity>
      </View>
    </ScreenGradient>
  );
}

function SectionLabel({ label }: { label: string }) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <Text variant="caption" color="secondary" style={styles.sectionLabel}>
      {label}
    </Text>
  );
}

interface HorizontalPillsProps {
  options: { key: string; label: string }[];
  selected?: string;
  onSelect: (key: string) => void;
  wrap?: boolean;
}

function HorizontalPills({
  options,
  selected,
  onSelect,
  wrap,
}: HorizontalPillsProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <View
      style={[styles.pillRow, wrap && { flexWrap: 'wrap', rowGap: Spacing.sm }]}
    >
      {options.map(option => {
        const isActive = option.key === selected;
        return (
          <TouchableOpacity
            key={option.key}
            activeOpacity={0.8}
            onPress={() => onSelect(option.key)}
            style={[styles.pillOption, isActive && styles.pillOptionActive]}
          >
            <Text
              style={[
                styles.pillOptionText,
                isActive && styles.pillOptionTextActive,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function createStyles(theme: ThemePalette) {
  return StyleSheet.create({
    scroll: {
      flex: 1,
    },
    content: {
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.lg,
      paddingBottom: Spacing.xl * 2,
    },
    title: {
      marginBottom: Spacing.sm,
    },
    section: {
      marginTop: Spacing.lg,
    },
    sectionLabel: {
      marginBottom: Spacing.xs,
      letterSpacing: 1,
    },
    accentHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    premiumTag: {
      letterSpacing: 1,
      marginBottom: Spacing.xs,
    },
    accentRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      columnGap: Spacing.md,
      rowGap: Spacing.sm,
    },
    accentItem: {
      alignItems: 'center',
      width: 56,
    },
    accentSwatch: {
      width: 36,
      height: 36,
      borderRadius: 18,
      borderWidth: 2,
      borderColor: 'transparent',
      alignItems: 'center',
      justifyContent: 'center',
    },
    accentSwatchActive: {
      borderColor: theme.textPrimary,
    },
    accentSwatchLocked: {
      opacity: 0.5,
    },
    accentLockGlyph: {
      color: '#FFFFFF',
      fontSize: 18,
      fontWeight: '700',
    },
    accentLabel: {
      marginTop: 4,
    },
    pillRow: {
      flexDirection: 'row',
      columnGap: Spacing.sm,
    },
    pillOption: {
      borderRadius: 999,
      paddingHorizontal: Spacing.md,
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: theme.divider,
      backgroundColor: theme.cardBase,
    },
    pillOptionActive: {
      backgroundColor: `${theme.percent}26`,
      borderColor: theme.percent,
    },
    pillOptionText: {
      fontSize: Typography.body,
      color: theme.textPrimary,
    },
    pillOptionTextActive: {
      color: theme.textPrimary,
    },
    messageSection: {
      marginTop: Spacing.sm,
    },
    subLabel: {
      marginTop: Spacing.sm,
      marginBottom: Spacing.xs,
    },
    inputWrapper: {
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: theme.divider,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      backgroundColor: theme.cardBase,
      marginTop: Spacing.xs,
    },
    input: {
      fontSize: Typography.body,
      color: theme.textPrimary,
    },
    footer: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      padding: Spacing.lg,
      backgroundColor: theme.background,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.divider,
    },
    footerSpacer: {
      height: Spacing.xl * 2,
    },
    primaryButton: {
      backgroundColor: theme.percent,
      borderRadius: Radius.lg,
      paddingVertical: Spacing.md,
      alignItems: 'center',
    },
    primaryButtonText: {
      color: '#FFFFFF',
      fontSize: Typography.body,
    },
  });
}
