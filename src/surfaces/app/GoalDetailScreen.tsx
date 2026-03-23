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
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Text, ScreenGradient, Card } from '../../ui';
import { useWidgetSyncActions } from '../../hooks';
import {
  getGoalUseCase,
  updateMonthlyGoalUseCase,
  removeMonthlyGoalUseCase,
  addGoalTaskUseCase,
  updateGoalTaskUseCase,
  removeGoalTaskUseCase,
  addToDailyFromGoalUseCase,
  setRepeatDailyFromGoalUseCase,
  removeRepeatDailyFromGoalUseCase,
  isRepeatDailyUseCase,
} from '../../di';
import { Spacing, Colors, Radius, Typography } from '../../theme';
import type { RootStackParamList } from '../../navigation/RootNavigator';
import type { GoalTask, TaskCategory } from '../../types';

const TASK_CATEGORIES: { value: TaskCategory; label: string }[] = [
  { value: 'health', label: 'Health' },
  { value: 'work', label: 'Work' },
  { value: 'personal_care', label: 'Personal care' },
  { value: 'learning', label: 'Learning' },
  { value: 'other', label: 'Other' },
];

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function categoryLabel(cat: TaskCategory): string {
  return TASK_CATEGORIES.find((c) => c.value === cat)?.label ?? cat;
}

