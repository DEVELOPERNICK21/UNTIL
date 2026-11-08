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
import { Text, ScreenGradient, Card } from '../../../shared/ui';
import { useGoalDetail } from '../hooks/useGoalDetail';
import {
  useWidgetSyncActions,
} from '../../../shared/platform/useWidgetSyncActions';
import { Spacing, Colors, Radius, Typography } from '../../../shared/theme';
import type { RootStackParamList } from '../../../shared/navigation/types';
import type { GoalTask, TaskCategory } from '../../../shared/types';
import { todayIso } from '../../../shared/time/clock';
import { useTranslation } from '../../../shared/i18n/useTranslation';
import { getTaskCategoryOptions, taskCategoryLabel } from './taskCategories';

export function GoalDetailScreen() {
  const { t } = useTranslation();
  const categoryOptions = getTaskCategoryOptions();
  const route = useRoute<RouteProp<RootStackParamList, 'GoalDetail'>>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'GoalDetail'>>();
  const { syncDailyTasksWidget } = useWidgetSyncActions();
  const goalId = route.params?.goalId ?? '';
  const {
    goal,
    refresh,
    removeGoal,
    addTask,
    updateTask,
    removeTask,
    addTaskToDay,
    isRepeatDaily,
    toggleRepeatDaily,
  } = useGoalDetail(goalId);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [addTitle, setAddTitle] = useState('');
  const [addCategory, setAddCategory] = useState<TaskCategory>('other');
  const [editTask, setEditTask] = useState<GoalTask | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState<TaskCategory>('other');

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const handleRemoveGoal = () => {
    Alert.alert(
      t('tasks.goals.remove'),
      t('tasks.goal.removeBody', { title: goal?.title ?? '' }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.remove'),
          style: 'destructive',
          onPress: () => {
            removeGoal();
            navigation.goBack();
          },
        },
      ]
    );
  };

  const handleAddTask = () => {
    const trimmedTitle = addTitle.trim();
    if (!trimmedTitle) return;
    addTask({ title: trimmedTitle, category: addCategory });
    setAddTitle('');
    setAddModalVisible(false);
  };

  const openEditTask = (task: GoalTask) => {
    setEditTask(task);
    setEditTitle(task.title);
    setEditCategory(task.category);
    setEditModalVisible(true);
  };

  const handleSaveEditTask = () => {
    if (!editTask) return;
    const trimmedTitle = editTitle.trim();
    if (!trimmedTitle) return;
    updateTask(editTask.id, { title: trimmedTitle, category: editCategory });
    setEditModalVisible(false);
    setEditTask(null);
  };

  const handleRemoveTask = (task: GoalTask) => {
    Alert.alert(
      t('tasks.removeTask'),
      t('tasks.goal.removeTaskBody', { title: task.title }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.remove'),
          style: 'destructive',
          onPress: () => {
            removeTask(task.id);
          },
        },
      ]
    );
  };

  const handleAddToToday = (task: GoalTask) => {
    addTaskToDay(task.id, todayIso());
    syncDailyTasksWidget();
  };

  const handleToggleRepeatDaily = (task: GoalTask) => {
    toggleRepeatDaily(task.id, todayIso());
    syncDailyTasksWidget();
  };

  if (!goal) {
    return (
      <View style={styles.container}>
        <ScreenGradient>
          <Text variant="body" color="secondary" style={styles.empty}>{t('tasks.goal.notFound')}</Text>
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
              <Text variant="caption" style={styles.removeText}>{t('tasks.goals.remove')}</Text>
            </TouchableOpacity>
          </Card>

          <Text variant="sectionTitle" color="secondary" style={styles.sectionTitle}>
            {t('tasks.goal.tasksTitle')}
          </Text>
          <Text variant="caption" color="secondary" style={styles.hint}>
            {t('tasks.goal.hint')}
          </Text>

          {goal.tasks.length === 0 ? (
            <Text variant="body" color="secondary" style={styles.empty}>
              {t('tasks.goal.empty')}
            </Text>
          ) : (
            goal.tasks.map((task) => {
              const isRepeat = isRepeatDaily(task.id);
              return (
                <Card key={task.id} style={styles.taskCard}>
                  <View style={styles.taskRow}>
                    <View style={styles.taskContent}>
                      <Text variant="body" color="primary" style={styles.taskTitle}>
                        {task.title}
                      </Text>
                      <Text variant="caption" color="secondary">
                        {taskCategoryLabel(task.category)}
                        {isRepeat && (
                          <Text variant="caption" style={styles.repeatBadge}> · {t('tasks.goal.repeatsDaily')}</Text>
                        )}
                      </Text>
                    </View>
                    <View style={styles.taskActions}>
                      <TouchableOpacity
                        onPress={() => handleAddToToday(task)}
                        style={styles.smallBtn}
                      >
                        <Text variant="caption" style={styles.actionText}>{t('tasks.goal.addToToday')}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleToggleRepeatDaily(task)}
                        style={[styles.smallBtn, isRepeat && styles.smallBtnActive]}
                      >
                        <Text variant="caption" style={[styles.actionText, isRepeat && styles.actionTextActive]}>
                          {isRepeat ? t('tasks.goal.stopRepeat') : t('tasks.goal.repeatDaily')}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => openEditTask(task)} style={styles.smallBtn}>
                        <Text variant="caption" style={styles.actionText}>{t('common.edit')}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleRemoveTask(task)} style={styles.smallBtn}>
                        <Text variant="caption" style={styles.removeText}>{t('common.remove')}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </Card>
              );
            })
          )}

          <TouchableOpacity style={styles.addButton} onPress={() => setAddModalVisible(true)}>
            <Text variant="caption" style={styles.addButtonText}>{t('tasks.goal.addTask')}</Text>
          </TouchableOpacity>
        </ScrollView>
      </ScreenGradient>

      <Modal visible={addModalVisible} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setAddModalVisible(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <Text variant="sectionTitle" color="primary" style={styles.modalTitle}>
              {t('tasks.addTask')}
            </Text>
            <TextInput
              style={styles.input}
              value={addTitle}
              onChangeText={setAddTitle}
              placeholder={t('tasks.taskTitle')}
              placeholderTextColor={Colors.textSecondary}
              autoCapitalize="sentences"
            />
            <Text variant="caption" color="secondary" style={styles.categoryLabel}>{t('tasks.categoryLabel')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll} contentContainerStyle={styles.chipContainer}>
              {categoryOptions.map(({ value, label }) => (
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
                <Text variant="body" color="secondary">{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={handleAddTask}
                disabled={!addTitle.trim()}
              >
                <Text variant="body" style={styles.modalButtonPrimaryText}>{t('common.add')}</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={editModalVisible} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setEditModalVisible(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <Text variant="sectionTitle" color="primary" style={styles.modalTitle}>
              {t('tasks.editTask')}
            </Text>
            <TextInput
              style={styles.input}
              value={editTitle}
              onChangeText={setEditTitle}
              placeholder={t('tasks.taskTitle')}
              placeholderTextColor={Colors.textSecondary}
              autoCapitalize="sentences"
            />
            <Text variant="caption" color="secondary" style={styles.categoryLabel}>{t('tasks.categoryLabel')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll} contentContainerStyle={styles.chipContainer}>
              {categoryOptions.map(({ value, label }) => (
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
                <Text variant="body" color="secondary">{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={handleSaveEditTask}
                disabled={!editTitle.trim()}
              >
                <Text variant="body" style={styles.modalButtonPrimaryText}>{t('common.save')}</Text>
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
  sectionTitle: { marginBottom: Spacing[1], letterSpacing: 0.4 },
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
