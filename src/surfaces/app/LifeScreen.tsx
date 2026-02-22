import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, ScreenGradient, Card } from '../../ui';
import { useObserveTimeState } from '../../hooks';
import { Spacing } from '../../theme';

export function LifeScreen() {
  const { userProfile, timeState } = useObserveTimeState();
  const hasBirthDate = !!userProfile.birthDate;

  const percentUsed = Math.round(timeState.life * 100);
  const remainingDays = timeState.remainingDaysLife;

  return (
    <View style={styles.container}>
      <ScreenGradient>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Text variant="sectionTitle" color="primary" style={styles.sectionTitle}>
            Your life
          </Text>

          <Card style={styles.card}>
            {hasBirthDate ? (
              <>
                <Text variant="cardValue" color="primary" style={styles.value}>
                  {percentUsed}% used
                </Text>
                <Text variant="body" color="secondary">
                  ≈ {remainingDays?.toLocaleString() ?? 0} days remaining
                </Text>
              </>
            ) : (
              <Text variant="body" color="secondary">
                Set birth date in Settings to see your life progress.
              </Text>
            )}
          </Card>
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
  sectionTitle: {
    marginBottom: Spacing[4],
  },
  card: {
    marginBottom: Spacing[4],
  },
  value: {
    marginBottom: Spacing[2],
  },
});