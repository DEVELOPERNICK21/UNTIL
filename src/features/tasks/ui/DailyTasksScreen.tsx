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
  Platform,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useDailyTasks } from '../hooks/useDailyTasks';
import { useTaskCarryoverPrompt } from '../hooks/useTaskCarryoverPrompt';
import { useTodayIso } from '../../../shared/hooks/useTodayIso';
import {
  useWidgetSyncActions,
} from '../../../shared/platform/useWidgetSyncActions';
import type { RootStackParamList } from '../../../shared/navigation/types';
import { Text, ScreenGradient, Card, ProgressLine } from '../../../shared/ui';
import { Spacing, Colors, Radius, Typography, FontFamily } from '../../../shared/theme';
import type { DailyTask, TaskCategory } from '../../../shared/types';
import { addDaysIso, isLastHourOfDay } from '../domain/taskMove';
import { EmberLocalDock } from '../../ember';
import { TaskMoveSheet } from './TaskMoveSheet';
import { getTaskCategoryOptions, taskCategoryLabel } from './taskCategories';
import { useTranslation } from '../../../shared/i18n/useTranslation';
import { splitLinkedText } from '../../../shared/i18n/linkedText';
import { setEmberModalCoveringSource } from '../../../shared/ui/emberSurface';

interface TaskRowProps {
  task: DailyTask;
  goalTitle?: string | null;
  onToggle: () => void;
  onEdit: () => void;
  onMove?: () => void;
  onRemove: () => void;
}

