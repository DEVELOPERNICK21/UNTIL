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
import { Text, ScreenGradient, Card } from '../../ui';
import {
  getCountdownsUseCase,
  addCountdownUseCase,
  removeCountdownUseCase,
} from '../../di';
import { syncCountdowns } from '../../infrastructure';
import { getDaysLeft, formatDaysLeft } from '../../core/countdown/daysLeft';
import { Spacing, Colors, Radius, Typography } from '../../theme';
import type { RootStackParamList } from '../../navigation/RootNavigator';
import type { Countdown } from '../../types';

function toDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function CountdownsScreen() {
  const [countdowns, setCountdowns] = useState<Countdown[]>(() =>
    getCountdownsUseCase.execute(),
  );
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d;
  });
  const [showPicker, setShowPicker] = useState(false);

  const refresh = useCallback(() => {
    setCountdowns(getCountdownsUseCase.execute());
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const handleAdd = () => {
    const title = newTitle.trim() || 'Deadline';
    const dateStr = toDateString(newDate);
    addCountdownUseCase.execute(title, dateStr);
    setNewTitle('');
    setNewDate(() => {
      const d = new Date();
      d.setDate(d.getDate() + 7);
      return d;
    });
    refresh();
    syncCountdowns();
  };

  const handleRemove = (item: Countdown) => {
    Alert.alert('Remove countdown', `Remove "${item.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          removeCountdownUseCase.execute(item.id);
          refresh();
          syncCountdowns();
        },
      },
    ]);
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
            Deadlines
          </Text>
          <Text variant="body" color="secondary" style={styles.subtitle}>
            Add a deadline (e.g. Project, Interview) and date. The widget shows
            how many days are left.
          </Text>

          <View style={styles.addSection}>
            <TextInput
              style={styles.input}
              value={newTitle}
              onChangeText={setNewTitle}
              placeholder="Title (e.g. Project, Interview)"
              placeholderTextColor={Colors.textSecondary}
              autoCapitalize="words"
            />
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowPicker(true)}
            >
              <Text variant="body" color="primary">
                {toDateString(newDate)}
              </Text>
            </TouchableOpacity>
            {showPicker && (
              <DateTimePicker
                value={newDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
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
                  Done
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[
                styles.addButton,
                !newTitle.trim() && styles.addButtonDisabled,
              ]}
              onPress={handleAdd}
              disabled={!newTitle.trim()}
            >
              <Text variant="caption" style={styles.addButtonText}>
                Add
              </Text>
            </TouchableOpacity>
          </View>

          {countdowns.length === 0 ? (
            <Text variant="body" color="secondary" style={styles.empty}>
              No deadlines yet. Add one above, then add the Deadline widget to
              your home screen.
            </Text>
          ) : (
            countdowns.map(item => {
              const days = getDaysLeft(item.date);
              return (
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
                        {item.date} · {formatDaysLeft(days)}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleRemove(item)}
                      style={styles.deleteBtn}
                      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    >
                      <Text variant="caption" style={styles.deleteText}>
                        Remove
                      </Text>
                    </TouchableOpacity>
                  </View>
                </Card>
              );
            })
          )}

          <Text variant="caption" color="secondary" style={styles.hint}>
            Add the Deadline widget from your home screen. It shows the first
            deadline (e.g. 7 days left).
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
  empty: { marginBottom: Spacing[4], fontStyle: 'italic' },
  card: { marginBottom: Spacing[3] },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowLeft: { flex: 1 },
  itemTitle: { marginBottom: 2 },
  deleteBtn: { paddingVertical: Spacing[1], paddingHorizontal: Spacing[2] },
  deleteText: { color: Colors.textSecondary, textDecorationLine: 'underline' },
  hint: { marginTop: Spacing[4], fontStyle: 'italic' },
});
