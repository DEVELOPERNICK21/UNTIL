import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Card } from '../../../shared/ui';
import { Spacing, Colors, Radius } from '../../../shared/theme';
import type { CustomCounter } from '../../../shared/types';

interface CounterCardProps {
  counter: CustomCounter;
  /** True for the counter the widgets show. Only labelled when there is more than one. */
  onWidget: boolean;
  /** Several counters: show which one the widget uses, and let a person change it. */
  many: boolean;
  onStep: (counter: CustomCounter, step: 1 | -1) => void;
  onReset: (counter: CustomCounter) => void;
  onRemove: (counter: CustomCounter) => void;
  onShowOnWidget: (counter: CustomCounter) => void;
}

export function CounterCard({
  counter: c,
  onWidget,
  many,
  onStep,
  onReset,
  onRemove,
  onShowOnWidget,
}: CounterCardProps) {
  return (
    <Card style={styles.card}>
      <View style={styles.row}>
        <View style={styles.rowLeft}>
          <Text variant="title" color="primary" style={styles.counterTitle}>
            {c.title}
          </Text>
          <Text variant="caption" color="secondary">
            Count: {c.count}
          </Text>
          {many &&
            (onWidget ? (
              <Text variant="caption" color="secondary" style={styles.widgetNote}>
                Shown on your widget
              </Text>
            ) : (
              <TouchableOpacity
                onPress={() => onShowOnWidget(c)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel={`Show ${c.title} on the widget`}
              >
                <Text variant="caption" style={[styles.deleteText, styles.widgetNote]}>
                  Show on widget
                </Text>
              </TouchableOpacity>
            ))}
        </View>
        <TouchableOpacity
          onPress={() => onRemove(c)}
          style={styles.deleteBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text variant="caption" style={styles.deleteText}>Remove</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.stepBtn, c.count === 0 && styles.stepBtnDisabled]}
          onPress={() => onStep(c, -1)}
          disabled={c.count === 0}
          accessibilityRole="button"
          accessibilityLabel="Subtract one"
        >
          <Text variant="sectionTitle" style={styles.stepText}>−1</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.stepBtn}
          onPress={() => onStep(c, 1)}
          accessibilityRole="button"
          accessibilityLabel="Add one"
        >
          <Text variant="sectionTitle" style={styles.stepText}>+1</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.stepBtn, c.count === 0 && styles.stepBtnDisabled]}
          onPress={() => onReset(c)}
          disabled={c.count === 0}
          accessibilityRole="button"
          accessibilityLabel="Reset to zero"
        >
          <Text variant="sectionTitle" style={styles.stepText}>Reset</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: Spacing[3] },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowLeft: { flex: 1 },
  counterTitle: { marginBottom: 2 },
  widgetNote: { marginTop: Spacing[1] },
  actions: {
    flexDirection: 'row',
    gap: Spacing[2],
    marginTop: Spacing[3],
  },
  stepBtn: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: Colors.divider,
    paddingVertical: Spacing[2],
    borderRadius: Radius.md,
  },
  stepBtnDisabled: { opacity: 0.4 },
  stepText: { color: Colors.textPrimary },
  deleteBtn: {
    paddingVertical: Spacing[1],
    paddingHorizontal: Spacing[2],
  },
  deleteText: {
    color: Colors.textSecondary,
    textDecorationLine: 'underline',
  },
});