function TaskRow({
  task,
  goalTitle,
  onToggle,
  onEdit,
  onMove,
  onRemove,
}: TaskRowProps) {
  const { t } = useTranslation();
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
              style={[
                styles.checkbox,
                task.completed && styles.checkboxChecked,
              ]}
            >
              {task.completed && (
                <Animated.Text
                  style={[
                    styles.checkmark,
                    { transform: [{ scale: scaleAnim }] },
                  ]}
                >
                  ✓
                </Animated.Text>
              )}
            </View>
            <View style={styles.taskContent}>
              <Text
                variant="body"
                color="primary"
                style={[
                  styles.taskTitle,
                  task.completed && styles.taskTitleDone,
                ]}
                numberOfLines={3}
              >
                {task.title}
              </Text>
              <Text variant="caption" color="secondary">
                {taskCategoryLabel(task.category)}
                {task.sourceGoalId != null && (
                  <Text
                    variant="caption"
                    color="secondary"
                    style={styles.fromGoal}
                  >
                    {' · '}
                    {goalTitle ?? t('tasks.fromGoal')}
                  </Text>
                )}
              </Text>
            </View>
            {!task.completed && onMove ? (
              <TouchableOpacity
                onPress={e => {
                  e?.stopPropagation?.();
                  onMove();
                }}
                style={styles.actionBtn}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Text variant="caption" style={styles.actionText}>
                  {t('tasks.move')}
                </Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              onPress={e => {
                e?.stopPropagation?.();
                onEdit();
              }}
              style={styles.actionBtn}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Text variant="caption" style={styles.actionText}>
                {t('common.edit')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={e => {
                e?.stopPropagation?.();
                onRemove();
              }}
              style={styles.actionBtn}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Text variant="caption" style={styles.removeText}>
                {t('common.remove')}
              </Text>
            </TouchableOpacity>
          </View>
        </Card>
      </TouchableOpacity>
    </Animated.View>
  );
}

export function DailyTasksScreen() {
  const navigation =
    useNavigation<
      NativeStackNavigationProp<RootStackParamList, 'DailyTasks'>
    >();
  const { t } = useTranslation();
  const today = useTodayIso();
  const {
    tasks,
    stats,
    refresh,
    addTask,
    toggleTask,
    updateTask,
    removeTask,
    moveTasks,
    removeTasks,
    getGoalTitle,
  } = useDailyTasks(today);
  const {
    visible: carryoverVisible,
    unfinishedYesterday,
    closePrompt: closeCarryoverPrompt,
    dismissNotNow: dismissCarryoverNotNow,
    clearYesterday,
  } = useTaskCarryoverPrompt(today);
  const { syncDailyTasksWidget } = useWidgetSyncActions();
  const [newTitle, setNewTitle] = React.useState('');
  const [selectedCategory, setSelectedCategory] =
    React.useState<TaskCategory>('other');
  const [refreshing, setRefreshing] = React.useState(false);
  const [editingTask, setEditingTask] = React.useState<DailyTask | null>(null);
  const [editTitle, setEditTitle] = React.useState('');
  const [editCategory, setEditCategory] = React.useState<TaskCategory>('other');
  const [moveTargetIds, setMoveTargetIds] = React.useState<string[] | null>(
    null,
  );
  const [moveSheetTitle, setMoveSheetTitle] = React.useState(t('tasks.moveOne'));
  const [moveShowToday, setMoveShowToday] = React.useState(false);
  const [moveIsCarryover, setMoveIsCarryover] = React.useState(false);
  const [pendingCarryoverMove, setPendingCarryoverMove] = React.useState<{
    taskIds: string[];
    title: string;
  } | null>(null);
  const [lastHourTick, setLastHourTick] = React.useState(() => Date.now());

  useFocusEffect(
    useCallback(() => {
      // Local dock on this screen (add form); keep global Ember suppressed.
      setEmberModalCoveringSource('DailyTasksScreen', true);
      setLastHourTick(Date.now());
      const interval = setInterval(() => setLastHourTick(Date.now()), 60_000);
      return () => {
        clearInterval(interval);
        setEmberModalCoveringSource('DailyTasksScreen', false);
      };
    }, []),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    refresh();
    syncDailyTasksWidget();
    setTimeout(() => setRefreshing(false), 100);
  }, [refresh, syncDailyTasksWidget]);

  const handleAdd = useCallback(() => {
    const title = newTitle.trim();
    if (!title) return;
    addTask({
      date: today,
      title,
      category: selectedCategory,
    });
    setNewTitle('');
    syncDailyTasksWidget();
  }, [today, newTitle, selectedCategory, addTask, syncDailyTasksWidget]);

  const handleToggle = useCallback(
    (id: string) => {
      toggleTask(id);
      syncDailyTasksWidget();
    },
    [toggleTask, syncDailyTasksWidget],
  );

  const openEdit = useCallback((task: DailyTask) => {
    setEditingTask(task);
    setEditTitle(task.title);
    setEditCategory(task.category);
  }, []);

  const closeEdit = useCallback(() => {
    setEditingTask(null);
  }, []);

  const openMove = useCallback((task: DailyTask) => {
    setMoveTargetIds([task.id]);
    setMoveSheetTitle(t('tasks.moveOne'));
    setMoveShowToday(false);
    setMoveIsCarryover(false);
  }, [t]);

  const closeMove = useCallback(() => {
    setMoveTargetIds(null);
    setMoveIsCarryover(false);
  }, []);

  const handleMoveDate = useCallback(
    (dateIso: string) => {
      if (moveTargetIds == null) return;
      const movedCount = moveTasks(moveTargetIds, dateIso);
      syncDailyTasksWidget();
      setMoveTargetIds(null);
      setMoveIsCarryover(false);
      if (moveIsCarryover) {
        dismissCarryoverNotNow();
        if (movedCount === 0) {
          Alert.alert(t('tasks.alreadyMoved.title'), t('tasks.alreadyMoved.body'));
        }
      }
    },
    [
      dismissCarryoverNotNow,
      moveIsCarryover,
      moveTargetIds,
      moveTasks,
      syncDailyTasksWidget,
      t,
    ],
  );

  const handleSaveEdit = useCallback(() => {
    if (!editingTask) return;
    const title = editTitle.trim();
    if (!title) return;
    updateTask(editingTask.id, {
      title,
      category: editCategory,
    });
    syncDailyTasksWidget();
    closeEdit();
  }, [editingTask, editTitle, editCategory, updateTask, syncDailyTasksWidget, closeEdit]);

  const handleRemove = useCallback(
    (task: DailyTask) => {
      Alert.alert(
        t('tasks.removeTask'),
        t('tasks.removeTaskBody', { title: task.title }),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('common.remove'),
            style: 'destructive',
            onPress: () => {
              removeTask(task.id);
              syncDailyTasksWidget();
            },
          },
        ],
      );
    },
    [removeTask, syncDailyTasksWidget, t],
  );

  const unfinishedTasks = React.useMemo(
    () => tasks.filter(task => !task.completed),
    [tasks],
  );
  const unfinishedTaskIds = React.useMemo(
    () => unfinishedTasks.map(task => task.id),
    [unfinishedTasks],
  );
  const showLastHourBanner =
    isLastHourOfDay(new Date(lastHourTick)) && unfinishedTasks.length > 0;

  const handleMoveAllTomorrow = useCallback(() => {
    moveTasks(unfinishedTaskIds, addDaysIso(today, 1));
    syncDailyTasksWidget();
  }, [moveTasks, syncDailyTasksWidget, today, unfinishedTaskIds]);

  const handleChooseBulkMoveDate = useCallback(() => {
    setMoveTargetIds(unfinishedTaskIds);
    setMoveSheetTitle(t('tasks.moveTitle', { count: unfinishedTasks.length }));
    setMoveShowToday(false);
    setMoveIsCarryover(false);
  }, [t, unfinishedTaskIds, unfinishedTasks.length]);

  const handleClearUnfinished = useCallback(() => {
    Alert.alert(
      t('tasks.removeUnfinished', { count: unfinishedTasks.length }),
      undefined,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.remove'),
          style: 'destructive',
          onPress: () => {
            removeTasks(unfinishedTaskIds);
            syncDailyTasksWidget();
          },
        },
      ],
    );
  }, [
    removeTasks,
    syncDailyTasksWidget,
    t,
    unfinishedTaskIds,
    unfinishedTasks.length,
  ]);

  const carryoverTaskIds = React.useMemo(
    () => unfinishedYesterday.map(task => task.id),
    [unfinishedYesterday],
  );

  const handleCarryoverMove = useCallback(
    (dateIso: string) => {
      const movedCount = moveTasks(carryoverTaskIds, dateIso);
      syncDailyTasksWidget();
      dismissCarryoverNotNow();
      if (movedCount === 0) {
        Alert.alert(t('tasks.alreadyMoved.title'), t('tasks.alreadyMoved.body'));
      }
    },
    [
      carryoverTaskIds,
      dismissCarryoverNotNow,
      moveTasks,
      syncDailyTasksWidget,
      t,
    ],
  );

  const handleCarryoverPickDate = useCallback(() => {
    setPendingCarryoverMove({
      taskIds: carryoverTaskIds,
      title: t('tasks.moveTitle', { count: unfinishedYesterday.length }),
    });
    closeCarryoverPrompt();
  }, [
    carryoverTaskIds,
    closeCarryoverPrompt,
    t,
    unfinishedYesterday.length,
  ]);

  const handleCarryoverDismiss = useCallback(() => {
    if (pendingCarryoverMove == null) return;

    setMoveTargetIds(pendingCarryoverMove.taskIds);
    setMoveSheetTitle(pendingCarryoverMove.title);
    setMoveShowToday(false);
    setMoveIsCarryover(true);
    setPendingCarryoverMove(null);
  }, [pendingCarryoverMove]);

  useEffect(() => {
    if (Platform.OS === 'ios' || pendingCarryoverMove == null) return;
    const timeoutId = setTimeout(handleCarryoverDismiss, 0);
    return () => clearTimeout(timeoutId);
  }, [handleCarryoverDismiss, pendingCarryoverMove]);

  const handleClearYesterday = useCallback(() => {
    Alert.alert(
      t('tasks.removeUnfinished', { count: unfinishedYesterday.length }),
      undefined,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.remove'),
          style: 'destructive',
          onPress: () => {
            clearYesterday();
            syncDailyTasksWidget();
          },
        },
      ],
    );
  }, [clearYesterday, syncDailyTasksWidget, t, unfinishedYesterday.length]);

  const progress = stats.total > 0 ? stats.completed / stats.total : 0;
  const categoryOptions = getTaskCategoryOptions();
  const subtitle = splitLinkedText(t('tasks.today.subtitle'));

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
            {t('nav.todaysTasks')}
          </Text>
          <Text variant="body" color="secondary" style={styles.subtitle}>
            {subtitle.before}
            <Text
              variant="body"
              color="primary"
              style={styles.inlineLink}
              onPress={() => navigation.navigate('MonthlyGoals')}
            >
              {subtitle.link}
            </Text>
            {subtitle.after}
          </Text>

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => navigation.navigate('TaskReport')}
          >
            <Card style={styles.reportCard}>
              <Text
                variant="sectionTitle"
                color="secondary"
                style={styles.blockTitle}
              >
                {t('tasks.today.report')}
              </Text>
              <View style={styles.reportRow}>
                <Text variant="body" color="primary">
                  {t('tasks.today.reportSummary', {
                    completed: stats.completed,
                    pending: stats.pending,
                  })}
                </Text>
              </View>
              {stats.total > 0 && (
                <ProgressLine
                  progress={progress}
                  fillColor={progress === 1 ? '#34C759' : '#E9A23A'}
                  style={styles.progress}
                />
              )}
              <Text
                variant="caption"
                color="secondary"
                style={styles.reportLink}
              >
                {t('tasks.today.reportLink')}
              </Text>
            </Card>
          </TouchableOpacity>

          {showLastHourBanner && (
            <Card style={styles.lastHourBanner}>
              <Text
                variant="sectionTitle"
                color="primary"
                style={styles.lastHourTitle}
              >
                {t('tasks.today.stillOpen', { count: unfinishedTasks.length })}
              </Text>
              <View style={styles.lastHourActions}>
                <TouchableOpacity
                  style={[styles.lastHourButton, styles.lastHourPrimaryButton]}
                  onPress={handleMoveAllTomorrow}
                >
                  <Text variant="body" style={styles.lastHourPrimaryText}>
                    {t('tasks.today.moveAllTomorrow')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.lastHourButton}
                  onPress={handleChooseBulkMoveDate}
                >
                  <Text variant="body" color="primary">
                    {t('tasks.today.chooseDate')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.lastHourButton}
                  onPress={handleClearUnfinished}
                >
                  <Text variant="body" style={styles.lastHourClearText}>
                    {t('tasks.today.clearUnfinished')}
                  </Text>
                </TouchableOpacity>
              </View>
            </Card>
          )}

          <View style={styles.addSection}>
            <Text
              variant="caption"
              color="secondary"
              style={styles.addSectionLabel}
            >
              {t('tasks.today.newTask')}
            </Text>
            <TextInput
              style={styles.input}
              value={newTitle}
              onChangeText={setNewTitle}
              placeholder={t('tasks.titlePlaceholder')}
              placeholderTextColor={Colors.textSecondary}
              autoCapitalize="sentences"
              returnKeyType="done"
              onSubmitEditing={handleAdd}
              blurOnSubmit
              multiline
              maxLength={200}
            />
            <Text
              variant="caption"
              color="secondary"
              style={styles.categorySectionLabel}
            >
              {t('tasks.categoryLabel')}
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.chipScroll}
              contentContainerStyle={styles.chipContainer}
            >
              {categoryOptions.map(({ value, label }) => (
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
                    style={
                      selectedCategory === value && styles.chipTextSelected
                    }
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={[
                styles.addButton,
                !newTitle.trim() && styles.addButtonDisabled,
              ]}
              onPress={handleAdd}
              disabled={!newTitle.trim()}
            >
              <Text variant="body" style={styles.addButtonText}>
                {t('tasks.addTask')}
              </Text>
            </TouchableOpacity>
          </View>

          {tasks.length === 0 ? (
            <Text variant="body" color="secondary" style={styles.empty}>
              {t('tasks.today.empty')}
            </Text>
          ) : (
            tasks.map(task => (
              <TaskRow
                key={task.id}
                task={task}
                goalTitle={
                  task.sourceGoalId
                    ? getGoalTitle(task.sourceGoalId)
                    : undefined
                }
                onToggle={() => handleToggle(task.id)}
                onEdit={() => openEdit(task)}
                onMove={() => openMove(task)}
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
              <Pressable
                style={styles.modalContent}
                onPress={e => e.stopPropagation()}
              >
                <Text
                  variant="sectionTitle"
                  color="primary"
                  style={styles.modalTitle}
                >
                  {t('tasks.editTask')}
                </Text>
                <Text
                  variant="caption"
                  color="secondary"
                  style={styles.modalInputLabel}
                >
                  {t('tasks.taskTitle')}
                </Text>
                <TextInput
                  style={styles.modalInput}
                  value={editTitle}
                  onChangeText={setEditTitle}
                  placeholder={t('tasks.titlePlaceholder')}
                  placeholderTextColor={Colors.textSecondary}
                  autoCapitalize="sentences"
                  returnKeyType="done"
                  onSubmitEditing={handleSaveEdit}
                  blurOnSubmit
                  multiline
                  maxLength={200}
                />
                <Text
                  variant="caption"
                  color="secondary"
                  style={styles.categoryLabel}
                >
                  {t('tasks.categoryLabel')}
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.chipScroll}
                  contentContainerStyle={styles.chipContainer}
                >
                  {categoryOptions.map(({ value, label }) => (
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
                        style={
                          editCategory === value && styles.chipTextSelected
                        }
                      >
                        {label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.modalButton}
                    onPress={closeEdit}
                  >
                    <Text variant="body" color="secondary">
                      {t('common.cancel')}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonPrimary]}
                    onPress={handleSaveEdit}
                    disabled={!editTitle.trim()}
                  >
                    <Text variant="body" style={styles.modalButtonPrimaryText}>
                      {t('common.save')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </Pressable>
            </Pressable>
            <EmberLocalDock place="DailyTasksAdd" autoIntro />
          </Modal>

          {stats.total > 0 && stats.completed === stats.total && (
            <Text
              variant="caption"
              color="secondary"
              style={styles.celebration}
            >
              {t('tasks.today.allDone')}
            </Text>
          )}
        </ScrollView>
      </ScreenGradient>
      {editingTask == null ? (
        <EmberLocalDock place="DailyTasks" autoIntro />
      ) : null}
      <Modal
        visible={carryoverVisible}
        transparent
        animationType="fade"
        onRequestClose={dismissCarryoverNotNow}
        onDismiss={
          Platform.OS === 'ios' ? handleCarryoverDismiss : undefined
        }
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={dismissCarryoverNotNow}
        >
          <Pressable
            style={styles.modalContent}
            onPress={event => event.stopPropagation()}
          >
            <Text
              variant="sectionTitle"
              color="primary"
              style={styles.modalTitle}
            >
              {t('tasks.carryover.title')}
            </Text>
            <Text
              variant="body"
              color="secondary"
              style={styles.carryoverDescription}
            >
              {t('tasks.carryover.description', {
                count: unfinishedYesterday.length,
              })}
            </Text>
            <TouchableOpacity
              style={[styles.carryoverButton, styles.carryoverPrimaryButton]}
              onPress={() => handleCarryoverMove(today)}
              accessibilityRole="button"
            >
              <Text variant="body" style={styles.carryoverPrimaryText}>
                {t('common.today')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.carryoverButton}
              onPress={() => handleCarryoverMove(addDaysIso(today, 1))}
              accessibilityRole="button"
            >
              <Text variant="body" color="primary">
                {t('common.tomorrow')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.carryoverButton}
              onPress={handleCarryoverPickDate}
              accessibilityRole="button"
            >
              <Text variant="body" color="primary">
                {t('tasks.pickDate')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.carryoverButton}
              onPress={handleClearYesterday}
              accessibilityRole="button"
            >
              <Text variant="body" style={styles.carryoverClearText}>
                {t('tasks.carryover.clear')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.carryoverNotNowButton}
              onPress={dismissCarryoverNotNow}
              accessibilityRole="button"
            >
              <Text variant="body" color="secondary">
                {t('common.notNow')}
              </Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
      <TaskMoveSheet
        visible={moveTargetIds != null}
        title={moveSheetTitle}
        showTodayOption={moveShowToday}
        onClose={closeMove}
        onSelectDate={handleMoveDate}
      />
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
    letterSpacing: 0.4,
  },
  reportRow: { marginBottom: Spacing[2] },
  progress: { marginTop: Spacing[1] },
  reportLink: { marginTop: Spacing[2], textDecorationLine: 'underline' },
  lastHourBanner: {
    marginBottom: Spacing[4],
    borderWidth: 1,
    borderColor: '#E9A23A',
  },
  lastHourTitle: { marginBottom: Spacing[3] },
  lastHourActions: { gap: Spacing[2] },
  lastHourButton: {
    paddingVertical: Spacing[2],
    paddingHorizontal: Spacing[3],
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.divider,
    alignItems: 'center',
  },
  lastHourPrimaryButton: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  lastHourPrimaryText: { color: Colors.background },
  lastHourClearText: { color: '#E9A23A' },
  addSection: {
    marginBottom: Spacing[4],
    padding: Spacing[4],
    backgroundColor: Colors.cardLighter,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  addSectionLabel: {
    marginBottom: Spacing[2],
    letterSpacing: 0.4,
  },
  categorySectionLabel: {
    marginBottom: Spacing[1],
    letterSpacing: 0.4,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.divider,
    borderRadius: Radius.md,
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[4],
    color: Colors.textPrimary,
    fontSize: Typography.greeting,
    lineHeight: 24,
    minHeight: 56,
    marginBottom: Spacing[3],
    textAlignVertical: 'top',
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
    fontSize: Typography.subtitle,
    fontFamily: FontFamily.bold,
  },
  taskContent: { flex: 1 },
  taskTitle: {
    marginBottom: 2,
    fontSize: Typography.lead,
    lineHeight: 22,
  },
  taskTitleDone: {
    textDecorationLine: 'line-through',
    opacity: 0.7,
  },
  fromGoal: { fontStyle: 'italic' },
  actionBtn: { paddingVertical: Spacing[1], paddingHorizontal: Spacing[2] },
  actionText: { color: Colors.textSecondary, textDecorationLine: 'underline' },
  removeText: { color: Colors.textSecondary, textDecorationLine: 'underline' },
  celebration: {
    marginTop: Spacing[2],
    fontStyle: 'italic',
    textAlign: 'center',
  },
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
  modalInputLabel: {
    marginBottom: Spacing[1],
    letterSpacing: 0.4,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: Colors.divider,
    borderRadius: Radius.md,
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[4],
    color: Colors.textPrimary,
    fontSize: Typography.greeting,
    lineHeight: 24,
    minHeight: 56,
    marginBottom: Spacing[3],
    textAlignVertical: 'top',
  },
  categoryLabel: { marginBottom: Spacing[1] },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing[3],
    marginTop: Spacing[4],
  },
  modalButton: { paddingVertical: Spacing[2], paddingHorizontal: Spacing[3] },
  modalButtonPrimary: {
    backgroundColor: Colors.divider,
    borderRadius: Radius.sm,
  },
  modalButtonPrimaryText: { color: Colors.textPrimary },
  carryoverDescription: { marginBottom: Spacing[3] },
  carryoverButton: {
    borderWidth: 1,
    borderColor: Colors.divider,
    borderRadius: Radius.md,
    backgroundColor: Colors.cardLighter,
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[4],
    marginBottom: Spacing[2],
    alignItems: 'center',
  },
  carryoverPrimaryButton: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  carryoverPrimaryText: { color: Colors.background },
  carryoverClearText: { color: '#E9A23A' },
  carryoverNotNowButton: {
    paddingVertical: Spacing[2],
    alignItems: 'center',
  },
});
