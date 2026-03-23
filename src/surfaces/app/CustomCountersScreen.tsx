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
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Text, ScreenGradient, Card } from '../../ui';
import { useWidgetSyncActions } from '../../hooks';
import { getCustomCountersUseCase, addCustomCounterUseCase, removeCustomCounterUseCase } from '../../di';
import { Spacing, Colors, Radius, Typography } from '../../theme';
import type { RootStackParamList } from '../../navigation/RootNavigator';
import type { CustomCounter } from '../../types';

export function CustomCountersScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'CustomCounters'>>();
  const { syncCustomCounters } = useWidgetSyncActions();
  const [counters, setCounters] = useState<CustomCounter[]>(() => getCustomCountersUseCase.execute());
  const [newTitle, setNewTitle] = useState('');
  const hasCounter = counters.length > 0;

  const refresh = useCallback(() => {
    setCounters(getCustomCountersUseCase.execute());
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const handleAdd = () => {
    if (hasCounter) return;
    const title = newTitle.trim();
    if (!title) return;
    addCustomCounterUseCase.execute(title);
    setNewTitle('');
    refresh();
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
            removeCustomCounterUseCase.execute(counter.id);
            refresh();
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
            Set one counter (e.g. Water), then add the Counter widget to your home screen. Tapping the widget opens the app and adds +1.
          </Text>

          <View style={styles.addRow}>
            <TextInput
              style={styles.input}
              value={newTitle}
              onChangeText={setNewTitle}
              placeholder="Counter name (e.g. Water)"
              placeholderTextColor={Colors.textSecondary}
              autoCapitalize="words"
              onSubmitEditing={handleAdd}
              returnKeyType="done"
              editable={!hasCounter}
            />
            <TouchableOpacity
              style={[styles.addButton, (!newTitle.trim() || hasCounter) && styles.addButtonDisabled]}
              onPress={handleAdd}
              disabled={!newTitle.trim() || hasCounter}
            >
              <Text variant="caption" style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
          {hasCounter && (
            <Text variant="caption" color="secondary" style={styles.singleLimitHint}>
              Only one counter is allowed. Remove the current one to create a new counter.
            </Text>
          )}

          {counters.length === 0 ? (
            <Text variant="body" color="secondary" style={styles.empty}>
              No counters yet. Add one above, then add the Counter widget from your home screen and choose this counter.
            </Text>
          ) : (
            counters.map((c) => (
              <Card key={c.id} style={styles.card}>
                <View style={styles.row}>
                  <View style={styles.rowLeft}>
                    <Text variant="title" color="primary" style={styles.counterTitle}>
                      {c.title}
                    </Text>
                    <Text variant="caption" color="secondary">
                      Count: {c.count}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleRemove(c)}
                    style={styles.deleteBtn}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  >
                    <Text variant="caption" style={styles.deleteText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </Card>
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
  card: {
    marginBottom: Spacing[3],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowLeft: {
    flex: 1,
  },
  counterTitle: {
    marginBottom: 2,
  },
  deleteBtn: {
    paddingVertical: Spacing[1],
    paddingHorizontal: Spacing[2],
  },
  deleteText: {
    color: Colors.textSecondary,
    textDecorationLine: 'underline',
  },
  hint: {
    marginTop: Spacing[4],
    fontStyle: 'italic',
  },
});
