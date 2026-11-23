/**
 * The birth-date field on the identity step.
 *
 * iPhone: the day, month and year wheels are always on screen, so choosing a date is one flow
 * (year, then month, then day) with no tap to open and nothing that closes behind you. The old field
 * closed the picker on the first change, so picking a year hid the wheels and the month needed another
 * tap. The big date above the wheels follows them live.
 *
 * Android: one tap opens the system dialog, which has all three parts in it and closes once, when the
 * person confirms or cancels.
 */

import React, { useState } from 'react';
import { Platform, StyleSheet, TouchableOpacity, Vibration, View } from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import Svg, { Path, Rect } from 'react-native-svg';
import { Text } from '../../../shared/ui';
import { useTheme, Spacing, Radius } from '../../../shared/theme';
import { useTranslation } from '../../../shared/i18n/useTranslation';

/** Nobody alive is older than this; stops the wheels offering absurd years. */
const OLDEST_BIRTH = new Date(1900, 0, 1);

interface Props {
  value: Date;
  onChange: (next: Date) => void;
}

function CalendarMark({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" accessibilityElementsHidden>
      <Rect x={3} y={5} width={18} height={16} rx={2} stroke={color} strokeWidth={1.6} fill="none" />
      <Path d="M8 3v4M16 3v4M3 10h18" stroke={color} strokeWidth={1.6} />
    </Svg>
  );
}

export function BirthDatePicker({ value, onChange }: Props) {
  const theme = useTheme();
  const { t, formatDate, language } = useTranslation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const isIos = Platform.OS === 'ios';
  const shown = formatDate(value, { day: 'numeric', month: 'long', year: 'numeric' });

  const handleChange = (event: DateTimePickerEvent, picked?: Date) => {
    if (!isIos) setDialogOpen(false);
    if (event.type === 'dismissed' || !picked) return;
    if (!isIos) Vibration.vibrate(10);
    onChange(picked);
  };

  const pill = (
    <View
      style={[
        styles.pill,
        { borderColor: theme.divider, backgroundColor: theme.cardLighter },
      ]}
    >
      <Text variant="title" style={[styles.pillValue, { color: theme.textPrimary }]}>
        {shown}
      </Text>
      {isIos ? null : <CalendarMark color={theme.textSecondary} />}
    </View>
  );

  if (isIos) {
    return (
      <View style={styles.block}>
        <View accessibilityRole="header" accessibilityLabel={`${t('account.identity.birthDate')}: ${shown}`}>
          {pill}
        </View>
        <View style={[styles.wheels, { backgroundColor: theme.cardLighter, borderColor: theme.divider }]}>
          <DateTimePicker
            value={value}
            mode="date"
            display="spinner"
            maximumDate={new Date()}
            minimumDate={OLDEST_BIRTH}
            locale={language}
            themeVariant={theme.statusBarStyle === 'dark-content' ? 'light' : 'dark'}
            textColor={theme.textPrimary}
            onChange={handleChange}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.block}>
      <TouchableOpacity
        onPress={() => setDialogOpen(true)}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={t('account.identity.birthDateA11y', { date: shown })}
      >
        {pill}
      </TouchableOpacity>
      {dialogOpen ? (
        <DateTimePicker
          value={value}
          mode="date"
          display="spinner"
          maximumDate={new Date()}
          minimumDate={OLDEST_BIRTH}
          onChange={handleChange}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  block: { gap: Spacing.md },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    minHeight: 72,
  },
  pillValue: { flex: 1 },
  wheels: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
});
