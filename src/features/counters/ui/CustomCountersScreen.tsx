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
import { Text, ScreenGradient } from '../../../shared/ui';
import { useCustomCounters } from '../hooks/useCustomCounters';
import { useLimitUpgradePrompt } from '../../premium';
import { CounterCard } from './CounterCard';
import { useTranslation } from '../../../shared/i18n/useTranslation';
import { useWidgetSyncActions } from '../../../shared/platform/useWidgetSyncActions';
import { Spacing, Colors, Radius, Typography } from '../../../shared/theme';
import { MAX_TITLE_LENGTH } from '../../../config/inputLimits';
import { PREMIUM_ITEM_LIMIT } from '../../../config/featureLimits';
import type { CustomCounter } from '../../../shared/types';

export function CustomCountersScreen() {
  const { t, formatNumber } = useTranslation();
  const { syncCustomCounters } = useWidgetSyncActions();
  const {
    counters,
    atLimit,
    limit,
    hasPremium,
    refresh,
    addCounter,
    removeCounter,
    incrementCounter,
    decrementCounter,
    resetCounter,
    showOnWidget,
  } = useCustomCounters();
  const promptUpgrade = useLimitUpgradePrompt('counters');
  const [newTitle, setNewTitle] = useState('');

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const handleAdd = () => {
    const title = newTitle.trim();
    if (!title) return;
    // Free plan, second counter: explain Premium. What was typed stays, so nothing is lost.
    if (atLimit && !hasPremium) return promptUpgrade();
    if (!addCounter(title)) return;
    setNewTitle('');
    syncCustomCounters();
  };

  const handleStep = (counter: CustomCounter, step: 1 | -1) => {
    (step === 1 ? incrementCounter : decrementCounter)(counter.id);
    syncCustomCounters();
  };

  const handleReset = (counter: CustomCounter) => {
    if (counter.count === 0) return;
    Alert.alert(
      t('counters.reset.title'),
      t('counters.reset.message', {
        title: counter.title,
        value: formatNumber(counter.count),
      }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('counters.reset.confirm'),
          style: 'destructive',
          onPress: () => {
            resetCounter(counter.id);
            syncCustomCounters();
          },
        },
      ],
    );
  };

  const handleShowOnWidget = (counter: CustomCounter) => {
    showOnWidget(counter.id);
    syncCustomCounters();
  };

  const handleRemove = (counter: CustomCounter) => {
    Alert.alert(
      t('counters.remove.title'),
      t('counters.remove.message', {
        title: counter.title,
        value: formatNumber(counter.count),
      }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.remove'),
          style: 'destructive',
          onPress: () => {
            removeCounter(counter.id);
            syncCustomCounters();
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
            {t('nav.customCounters')}
          </Text>
          <Text variant="body" color="secondary" style={styles.subtitle}>
            {t('counters.subtitle')}
          </Text>

          <View style={styles.addRow}>
            <TextInput
              style={styles.input}
              value={newTitle}
              onChangeText={setNewTitle}
              placeholder={t('counters.namePlaceholder')}
              placeholderTextColor={Colors.textSecondary}
              autoCapitalize="words"
              maxLength={MAX_TITLE_LENGTH}
              onSubmitEditing={handleAdd}
              returnKeyType="done"
            />
            <TouchableOpacity
              style={[
                styles.addButton,
                (!newTitle.trim() || (atLimit && hasPremium)) &&
                  styles.addButtonDisabled,
              ]}
              onPress={handleAdd}
              disabled={!newTitle.trim() || (atLimit && hasPremium)}
            >
              <Text variant="caption" style={styles.addButtonText}>
                {atLimit && !hasPremium
                  ? t('counters.addWithPremium')
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
                ? t('counters.limit.reached', { limit })
                : t('counters.limit.free', { max: PREMIUM_ITEM_LIMIT })}
            </Text>
          )}

          {counters.length === 0 ? (
            <Text variant="body" color="secondary" style={styles.empty}>
              {t('counters.empty')}
            </Text>
          ) : (
            counters.map((c, index) => (
              <CounterCard
                key={c.id}
                counter={c}
                onWidget={index === 0}
                many={counters.length > 1}
                onStep={handleStep}
                onReset={handleReset}
                onRemove={handleRemove}
                onShowOnWidget={handleShowOnWidget}
              />
            ))
          )}

          <Text variant="caption" color="secondary" style={styles.hint}>
            {Platform.OS === 'ios'
              ? t('counters.hint.ios')
              : t('counters.hint.android')}
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
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    marginBottom: Spacing[4],
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
  addButton: {
    backgroundColor: Colors.divider,
    paddingVertical: Spacing[2],
    paddingHorizontal: Spacing[4],
    borderRadius: Radius.md,
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  addButtonText: {
    color: Colors.textPrimary,
  },
  singleLimitHint: {
    marginBottom: Spacing[3],
  },
  empty: {
    marginBottom: Spacing[4],
    fontStyle: 'italic',
  },
  hint: {
    marginTop: Spacing[4],
    fontStyle: 'italic',
  },
});
