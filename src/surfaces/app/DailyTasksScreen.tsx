import React, { useCallback, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  Animated,
  Easing,
  RefreshControl,
  Pressable,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useDailyTasks } from '../../hooks';
import type { RootStackParamList } from '../../navigation/RootNavigator';
import { Text, ScreenGradient, Card, ProgressLine } from '../../ui';
import {
  addTaskUseCase,
  toggleTaskUseCase,
  updateTaskUseCase,
  removeTaskUseCase,
  getGoalUseCase,
} from '../../di';
import { syncDailyTasksWidget } from '../../infrastructure';
import { Spacing, Colors, Radius } from '../../theme';
import type { DailyTask, TaskCategory } from '../../types';

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

interface TaskRowProps {
  task: DailyTask;
  goalTitle?: string | null;
  onToggle: () => void;
  onEdit: () => void;
  onRemove: () => void;
}

function TaskRow({ task, goalTitle, onToggle, onEdit, onRemove }: TaskRowProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [task.completed, scaleAnim, opacityAnim]);

  const handleToggle = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.92,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 150,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
    onToggle();
  };

  return (
    <Animated.View style={[styles.taskRowWrap, { opacity: opacityAnim }]}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={handleToggle}
        style={styles.tileTapArea}
      >
        <Card style={styles.taskCard}>
          <View style={styles.taskRow}>
            <View
              style={[styles.checkbox, task.completed && styles.checkboxChecked]}
            >
              {task.completed && (
                <Animated.Text style={[styles.checkmark, { transform: [{ scale: scaleAnim }] }]}>
                  ✓
                </Animated.Text>
              )}
            </View>
            <View style={styles.taskContent}>
              <Text
                variant="body"
                color="primary"
                style={[styles.taskTitle, task.completed && styles.taskTitleDone]}
                numberOfLines={2}
              >
                {task.title}
              </Text>
              <Text variant="caption" color="secondary">
                {categoryLabel(task.category)}
                {task.sourceGoalId != null && (
                  <Text variant="caption" color="secondary" style={styles.fromGoal}>
                    {' · '}{goalTitle ?? 'From goal'}
                  </Text>
                )}
              </Text>
            </View>
            <TouchableOpacity
              onPress={(e) => {
                e?.stopPropagation?.();
                onEdit();
              }}
              style={styles.actionBtn}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Text variant="caption" style={styles.actionText}>
                Edit
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={(e) => {
                e?.stopPropagation?.();
                onRemove();
              }}
              style={styles.actionBtn}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Text variant="caption" style={styles.removeText}>
                Remove
              </Text>
            </TouchableOpacity>
          </View>
        </Card>
      </TouchableOpacity>
    </Animated.View>
  );
}

