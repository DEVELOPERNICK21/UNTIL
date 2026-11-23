import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Radius, Spacing } from '../../../shared/theme';
import { useTranslation } from '../../../shared/i18n/useTranslation';
import { useOpenTasksToday } from '../../tasks';
import { CalmButton } from './CalmButton';
import { CalmText } from './CalmText';
import { CALM } from './calmPalette';

interface Props {
  /** `focus` is the task chosen, if any. It goes to the closing step and nowhere else. */
  onDone: (focus?: string) => void;
}

/**
 * "Too much to do". The cure for a pile is one thing, so: pick one of today's open tasks and give it
 * ten minutes. The rest can wait. This is the part a generic breathing app cannot do.
 */
export function LoadPath({ onDone }: Props) {
  const { t } = useTranslation();
  const tasks = useOpenTasksToday(3);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [missing, setMissing] = useState(false);

  const go = () => {
    if (tasks.length === 0) {
      onDone();
      return;
    }
    const chosen = tasks.find(task => task.id === selectedId);
    if (!chosen) {
      setMissing(true);
      return;
    }
    onDone(chosen.title);
  };

  return (
    <View style={styles.root}>
      <CalmText variant="headline" tone="primary" accessibilityRole="header" style={styles.title}>
        {t('pause.load.title')}
      </CalmText>
      <CalmText variant="body" tone="secondary" style={styles.body}>
        {tasks.length > 0 ? t('pause.load.body') : t('pause.load.noTasks')}
      </CalmText>

      <View style={styles.list} accessibilityRole="radiogroup">
        {tasks.map(task => {
          const selected = task.id === selectedId;
          return (
            <Pressable
              key={task.id}
              onPress={() => {
                setSelectedId(task.id);
                setMissing(false);
              }}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={task.title}
              style={[
                styles.row,
                { backgroundColor: selected ? CALM.cardSelected : CALM.card, borderColor: selected ? CALM.accent : CALM.cardBorder },
              ]}
            >
              <View style={[styles.dot, { borderColor: selected ? CALM.accent : CALM.textMuted }]}>
                {selected ? <View style={[styles.dotFill, { backgroundColor: CALM.accent }]} /> : null}
              </View>
              <CalmText variant="body" tone="primary" numberOfLines={2} style={styles.rowText}>
                {task.title}
              </CalmText>
            </Pressable>
          );
        })}
      </View>

      <CalmText variant="caption" tone="warm" accessibilityLiveRegion="polite" style={styles.error}>
        {missing ? t('pause.load.pickFirst') : ' '}
      </CalmText>

      <View style={styles.actions}>
        <CalmButton label={t('pause.load.go')} onPress={go} />
        <CalmButton variant="quiet" label={t('common.notNow')} onPress={() => onDone()} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
    marginBottom: Spacing[1],
  },
  body: {
    textAlign: 'center',
    marginBottom: Spacing[3],
  },
  list: {
    gap: Spacing[2],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    minHeight: 54,
  },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing[2],
  },
  dotFill: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  rowText: {
    flex: 1,
  },
  error: {
    textAlign: 'center',
    marginTop: Spacing[2],
    minHeight: 20,
  },
  actions: {
    gap: Spacing[1],
    marginTop: Spacing[1],
  },
});