export function GoalDetailScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'GoalDetail'>>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'GoalDetail'>>();
  const { syncDailyTasksWidget } = useWidgetSyncActions();
  const goalId = route.params?.goalId ?? '';
  const [goal, setGoal] = useState(() => getGoalUseCase.execute(goalId));
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [addTitle, setAddTitle] = useState('');
  const [addCategory, setAddCategory] = useState<TaskCategory>('other');
  const [editTask, setEditTask] = useState<GoalTask | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState<TaskCategory>('other');

  const refresh = useCallback(() => {
    setGoal(getGoalUseCase.execute(goalId));
  }, [goalId]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const handleRemoveGoal = () => {
    Alert.alert(
      'Remove goal',
      `Remove "${goal?.title}" and all its tasks?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            removeMonthlyGoalUseCase.execute(goalId);
            navigation.goBack();
          },
        },
      ]
    );
  };

  const handleAddTask = () => {
    const t = addTitle.trim();
    if (!t) return;
    addGoalTaskUseCase.execute(goalId, { title: t, category: addCategory });
    setAddTitle('');
    setAddModalVisible(false);
    refresh();
  };

  const openEditTask = (task: GoalTask) => {
    setEditTask(task);
    setEditTitle(task.title);
    setEditCategory(task.category);
    setEditModalVisible(true);
  };

  const handleSaveEditTask = () => {
    if (!editTask) return;
    const t = editTitle.trim();
    if (!t) return;
    updateGoalTaskUseCase.execute(goalId, editTask.id, { title: t, category: editCategory });
    setEditModalVisible(false);
    setEditTask(null);
    refresh();
  };

  const handleRemoveTask = (task: GoalTask) => {
    Alert.alert(
      'Remove task',
      `Remove "${task.title}" from this goal?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            removeGoalTaskUseCase.execute(goalId, task.id);
            refresh();
          },
        },
      ]
    );
  };

  const handleAddToToday = (task: GoalTask) => {
    addToDailyFromGoalUseCase.execute(goalId, task.id, todayIso());
    syncDailyTasksWidget();
    refresh();
  };

  const handleToggleRepeatDaily = (task: GoalTask) => {
    const isRepeat = isRepeatDailyUseCase.execute(goalId, task.id);
    if (isRepeat) {
      removeRepeatDailyFromGoalUseCase.execute(goalId, task.id);
    } else {
      setRepeatDailyFromGoalUseCase.execute(goalId, task.id, todayIso());
    }
    syncDailyTasksWidget();
    refresh();
  };

  if (!goal) {
    return (
      <View style={styles.container}>
        <ScreenGradient>
          <Text variant="body" color="secondary" style={styles.empty}>Goal not found.</Text>
        </ScreenGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenGradient>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Card style={styles.headerCard}>
            <Text variant="sectionTitle" color="primary" style={styles.goalTitle}>
              {goal.title}
            </Text>
            {goal.targetDescription ? (
              <Text variant="body" color="secondary" style={styles.targetDesc}>
                {goal.targetDescription}
              </Text>
            ) : null}
            <TouchableOpacity onPress={handleRemoveGoal} style={styles.removeGoalBtn}>
              <Text variant="caption" style={styles.removeText}>Remove goal</Text>
            </TouchableOpacity>
          </Card>

          <Text variant="sectionTitle" color="secondary" style={styles.sectionTitle}>
            Tasks for this goal
          </Text>
          <Text variant="caption" color="secondary" style={styles.hint}>
            Add tasks below. Use &quot;Add to today&quot; for a one-off, or &quot;Repeat daily&quot; to add this task to every day automatically.
          </Text>

          {goal.tasks.length === 0 ? (
            <Text variant="body" color="secondary" style={styles.empty}>
              No tasks yet. Add one below.
            </Text>
          ) : (
            goal.tasks.map((task) => {
              const isRepeat = isRepeatDailyUseCase.execute(goalId, task.id);
              return (
                <Card key={task.id} style={styles.taskCard}>
                  <View style={styles.taskRow}>
                    <View style={styles.taskContent}>
                      <Text variant="body" color="primary" style={styles.taskTitle}>
                        {task.title}
                      </Text>
                      <Text variant="caption" color="secondary">
                        {categoryLabel(task.category)}
                        {isRepeat && (
                          <Text variant="caption" style={styles.repeatBadge}> · Repeats daily</Text>
                        )}
                      </Text>
                    </View>
                    <View style={styles.taskActions}>
                      <TouchableOpacity
                        onPress={() => handleAddToToday(task)}
                        style={styles.smallBtn}
                      >
                        <Text variant="caption" style={styles.actionText}>Add to today</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleToggleRepeatDaily(task)}
                        style={[styles.smallBtn, isRepeat && styles.smallBtnActive]}
                      >
                        <Text variant="caption" style={[styles.actionText, isRepeat && styles.actionTextActive]}>
                          {isRepeat ? 'Stop repeat' : 'Repeat daily'}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => openEditTask(task)} style={styles.smallBtn}>
                        <Text variant="caption" style={styles.actionText}>Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleRemoveTask(task)} style={styles.smallBtn}>
                        <Text variant="caption" style={styles.removeText}>Remove</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </Card>
              );
            })
          )}

          <TouchableOpacity style={styles.addButton} onPress={() => setAddModalVisible(true)}>
            <Text variant="caption" style={styles.addButtonText}>Add task to goal</Text>
          </TouchableOpacity>
        </ScrollView>
      </ScreenGradient>

      <Modal visible={addModalVisible} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setAddModalVisible(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <Text variant="sectionTitle" color="primary" style={styles.modalTitle}>
              Add task
            </Text>
            <TextInput
              style={styles.input}
              value={addTitle}
              onChangeText={setAddTitle}
              placeholder="Task title"
              placeholderTextColor={Colors.textSecondary}
              autoCapitalize="sentences"
            />
            <Text variant="caption" color="secondary" style={styles.categoryLabel}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll} contentContainerStyle={styles.chipContainer}>
              {TASK_CATEGORIES.map(({ value, label }) => (
                <TouchableOpacity
                  key={value}
                  style={[styles.chip, addCategory === value && styles.chipSelected]}
                  onPress={() => setAddCategory(value)}
                >
                  <Text variant="caption" color={addCategory === value ? 'primary' : 'secondary'} style={addCategory === value && styles.chipTextSelected}>
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalButton} onPress={() => setAddModalVisible(false)}>
                <Text variant="body" color="secondary">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={handleAddTask}
                disabled={!addTitle.trim()}
              >
                <Text variant="body" style={styles.modalButtonPrimaryText}>Add</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={editModalVisible} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setEditModalVisible(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <Text variant="sectionTitle" color="primary" style={styles.modalTitle}>
              Edit task
            </Text>
            <TextInput
              style={styles.input}
              value={editTitle}
              onChangeText={setEditTitle}
              placeholder="Task title"
              placeholderTextColor={Colors.textSecondary}
              autoCapitalize="sentences"
            />
            <Text variant="caption" color="secondary" style={styles.categoryLabel}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll} contentContainerStyle={styles.chipContainer}>
              {TASK_CATEGORIES.map(({ value, label }) => (
                <TouchableOpacity
                  key={value}
                  style={[styles.chip, editCategory === value && styles.chipSelected]}
                  onPress={() => setEditCategory(value)}
                >
                  <Text variant="caption" color={editCategory === value ? 'primary' : 'secondary'} style={editCategory === value && styles.chipTextSelected}>
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalButton} onPress={() => setEditModalVisible(false)}>
                <Text variant="body" color="secondary">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={handleSaveEditTask}
                disabled={!editTitle.trim()}
              >
                <Text variant="body" style={styles.modalButtonPrimaryText}>Save</Text>
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
  headerCard: { marginBottom: Spacing[4] },
  goalTitle: { marginBottom: Spacing[2] },
  targetDesc: { marginBottom: Spacing[2] },
  removeGoalBtn: { alignSelf: 'flex-start' },
  removeText: { color: Colors.textSecondary, textDecorationLine: 'underline' },
  sectionTitle: { marginBottom: Spacing[1], textTransform: 'uppercase', letterSpacing: 1 },
  hint: { marginBottom: Spacing[3] },
  empty: { marginBottom: Spacing[4], fontStyle: 'italic' },
  taskCard: { marginBottom: Spacing[2] },
  taskRow: { flexDirection: 'row', alignItems: 'flex-start', flexWrap: 'wrap' },
  taskContent: { flex: 1, minWidth: 120 },
  taskTitle: { marginBottom: 2 },
  repeatBadge: { color: Colors.textSecondary },
  taskActions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2], marginTop: Spacing[1] },
  smallBtn: { paddingVertical: Spacing[1], paddingHorizontal: Spacing[2] },
  smallBtnActive: { backgroundColor: Colors.divider, borderRadius: Radius.sm },
  actionText: { color: Colors.textPrimary },
  actionTextActive: {},
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
    fontSize: Typography.label,
    marginBottom: Spacing[2],
  },
  categoryLabel: { marginBottom: Spacing[1] },
  chipScroll: { marginBottom: Spacing[2] },
  chipContainer: { flexDirection: 'row', gap: Spacing[2] },
  chip: {
    paddingVertical: Spacing[1],
    paddingHorizontal: Spacing[2],
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  chipSelected: { backgroundColor: Colors.divider, borderColor: Colors.textSecondary },
  chipTextSelected: {},
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: Spacing[3], marginTop: Spacing[2] },
  modalButton: { paddingVertical: Spacing[2], paddingHorizontal: Spacing[3] },
  modalButtonPrimary: { backgroundColor: Colors.divider, borderRadius: Radius.sm },
  modalButtonPrimaryText: { color: Colors.textPrimary },
});
