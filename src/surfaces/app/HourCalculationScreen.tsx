import React, { useState, useCallback, useEffect, useRef } from 'react';
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
import { Spacing, Colors, Radius, Typography } from '../../theme';
import type { RootStackParamList } from '../../navigation/RootNavigator';

function formatElapsed(
  totalElapsedMs: number,
  startTimeMs: number,
  isRunning: boolean,
): string {
  const now = Date.now();
  const totalMs =
    totalElapsedMs + (isRunning && startTimeMs > 0 ? now - startTimeMs : 0);
  const totalSec = Math.floor(totalMs / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

interface LiveElapsedSectionProps {
  isRunning: boolean;
  startTimeMs: number;
  totalElapsedMs: number;
  onReset: () => void;
}

/**
 * LiveElapsedSection isolates the 1-second timer to prevent the entire
 * HourCalculationScreen from re-rendering every second.
 */
const LiveElapsedSection = React.memo(function LiveElapsedSection({
  isRunning,
  startTimeMs,
  totalElapsedMs,
  onReset,
}: LiveElapsedSectionProps) {
  // We use a dummy state to trigger re-renders every second when isRunning is true.
  const [, setTicks] = useState(0);

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setTicks((t) => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning]);

  const elapsedDisplay = formatElapsed(totalElapsedMs, startTimeMs, isRunning);

  return (
    <Card style={styles.card}>
      <Text variant="caption" color="secondary" style={styles.label}>
        Current time
      </Text>
      <Text variant="title" color="primary" style={styles.elapsed}>
        {elapsedDisplay}
      </Text>
      {isRunning && (
        <Text variant="caption" color="secondary" style={styles.runningHint}>
          Running — tap widget to stop
        </Text>
      )}
      <TouchableOpacity style={styles.resetButton} onPress={onReset}>
        <Text variant="caption" style={styles.resetButtonText}>
          Reset to 0:00:00
        </Text>
      </TouchableOpacity>
    </Card>
  );
});

export function HourCalculationScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList, 'HourCalculation'>>();
  const { getHourCalculationState, syncHourCalculationWidget } =
    useWidgetSyncActions();
  const [state, setState] = useState(() => getHourCalculationState());
  const [titleInput, setTitleInput] = useState(state.title);

  // Use a ref for titleInput to keep handleSaveTitle and handleReset stable,
  // preventing unnecessary re-renders of the memoized LiveElapsedSection.
  const titleInputRef = useRef(titleInput);
  useEffect(() => {
    titleInputRef.current = titleInput;
  }, [titleInput]);

  const refresh = useCallback(() => {
    const next = getHourCalculationState();
    setState(next);
    setTitleInput(next.title);
  }, [getHourCalculationState]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const handleSaveTitle = useCallback(() => {
    const title = titleInputRef.current.trim() || 'Hour timer';
    syncHourCalculationWidget({ title });
    refresh();
  }, [syncHourCalculationWidget, refresh]);

  const handleReset = useCallback(() => {
    Alert.alert(
      'Reset timer',
      'Reset elapsed time to zero? The widget will show 0:00:00.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            syncHourCalculationWidget({
              reset: true,
              title: titleInputRef.current.trim() || state.title,
            });
            refresh();
          },
        },
      ],
    );
  }, [syncHourCalculationWidget, state.title, refresh]);

  return (
    <View style={styles.container}>
      <ScreenGradient>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text variant="sectionTitle" color="primary" style={styles.title}>
            Hour calculation
          </Text>
          <Text variant="body" color="secondary" style={styles.subtitle}>
            Set a title (e.g. Office hour), then add the Hour calculation
            widget. Tap the widget to start, tap again to stop. One timer only.
          </Text>

          <Card style={styles.card}>
            <Text variant="caption" color="secondary" style={styles.label}>
              Widget title
            </Text>
            <View style={styles.row}>
              <TextInput
                style={styles.input}
                value={titleInput}
                onChangeText={setTitleInput}
                placeholder="e.g. Office hour"
                placeholderTextColor={Colors.textSecondary}
                autoCapitalize="words"
                onSubmitEditing={handleSaveTitle}
                returnKeyType="done"
              />
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleSaveTitle}
              >
                <Text variant="caption" style={styles.primaryButtonText}>
                  Save
                </Text>
              </TouchableOpacity>
            </View>
          </Card>

          <LiveElapsedSection
            isRunning={state.isRunning}
            startTimeMs={state.startTimeMs}
            totalElapsedMs={state.totalElapsedMs}
            onReset={handleReset}
          />

          <Text variant="caption" color="secondary" style={styles.hint}>
            {Platform.OS === 'ios'
              ? 'Long-press home screen → + → search Until → add "Hour calculation" widget.'
              : 'Long-press home screen → Widgets → Until → Hour calculation.'}
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
  card: { marginBottom: Spacing[4] },
  label: { marginBottom: Spacing[2] },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
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
  primaryButton: {
    backgroundColor: Colors.divider,
    paddingVertical: Spacing[2],
    paddingHorizontal: Spacing[4],
    borderRadius: Radius.md,
  },
  primaryButtonText: { color: Colors.textPrimary },
  elapsed: {
    fontSize: Typography.large,
    marginVertical: Spacing[2],
  },
  runningHint: { marginBottom: Spacing[2] },
  resetButton: {
    alignSelf: 'flex-start',
    paddingVertical: Spacing[1],
    paddingHorizontal: Spacing[2],
  },
  resetButtonText: {
    color: Colors.textSecondary,
    textDecorationLine: 'underline',
  },
  hint: { marginTop: Spacing[2], fontStyle: 'italic' },
});
