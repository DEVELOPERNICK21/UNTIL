import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '../../ui';
import { useObserveTimeState } from '../../hooks';
import { Colors, Spacing } from '../../theme';

export function LifeScreen() {
  const { userProfile, timeState } = useObserveTimeState();
  const hasBirthDate = !!userProfile.birthDate;

  const percentUsed = Math.round(timeState.life * 100);
  const remainingDays = timeState.remainingDaysLife;

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      <View style={styles.content}>
        <Text variant="label" color="secondary" opacity={0.7} style={styles.label}>
          Your life
        </Text>
        {hasBirthDate ? (
          <>
            <Text variant="secondaryBlock" color="primary" style={styles.value}>
              {percentUsed}% used
            </Text>
            <Text variant="secondaryValue" color="secondary">
              ≈ {remainingDays?.toLocaleString() ?? 0} days remaining
            </Text>
          </>
        ) : (
          <Text variant="secondaryBlock" color="secondary">
            Set birth date in Settings to see
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    marginBottom: Spacing.sm,
  },
  value: {
    marginBottom: Spacing.sm,
  },
});
