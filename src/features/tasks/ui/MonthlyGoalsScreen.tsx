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
import { Text, ScreenGradient, Card } from '../../../shared/ui';
import { useMonthlyGoals } from '../hooks/useMonthlyGoals';
import { Spacing, Colors, Radius, Typography } from '../../../shared/theme';
import type { RootStackParamList } from '../../../shared/navigation/types';
import type { MonthlyGoal } from '../../../shared/types';
import { logAnalyticsEvent } from '../../../shared/analytics/analytics';
import { formatDate } from '../../../shared/i18n/translate';
import { useTranslation } from '../../../shared/i18n/useTranslation';

function currentMonthIso(): string {
  return new Date().toISOString().slice(0, 7); // YYYY-MM
}

function monthLabel(month: string): string {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(y, m - 1, 1);
  return formatDate(d, { month: 'long', year: 'numeric' });
}

export function MonthlyGoalsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'MonthlyGoals'>>();
  const { t } = useTranslation();
  const month = currentMonthIso();
  const { goals, refresh, addGoal, removeGoal } = useMonthlyGoals(month);
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [targetDescription, setTargetDescription] = useState('');

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
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;
    const hasTarget = !!targetDescription.trim();
    addGoal({
      title: trimmedTitle,
      targetDescription: targetDescription.trim() || undefined,
    });
    void logAnalyticsEvent('goal_created', { has_target_description: hasTarget });
    setModalVisible(false);
  };

  const handleRemove = (goal: MonthlyGoal) => {
    Alert.alert(
      t('tasks.goals.remove'),
      t('tasks.goals.removeBody', {
        title: goal.title,
        count: goal.tasks.length,
      }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.remove'),
          style: 'destructive',
          onPress: () => {
            removeGoal(goal.id);
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
            {t('tasks.goals.subtitle', { month: monthLabel(currentMonthIso()) })}
          </Text>

          {goals.length === 0 ? (
            <Text variant="body" color="secondary" style={styles.empty}>
              {t('tasks.goals.empty')}
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
                        {t('tasks.goals.taskCount', { count: goal.tasks.length })}
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
                      <Text variant="caption" style={styles.removeText}>{t('common.remove')}</Text>
                    </TouchableOpacity>
                  </View>
                </Card>
              </TouchableOpacity>
            ))
          )}

          <TouchableOpacity style={styles.addButton} onPress={openAdd}>
            <Text variant="caption" style={styles.addButtonText}>{t('tasks.goals.add')}</Text>
          </TouchableOpacity>
        </ScrollView>
      </ScreenGradient>

      <Modal visible={modalVisible} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <Text variant="sectionTitle" color="primary" style={styles.modalTitle}>
              {t('tasks.goals.new')}
            </Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder={t('tasks.goals.titlePlaceholder')}
              placeholderTextColor={Colors.textSecondary}
              autoCapitalize="sentences"
            />
            <TextInput
              style={[styles.input, styles.inputArea]}
              value={targetDescription}
              onChangeText={setTargetDescription}
              placeholder={t('tasks.goals.targetPlaceholder')}
              placeholderTextColor={Colors.textSecondary}
              multiline
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalButton} onPress={() => setModalVisible(false)}>
                <Text variant="body" color="secondary">{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={handleAdd}
                disabled={!title.trim()}
              >
                <Text variant="body" style={styles.modalButtonPrimaryText}>{t('common.add')}</Text>
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
    fontSize: Typography.label,
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
