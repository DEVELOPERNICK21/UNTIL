import React, { useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ScreenGradient } from '../../ui';
import { TaskReportContent } from './TaskReportContent';
import { EmberLocalDock } from '../../components/engagement/EmberLocalDock';
import { setEmberModalCovering } from '../../services/emberSurface';

export function TaskReportScreen() {
  useFocusEffect(
    useCallback(() => {
      setEmberModalCovering(true);
      return () => setEmberModalCovering(false);
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
