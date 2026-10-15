import React, { useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ScreenGradient } from '../../../shared/ui';
import { TaskReportContent } from './TaskReportContent';
import { EmberLocalDock } from '../../ember';
import { setEmberModalCoveringSource } from '../../../shared/ui/emberSurface';

export function TaskReportScreen() {
  useFocusEffect(
    useCallback(() => {
      setEmberModalCoveringSource('TaskReportScreen', true);
      return () => setEmberModalCoveringSource('TaskReportScreen', false);
    }, []),
  );

  return (
    <View style={styles.container}>
      <ScreenGradient>
        <TaskReportContent />
      </ScreenGradient>
      <EmberLocalDock place="TaskReport" autoIntro />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