export function DailyTasksScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'DailyTasks'>>();
  const today = todayIso();
  const { tasks, stats, refresh } = useDailyTasks(today);
  const [newTitle, setNewTitle] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState<TaskCategory>('other');
  const [refreshing, setRefreshing] = React.useState(false);
  const [editingTask, setEditingTask] = React.useState<DailyTask | null>(null);
  const [editTitle, setEditTitle] = React.useState('');
  const [editCategory, setEditCategory] = React.useState<TaskCategory>('other');

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    refresh();
    syncDailyTasksWidget();
    setTimeout(() => setRefreshing(false), 100);
  }, [refresh]);

  const handleAdd = useCallback(() => {
    const title = newTitle.trim();
    if (!title) return;
    addTaskUseCase.execute({
      date: today,
      title,
      category: selectedCategory,
    });
    setNewTitle('');
    refresh();
    syncDailyTasksWidget();
  }, [today, newTitle, selectedCategory, refresh]);

  const handleToggle = useCallback(
    (id: string) => {
      toggleTaskUseCase.execute(id);
      refresh();
      syncDailyTasksWidget();
    },
    [refresh]
  );

  const openEdit = useCallback((task: DailyTask) => {
    setEditingTask(task);
    setEditTitle(task.title);
    setEditCategory(task.category);
  }, []);

  const closeEdit = useCallback(() => {
    setEditingTask(null);
  }, []);

  const handleSaveEdit = useCallback(() => {
    if (!editingTask) return;
    const title = editTitle.trim();
    if (!title) return;
    updateTaskUseCase.execute(editingTask.id, { title, category: editCategory });
    refresh();
    syncDailyTasksWidget();
    closeEdit();
  }, [editingTask, editTitle, editCategory, refresh, closeEdit]);

  const handleRemove = useCallback(
    (task: DailyTask) => {
      Alert.alert(
        'Remove task',
        `Remove "${task.title}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: () => {
              removeTaskUseCase.execute(task.id);
              refresh();
              syncDailyTasksWidget();
            },
          },
        ]
      );
    },
    [refresh]
  );

  const progress = stats.total > 0 ? stats.completed / stats.total : 0;

  return (
    <View style={styles.container}>
      <ScreenGradient>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.textSecondary}
            />
          }
        >
          <Text variant="sectionTitle" color="primary" style={styles.title}>
            Today&apos;s tasks
          </Text>
          <Text variant="body" color="secondary" style={styles.subtitle}>
            Add tasks and tick them when done. Use{' '}
            <Text variant="body" color="primary" style={styles.inlineLink} onPress={() => navigation.navigate('MonthlyGoals')}>
              monthly goals
            </Text>
            {' '}to add tasks that repeat daily. Your progress appears on the home screen and in the Daily tasks widget.
          </Text>

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => navigation.navigate('TaskReport')}
          >
            <Card style={styles.reportCard}>
              <Text variant="sectionTitle" color="secondary" style={styles.blockTitle}>
                Report
              </Text>
              <View style={styles.reportRow}>
                <Text variant="body" color="primary">
                  {stats.completed} completed · {stats.pending} pending
                </Text>
              </View>
              {stats.total > 0 && (
                <ProgressLine
                  progress={progress}
                  fillColor={progress === 1 ? '#34C759' : '#E9A23A'}
                  style={styles.progress}
                />
              )}
              <Text variant="caption" color="secondary" style={styles.reportLink}>
                View daily, weekly & monthly report →
              </Text>
            </Card>
          </TouchableOpacity>

          <View style={styles.addSection}>
            <TextInput
              style={styles.input}
              value={newTitle}
              onChangeText={setNewTitle}
              placeholder="Task title"
              placeholderTextColor={Colors.textSecondary}
              autoCapitalize="sentences"
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.chipScroll}
              contentContainerStyle={styles.chipContainer}
            >
              {TASK_CATEGORIES.map(({ value, label }) => (
                <TouchableOpacity
                  key={value}
                  style={[
                    styles.chip,
                    selectedCategory === value && styles.chipSelected,
                  ]}
                  onPress={() => setSelectedCategory(value)}
                >
                  <Text
                    variant="caption"
                    color={selectedCategory === value ? 'primary' : 'secondary'}
                    style={selectedCategory === value && styles.chipTextSelected}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={[styles.addButton, !newTitle.trim() && styles.addButtonDisabled]}
              onPress={handleAdd}
              disabled={!newTitle.trim()}
            >
              <Text variant="caption" style={styles.addButtonText}>
                Add task
              </Text>
            </TouchableOpacity>
          </View>

          {tasks.length === 0 ? (
            <Text variant="body" color="secondary" style={styles.empty}>
              No tasks for today. Add one above.
            </Text>
          ) : (
            tasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                goalTitle={task.sourceGoalId ? getGoalUseCase.execute(task.sourceGoalId)?.title ?? null : undefined}
                onToggle={() => handleToggle(task.id)}
                onEdit={() => openEdit(task)}
                onRemove={() => handleRemove(task)}
              />
            ))
          )}

          <Modal
            visible={editingTask != null}
            transparent
            animationType="fade"
            onRequestClose={closeEdit}
          >
            <Pressable style={styles.modalOverlay} onPress={closeEdit}>
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
                <Text variant="caption" color="secondary" style={styles.categoryLabel}>
                  Category
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.chipScroll}
                  contentContainerStyle={styles.chipContainer}
                >
                  {TASK_CATEGORIES.map(({ value, label }) => (
                    <TouchableOpacity
                      key={value}
                      style={[
                        styles.chip,
                        editCategory === value && styles.chipSelected,
                      ]}
                      onPress={() => setEditCategory(value)}
                    >
                      <Text
                        variant="caption"
                        color={editCategory === value ? 'primary' : 'secondary'}
                        style={editCategory === value && styles.chipTextSelected}
                      >
                        {label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <View style={styles.modalActions}>
                  <TouchableOpacity style={styles.modalButton} onPress={closeEdit}>
                    <Text variant="body" color="secondary">Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonPrimary]}
                    onPress={handleSaveEdit}
                    disabled={!editTitle.trim()}
                  >
                    <Text variant="body" style={styles.modalButtonPrimaryText}>Save</Text>
                  </TouchableOpacity>
                </View>
              </Pressable>
            </Pressable>
          </Modal>

          {stats.total > 0 && stats.completed === stats.total && (
            <Text variant="caption" color="secondary" style={styles.celebration}>
              All done for today.
            </Text>
          )}
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
  inlineLink: { textDecorationLine: 'underline' },
  reportCard: { marginBottom: Spacing[4] },
  blockTitle: {
    marginBottom: Spacing[2],
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  reportRow: { marginBottom: Spacing[2] },
  progress: { marginTop: Spacing[1] },
  reportLink: { marginTop: Spacing[2], textDecorationLine: 'underline' },
  addSection: { marginBottom: Spacing[4] },
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
  chipScroll: { marginBottom: Spacing[2] },
  chipContainer: { flexDirection: 'row', gap: Spacing[2] },
  chip: {
    paddingVertical: Spacing[1],
    paddingHorizontal: Spacing[2],
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  chipSelected: {
    backgroundColor: Colors.divider,
    borderColor: Colors.textSecondary,
  },
  chipTextSelected: {},
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
  taskRowWrap: { marginBottom: Spacing[2] },
  tileTapArea: { marginBottom: 0 },
  taskCard: {},
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.divider,
    marginRight: Spacing[2],
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    borderColor: '#34C759',
    backgroundColor: '#34C759',
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  taskContent: { flex: 1 },
  taskTitle: { marginBottom: 2 },
  taskTitleDone: {
    textDecorationLine: 'line-through',
    opacity: 0.7,
  },
  fromGoal: { fontStyle: 'italic' },
  actionBtn: { paddingVertical: Spacing[1], paddingHorizontal: Spacing[2] },
  actionText: { color: Colors.textSecondary, textDecorationLine: 'underline' },
  removeText: { color: Colors.textSecondary, textDecorationLine: 'underline' },
  celebration: { marginTop: Spacing[2], fontStyle: 'italic', textAlign: 'center' },
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
  categoryLabel: { marginBottom: Spacing[1] },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing[3],
    marginTop: Spacing[4],
  },
  modalButton: { paddingVertical: Spacing[2], paddingHorizontal: Spacing[3] },
  modalButtonPrimary: { backgroundColor: Colors.divider, borderRadius: Radius.sm },
  modalButtonPrimaryText: { color: Colors.textPrimary },
});
