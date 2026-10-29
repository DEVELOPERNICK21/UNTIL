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
import {
  useWidgetSyncActions,
} from '../../../shared/platform/useWidgetSyncActions';
import { Spacing, Colors, Radius, Typography } from '../../../shared/theme';
import { MAX_TITLE_LENGTH } from '../../../config/inputLimits';
import { PREMIUM_ITEM_LIMIT } from '../../../config/featureLimits';
import type { CustomCounter } from '../../../shared/types';

export function CustomCountersScreen() {
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
    }, [refresh])
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
      'Reset counter',
      `Set "${counter.title}" back to 0? It is at ${counter.count}.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            resetCounter(counter.id);
            syncCustomCounters();
          },
        },
      ]
    );
  };

  const handleShowOnWidget = (counter: CustomCounter) => {
    showOnWidget(counter.id);
    syncCustomCounters();
  };

  const handleRemove = (counter: CustomCounter) => {
    Alert.alert(
      'Remove counter',
      `Remove "${counter.title}"? The count (${counter.count}) will be lost.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            removeCounter(counter.id);
            syncCustomCounters();
          },
        },
      ]
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
            Custom counters
          </Text>
          <Text variant="body" color="secondary" style={styles.subtitle}>
            Add what you want to count (e.g. Water), then add the Counter widget to your home screen. The widget counts one of them: tap it to add +1. Use −1 here if you tapped by mistake, or reset it to start again.
          </Text>

          <View style={styles.addRow}>
            <TextInput
              style={styles.input}
              value={newTitle}
              onChangeText={setNewTitle}
              placeholder="Counter name (e.g. Water)"
              placeholderTextColor={Colors.textSecondary}
              autoCapitalize="words"
              maxLength={MAX_TITLE_LENGTH}
              onSubmitEditing={handleAdd}
              returnKeyType="done"
            />
            <TouchableOpacity
              style={[
                styles.addButton,
                (!newTitle.trim() || (atLimit && hasPremium)) && styles.addButtonDisabled,
              ]}
              onPress={handleAdd}
              disabled={!newTitle.trim() || (atLimit && hasPremium)}
            >
              <Text variant="caption" style={styles.addButtonText}>
                {atLimit && !hasPremium ? 'Add with Premium' : 'Add'}
              </Text>
            </TouchableOpacity>
          </View>
          {atLimit && (
            <Text variant="caption" color="secondary" style={styles.singleLimitHint}>
              {hasPremium
                ? `That is the most one list holds (${limit}). Remove one to add another.`
                : `The free plan keeps one counter. Premium holds up to ${PREMIUM_ITEM_LIMIT}.`}
            </Text>
          )}

          {counters.length === 0 ? (
            <Text variant="body" color="secondary" style={styles.empty}>
              No counters yet. Add one above, then add the Counter widget from your home screen and choose this counter.
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
              ? 'Long-press home screen → + → search Until → add "Counter" widget.'
              : 'Long-press home screen → Widgets → Until → Counter.'}
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
