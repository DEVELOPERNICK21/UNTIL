import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Text, ScreenGradient, Card } from '../../../shared/ui';
import { useCountdowns } from '../hooks/useCountdowns';
import { useLimitUpgradePrompt } from '../../premium';
import { useTranslation } from '../../../shared/i18n/useTranslation';
import { useWidgetSyncActions } from '../../../shared/platform/useWidgetSyncActions';
import { Spacing, Colors, Radius, Typography } from '../../../shared/theme';
import { MAX_TITLE_LENGTH } from '../../../config/inputLimits';
import { PREMIUM_ITEM_LIMIT } from '../../../config/featureLimits';
import type { Countdown } from '../../../shared/types';

function toDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const DATE_FORMAT: Intl.DateTimeFormatOptions = {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
};

export function CountdownsScreen() {
  const { t, language, formatDate } = useTranslation();
  const { syncCountdowns } = useWidgetSyncActions();
  const { countdowns, atLimit, limit, hasPremium, refresh, addCountdown, removeCountdown } =
    useCountdowns();
  const promptUpgrade = useLimitUpgradePrompt('deadlines');
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d;
  });
  const [showPicker, setShowPicker] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const handleAdd = () => {
    // Free plan, second deadline: explain Premium. What was typed stays, so nothing is lost.
    if (atLimit && !hasPremium) return promptUpgrade();
    const title = newTitle.trim() || t('countdowns.defaultTitle');
    const dateStr = toDateString(newDate);
    if (!addCountdown(title, dateStr)) return;
    setNewTitle('');
    setNewDate(() => {
      const d = new Date();
      d.setDate(d.getDate() + 7);
      return d;
    });
    syncCountdowns();
  };

  const handleRemove = (item: Countdown) => {
    Alert.alert(
      t('countdowns.remove.title'),
      t('countdowns.remove.message', { title: item.title }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.remove'),
          style: 'destructive',
          onPress: () => {
            removeCountdown(item.id);
            syncCountdowns();
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <ScreenGradient>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text variant="sectionTitle" color="primary" style={styles.title}>
            {t('nav.deadlines')}
          </Text>
          <Text variant="body" color="secondary" style={styles.subtitle}>
            {t('countdowns.subtitle')}
          </Text>

          <View style={styles.addSection}>
            <TextInput
              style={styles.input}
              value={newTitle}
              onChangeText={setNewTitle}
              placeholder={t('countdowns.titlePlaceholder')}
              placeholderTextColor={Colors.textSecondary}
              autoCapitalize="words"
              maxLength={MAX_TITLE_LENGTH}
            />
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowPicker(true)}
            >
              <Text variant="body" color="primary">
                {formatDate(newDate, DATE_FORMAT)}
              </Text>
            </TouchableOpacity>
            {showPicker && (
              <DateTimePicker
                value={newDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                locale={language}
                minimumDate={new Date()}
                onChange={(_, d) => {
                  if (Platform.OS === 'android') setShowPicker(false);
                  if (d) setNewDate(d);
                }}
              />
            )}
            {Platform.OS === 'ios' && showPicker && (
              <TouchableOpacity
                style={styles.pickerDone}
                onPress={() => setShowPicker(false)}
              >
                <Text variant="caption" color="primary">
                  {t('common.done')}
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[
                styles.addButton,
                (!newTitle.trim() || (atLimit && hasPremium)) && styles.addButtonDisabled,
              ]}
              onPress={handleAdd}
              disabled={!newTitle.trim() || (atLimit && hasPremium)}
            >
              <Text variant="caption" style={styles.addButtonText}>
                {atLimit && !hasPremium
                  ? t('countdowns.addWithPremium')
                  : t('common.add')}
              </Text>
            </TouchableOpacity>
          </View>
          {atLimit && (
            <Text
              variant="caption"
              color="secondary"
              style={styles.singleLimitHint}
            >
              {hasPremium
                ? t('countdowns.limit.reached', { limit })
                : t('countdowns.limit.free', { max: PREMIUM_ITEM_LIMIT })}
            </Text>
          )}

          {countdowns.length === 0 ? (
            <Text variant="body" color="secondary" style={styles.empty}>
              {t('countdowns.empty')}
            </Text>
          ) : (
            countdowns.map((item, index) => (
              <Card key={item.id} style={styles.card}>
                <View style={styles.row}>
                  <View style={styles.rowLeft}>
                    <Text
                      variant="title"
                      color="primary"
                      style={styles.itemTitle}
                    >
                      {item.title}
                    </Text>
                    <Text variant="caption" color="secondary">
                      {formatDate(item.localDate, DATE_FORMAT)} ·{' '}
                      {item.daysLabel}
                    </Text>
                    {index === 0 && countdowns.length > 1 && (
                      <Text
                        variant="caption"
                        color="secondary"
                        style={styles.overdue}
                      >
                        {t('countdowns.onWidget')}
                      </Text>
                    )}
                    {item.daysUntil < 0 && (
                      <Text
                        variant="caption"
                        color="secondary"
                        style={styles.overdue}
                      >
                        {t('countdowns.passed')}
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity
                    onPress={() => handleRemove(item)}
                    style={styles.deleteBtn}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  >
                    <Text variant="caption" style={styles.deleteText}>
                      {t('common.remove')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </Card>
            ))
          )}

          <Text variant="caption" color="secondary" style={styles.hint}>
            {t('countdowns.widgetHint')}
          </Text>
        </ScrollView>
      </ScreenGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[3],
    paddingBottom: Spacing[5],
  },
  title: { marginBottom: Spacing[2] },
  subtitle: { marginBottom: Spacing[4] },
  addSection: { marginBottom: Spacing[4] },
  input: {
    borderWidth: 1,
    borderColor: Colors.divider,
    borderRadius: Radius.sm,
    paddingVertical: Spacing[2],
    paddingHorizontal: Spacing[3],
    color: Colors.textPrimary,
    fontSize: Typography.label,
    marginBottom: Spacing[2],
  },
  dateButton: {
    borderWidth: 1,
    borderColor: Colors.divider,
    borderRadius: Radius.sm,
    paddingVertical: Spacing[2],
    paddingHorizontal: Spacing[3],
    marginBottom: Spacing[2],
  },
  pickerDone: {
    alignSelf: 'flex-end',
    paddingVertical: Spacing[1],
    marginBottom: Spacing[2],
  },
  addButton: {
    backgroundColor: Colors.divider,
    paddingVertical: Spacing[2],
    paddingHorizontal: Spacing[4],
    borderRadius: Radius.md,
    alignSelf: 'flex-start',
  },
  addButtonDisabled: { opacity: 0.5 },
  addButtonText: { color: Colors.textPrimary },
  singleLimitHint: { marginBottom: Spacing[3] },
  empty: { marginBottom: Spacing[4], fontStyle: 'italic' },
  card: { marginBottom: Spacing[3] },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowLeft: { flex: 1 },
  overdue: {
    marginTop: Spacing[1],
    fontStyle: 'italic',
  },
  itemTitle: { marginBottom: 2 },
  deleteBtn: { paddingVertical: Spacing[1], paddingHorizontal: Spacing[2] },
  deleteText: { color: Colors.textSecondary, textDecorationLine: 'underline' },
  hint: { marginTop: Spacing[4], fontStyle: 'italic' },
});
