import React, { useState, useCallback, useEffect } from 'react';
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
import { Text, ScreenGradient, Card } from '../../../shared/ui';
import { useHourCalculationWidget } from '../hooks/useHourCalculationWidget';
import { Spacing, Colors, Radius, Typography } from '../../../shared/theme';
import { MAX_TITLE_LENGTH } from '../../../config/inputLimits';
import { useTranslation } from '../../../shared/i18n/useTranslation';

export function HourCalculationScreen() {
  const { t } = useTranslation();
  const { getHourCalculationState, syncHourCalculationWidget, elapsedLabel, hasTime } =
    useHourCalculationWidget();
  const [state, setState] = useState(() => getHourCalculationState());
  const [titleInput, setTitleInput] = useState(state.title);

  const refresh = useCallback(() => {
    const next = getHourCalculationState();
    setState(next);
    setTitleInput(next.title);
  }, [getHourCalculationState]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  // Update displayed elapsed time every second when running
  useEffect(() => {
    if (!state.isRunning) return;
    const interval = setInterval(() => setState(getHourCalculationState()), 1000);
    return () => clearInterval(interval);
  }, [state.isRunning, getHourCalculationState]);

  const handleSaveTitle = () => {
    const title = titleInput.trim() || t('widgets.hour.defaultTitle');
    syncHourCalculationWidget({ title });
    refresh();
  };

  const handleToggle = () => {
    syncHourCalculationWidget({ toggle: true });
    refresh();
  };

  const handleReset = () => {
    if (!hasTime(state)) return;
    const reset = () => {
      syncHourCalculationWidget({ reset: true });
      refresh();
    };
    // Nothing banked and not running: there is nothing to lose, so no question.
    Alert.alert(
      t('widgets.hour.reset.title'),
      state.isRunning
        ? t('widgets.hour.reset.messageRunning')
        : t('widgets.hour.reset.messageIdle'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('widgets.hour.reset.confirm'),
          style: 'destructive',
          onPress: reset,
        },
      ],
    );
  };

  const elapsedDisplay = elapsedLabel(state);

  return (
    <View style={styles.container}>
      <ScreenGradient>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text variant="sectionTitle" color="primary" style={styles.title}>
            {t('nav.hourCalculation')}
          </Text>
          <Text variant="body" color="secondary" style={styles.subtitle}>
            {t('widgets.hour.subtitle')}
          </Text>

          <Card style={styles.card}>
            <Text variant="caption" color="secondary" style={styles.label}>
              {t('widgets.hour.titleLabel')}
            </Text>
            <View style={styles.row}>
              <TextInput
                style={styles.input}
                value={titleInput}
                onChangeText={setTitleInput}
                placeholder={t('widgets.hour.placeholder')}
                placeholderTextColor={Colors.textSecondary}
                autoCapitalize="words"
                maxLength={MAX_TITLE_LENGTH}
                onSubmitEditing={handleSaveTitle}
                returnKeyType="done"
              />
              <TouchableOpacity style={styles.primaryButton} onPress={handleSaveTitle}>
                <Text variant="caption" style={styles.primaryButtonText}>{t('common.save')}</Text>
              </TouchableOpacity>
            </View>
          </Card>

          <Card style={styles.card}>
            <Text variant="caption" color="secondary" style={styles.label}>
              {t('widgets.hour.currentTime')}
            </Text>
            <Text variant="title" color="primary" style={styles.elapsed}>
              {elapsedDisplay}
            </Text>
            {state.isRunning && (
              <Text variant="caption" color="secondary" style={styles.runningHint}>
                {t('widgets.hour.running')}
              </Text>
            )}
            <View style={styles.timerActions}>
              <TouchableOpacity
                style={[styles.timerButton, styles.timerPrimary]}
                onPress={handleToggle}
                accessibilityRole="button"
                accessibilityLabel={
                  state.isRunning
                    ? t('widgets.hour.a11y.stop')
                    : t('widgets.hour.a11y.start')
                }
              >
                <Text variant="sectionTitle" style={styles.timerPrimaryText}>
                  {state.isRunning
                    ? t('widgets.hour.stop')
                    : state.totalElapsedMs > 0
                      ? t('widgets.hour.resume')
                      : t('widgets.hour.start')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.timerButton, !hasTime(state) && styles.timerButtonDisabled]}
                onPress={handleReset}
                disabled={!hasTime(state)}
                accessibilityRole="button"
                accessibilityLabel={t('widgets.hour.a11y.reset')}
              >
                <Text variant="sectionTitle" style={styles.timerSecondaryText}>
                  {t('widgets.hour.reset.confirm')}
                </Text>
              </TouchableOpacity>
            </View>
          </Card>

          <Text variant="caption" color="secondary" style={styles.hint}>
            {Platform.OS === 'ios' ? t('widgets.hour.hint.ios') : t('widgets.hour.hint.android')}
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
  card: { marginBottom: Spacing[4] },
  label: { marginBottom: Spacing[2] },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.divider,
    borderRadius: Radius.sm,
    paddingVertical: Spacing[2],
    paddingHorizontal: Spacing[3],
    color: Colors.textPrimary,
    fontSize: Typography.label,
  },
  primaryButton: {
    backgroundColor: Colors.divider,
    paddingVertical: Spacing[2],
    paddingHorizontal: Spacing[4],
    borderRadius: Radius.md,
  },
  primaryButtonText: { color: Colors.textPrimary },
  elapsed: {
    fontSize: Typography.large,
    marginVertical: Spacing[2],
  },
  runningHint: { marginBottom: Spacing[2] },
  timerActions: {
    flexDirection: 'row',
    gap: Spacing[2],
    marginTop: Spacing[2],
  },
  timerButton: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: Colors.divider,
    paddingVertical: Spacing[3],
    borderRadius: Radius.md,
  },
  timerPrimary: { backgroundColor: Colors.percent },
  timerButtonDisabled: { opacity: 0.4 },
  timerPrimaryText: { color: '#FFFFFF' },
  timerSecondaryText: { color: Colors.textPrimary },
  hint: { marginTop: Spacing[2], fontStyle: 'italic' },
});
