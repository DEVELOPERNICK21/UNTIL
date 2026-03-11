import React, { useState, useCallback, useEffect } from 'react';
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
import { getHourCalculationState, syncHourCalculationWidget } from '../../infrastructure/WidgetSync';
import { Spacing, Colors, Radius } from '../../theme';
import type { RootStackParamList } from '../../navigation/RootNavigator';

function formatElapsed(totalElapsedMs: number, startTimeMs: number, isRunning: boolean): string {
  const now = Date.now();
  const totalMs = totalElapsedMs + (isRunning && startTimeMs > 0 ? now - startTimeMs : 0);
  const totalSec = Math.floor(totalMs / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function HourCalculationScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'HourCalculation'>>();
  const [state, setState] = useState(getHourCalculationState);
  const [titleInput, setTitleInput] = useState(state.title);

  const refresh = useCallback(() => {
    const next = getHourCalculationState();
    setState(next);
    setTitleInput(next.title);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  // Update displayed elapsed time every second when running
  useEffect(() => {
    if (!state.isRunning) return;
    const interval = setInterval(() => setState(getHourCalculationState()), 1000);
    return () => clearInterval(interval);
  }, [state.isRunning]);

  const handleSaveTitle = () => {
    const title = titleInput.trim() || 'Hour timer';
    syncHourCalculationWidget({ title });
    refresh();
  };

  const handleReset = () => {
    Alert.alert(
      'Reset timer',
      'Reset elapsed time to zero? The widget will show 0:00:00.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            syncHourCalculationWidget({ reset: true, title: titleInput.trim() || state.title });
            refresh();
          },
        },
      ]
    );
  };

  const elapsedDisplay = formatElapsed(state.totalElapsedMs, state.startTimeMs, state.isRunning);

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
            Set a title (e.g. Office hour), then add the Hour calculation widget. Tap the widget to start, tap again to stop. One timer only.
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
              <TouchableOpacity style={styles.primaryButton} onPress={handleSaveTitle}>
                <Text variant="caption" style={styles.primaryButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </Card>

          <Card style={styles.card}>
            <Text variant="caption" color="secondary" style={styles.label}>
              Current time
            </Text>
            <Text variant="title" color="primary" style={styles.elapsed}>
              {elapsedDisplay}
            </Text>
            {state.isRunning && (
              <Text variant="caption" color="secondary" style={styles.runningHint}>
                Running — tap widget to stop
              </Text>
            )}
            <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
              <Text variant="caption" style={styles.resetButtonText}>Reset to 0:00:00</Text>
            </TouchableOpacity>
          </Card>

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
    fontSize: 16,
  },
  primaryButton: {
    backgroundColor: Colors.divider,
    paddingVertical: Spacing[2],
    paddingHorizontal: Spacing[4],
    borderRadius: Radius.md,
  },
  primaryButtonText: { color: Colors.textPrimary },
  elapsed: {
    fontSize: 32,
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
