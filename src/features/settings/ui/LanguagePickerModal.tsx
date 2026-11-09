/**
 * Bottom sheet that lists the app languages, each in its own script, plus "match phone language".
 */

import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../../../shared/ui';
import { Radius, Spacing, useTheme } from '../../../shared/theme';
import { useTranslation } from '../../../shared/i18n/useTranslation';
import {
  SUPPORTED_LANGUAGES,
  type LanguageCode,
  type LanguagePreference,
} from '../../../shared/i18n/languages';

interface LanguagePickerModalProps {
  visible: boolean;
  preference: LanguagePreference;
  /** The language "match phone language" would pick right now. */
  deviceLanguage: LanguageCode;
  onSelect: (preference: LanguagePreference) => void;
  onClose: () => void;
}

export function nativeLanguageName(code: LanguageCode): string {
  return SUPPORTED_LANGUAGES.find(l => l.code === code)?.nativeName ?? code;
}

export function LanguagePickerModal({
  visible,
  preference,
  deviceLanguage,
  onSelect,
  onClose,
}: LanguagePickerModalProps) {
  const { t } = useTranslation();
  const theme = useTheme();

  const options: { value: LanguagePreference; title: string; hint?: string }[] =
    [
      {
        value: 'system',
        title: t('settings.language.system'),
        hint: nativeLanguageName(deviceLanguage),
      },
      ...SUPPORTED_LANGUAGES.map(l => ({ value: l.code, title: l.nativeName })),
    ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        style={styles.backdrop}
        onPress={onClose}
        accessibilityLabel={t('common.done')}
      >
        <Pressable
          style={[
            styles.sheet,
            {
              backgroundColor: theme.backgroundAlt,
              borderColor: theme.glassBorder,
            },
          ]}
          accessibilityViewIsModal
        >
          <Text
            variant="title"
            style={[styles.heading, { color: theme.textPrimary }]}
            accessibilityRole="header"
          >
            {t('settings.language.title')}
          </Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            {options.map(option => {
              const selected = option.value === preference;
              return (
                <Pressable
                  key={option.value}
                  style={[styles.option, { borderBottomColor: theme.divider }]}
                  onPress={() => onSelect(option.value)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                >
                  <View style={styles.optionText}>
                    <Text
                      variant="body"
                      style={{
                        color: selected ? theme.percent : theme.textPrimary,
                      }}
                    >
                      {option.title}
                    </Text>
                    {option.hint ? (
                      <Text
                        variant="caption"
                        style={{ color: theme.textSecondary }}
                      >
                        {option.hint}
                      </Text>
                    ) : null}
                  </View>
                  {selected ? (
                    <Text style={{ color: theme.percent }}>✓</Text>
                  ) : null}
                </Pressable>
              );
            })}
          </ScrollView>
          <Pressable onPress={onClose} style={styles.done} accessibilityRole="button">
            <Text variant="sectionTitle" style={{ color: theme.percent }}>
              {t('common.done')}
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sheet: {
    maxHeight: '80%',
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    borderWidth: 1,
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[4],
    paddingBottom: Spacing[5],
  },
  heading: {
    marginBottom: Spacing[2],
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  optionText: {
    flex: 1,
  },
  done: {
    alignSelf: 'flex-end',
    paddingTop: Spacing[3],
  },
});
