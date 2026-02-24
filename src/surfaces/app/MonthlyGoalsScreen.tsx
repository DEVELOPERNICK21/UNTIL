import React, { useCallback, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Pressable,
  Alert,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Text, ScreenGradient, Card } from '../../ui';
import {
  getMonthlyGoalsUseCase,
  addMonthlyGoalUseCase,
  removeMonthlyGoalUseCase,
} from '../../di';
import { Spacing, Colors, Radius } from '../../theme';
import type { RootStackParamList } from '../../navigation/RootNavigator';
import type { MonthlyGoal } from '../../types';

function currentMonthIso(): string {
  return new Date().toISOString().slice(0, 7); // YYYY-MM
}

function monthLabel(month: string): string {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(y, m - 1, 1);
  return d.toLocaleString('default', { month: 'long', year: 'numeric' });
}

export function MonthlyGoalsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'MonthlyGoals'>>();
  const [goals, setGoals] = useState<MonthlyGoal[]>(() =>
    getMonthlyGoalsUseCase.executeForMonth(currentMonthIso())
  );
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [targetDescription, setTargetDescription] = useState('');

  const refresh = useCallback(() => {
    setGoals(getMonthlyGoalsUseCase.executeForMonth(currentMonthIso()));
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const openAdd = () => {
    setTitle('');
    setTargetDescription('');
    setModalVisible(true);
  };

  const handleAdd = () => {
    const t = title.trim();
    if (!t) return;
    addMonthlyGoalUseCase.execute({
      month: currentMonthIso(),
      title: t,
      targetDescription: targetDescription.trim() || undefined,
    });
    setModalVisible(false);
    refresh();
  };

  const handleRemove = (goal: MonthlyGoal) => {
    Alert.alert(
      'Remove goal',
      `Remove "${goal.title}" and its ${goal.tasks.length} task(s)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            removeMonthlyGoalUseCase.execute(goal.id);
            refresh();
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
          <Text variant="body" color="secondary" style={styles.subtitle}>
            Set goals for {monthLabel(currentMonthIso())} and add tasks to each. You can add those tasks to today or repeat them daily.
          </Text>

          {goals.length === 0 ? (
            <Text variant="body" color="secondary" style={styles.empty}>
              No goals this month. Add one below.
            </Text>
          ) : (
            goals.map((goal) => (
              <TouchableOpacity
                key={goal.id}
                activeOpacity={0.85}
                onPress={() => navigation.navigate('GoalDetail', { goalId: goal.id })}
              >
                <Card style={styles.goalCard}>
                  <View style={styles.goalRow}>
                    <View style={styles.goalContent}>
                      <Text variant="sectionTitle" color="primary" style={styles.goalTitle}>
                        {goal.title}
                      </Text>
                      {goal.targetDescription ? (
                        <Text variant="caption" color="secondary">
                          {goal.targetDescription}
                        </Text>
                      ) : null}
                      <Text variant="caption" color="secondary" style={styles.taskCount}>
                        {goal.tasks.length} task{goal.tasks.length !== 1 ? 's' : ''}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={(e) => {
                        e?.stopPropagation?.();
                        handleRemove(goal);
                      }}
                      style={styles.removeBtn}
                      hitSlop={12}
                    >
                      <Text variant="caption" style={styles.removeText}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                </Card>
              </TouchableOpacity>
            ))
          )}

          <TouchableOpacity style={styles.addButton} onPress={openAdd}>
            <Text variant="caption" style={styles.addButtonText}>Add monthly goal</Text>
          </TouchableOpacity>
        </ScrollView>
      </ScreenGradient>

      <Modal visible={modalVisible} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <Text variant="sectionTitle" color="primary" style={styles.modalTitle}>
              New monthly goal
            </Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Goal title (e.g. Gain 5 kg)"
              placeholderTextColor={Colors.textSecondary}
              autoCapitalize="sentences"
            />
            <TextInput
              style={[styles.input, styles.inputArea]}
              value={targetDescription}
              onChangeText={setTargetDescription}
              placeholder="Target (optional, e.g. increase 5 kg this month)"
              placeholderTextColor={Colors.textSecondary}
              multiline
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalButton} onPress={() => setModalVisible(false)}>
                <Text variant="body" color="secondary">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={handleAdd}
                disabled={!title.trim()}
              >
                <Text variant="body" style={styles.modalButtonPrimaryText}>Add</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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
  subtitle: { marginBottom: Spacing[4] },
  empty: { marginBottom: Spacing[4], fontStyle: 'italic' },
  goalCard: { marginBottom: Spacing[2] },
  goalRow: { flexDirection: 'row', alignItems: 'flex-start' },
  goalContent: { flex: 1 },
  goalTitle: { marginBottom: 2 },
  taskCount: { marginTop: 2 },
  removeBtn: { paddingVertical: Spacing[1], paddingHorizontal: Spacing[2] },
  removeText: { color: Colors.textSecondary, textDecorationLine: 'underline' },
  addButton: {
    backgroundColor: Colors.divider,
    paddingVertical: Spacing[2],
    paddingHorizontal: Spacing[4],
    borderRadius: Radius.md,
    alignSelf: 'flex-start',
    marginTop: Spacing[2],
  },
  addButtonText: { color: Colors.textPrimary },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: Spacing[4],
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderRadius: Radius.lg,
    padding: Spacing[4],
  },
  modalTitle: { marginBottom: Spacing[3] },
  input: {
    borderWidth: 1,
    borderColor: Colors.divider,
    borderRadius: Radius.sm,
    paddingVertical: Spacing[2],
    paddingHorizontal: Spacing[3],
    color: Colors.textPrimary,
    fontSize: 16,
    marginBottom: Spacing[2],
  },
  inputArea: { minHeight: 60 },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing[3],
    marginTop: Spacing[2],
  },
  modalButton: { paddingVertical: Spacing[2], paddingHorizontal: Spacing[3] },
  modalButtonPrimary: { backgroundColor: Colors.divider, borderRadius: Radius.sm },
  modalButtonPrimaryText: { color: Colors.textPrimary },
});
