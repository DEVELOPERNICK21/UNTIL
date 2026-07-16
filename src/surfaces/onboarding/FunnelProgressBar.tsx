import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useTheme, Spacing, Radius, Weight, getFontFamilyForWeight } from '../../theme';
import { Text } from '../../ui';

interface FunnelProgressBarProps {
  progress: number;
  visible: boolean;
  encouragement?: string | null;
}

export function FunnelProgressBar({
  progress,
  visible,
  encouragement = null,
}: FunnelProgressBarProps) {
  const theme = useTheme();
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!encouragement) return;
    opacity.setValue(0.35);
    Animated.timing(opacity, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [encouragement, opacity]);

  if (!visible) return <View style={styles.spacer} />;

  const clamped = Math.max(0, Math.min(1, progress));

  return (
    <View style={styles.wrap}>
      <View
        style={[styles.track, { backgroundColor: theme.progressTrack }]}
        accessibilityRole="progressbar"
        accessibilityValue={{
          min: 0,
          max: 100,
          now: Math.round(clamped * 100),
        }}
      >
        <View
          style={[
            styles.fill,
            {
              backgroundColor: theme.percent,
              width: `${clamped * 100}%` as `${number}%`,
            },
          ]}
        />
      </View>
      {encouragement ? (
        <Animated.View style={{ opacity }}>
          <Text
            variant="caption"
            style={[
              styles.encouragement,
              {
                color: theme.textSecondary,
                fontFamily: getFontFamilyForWeight(Weight.medium),
              },
            ]}
          >
            {encouragement}
          </Text>
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  spacer: {
    height: 4,
    marginBottom: Spacing[3],
  },
  wrap: {
    width: '100%',
    marginBottom: Spacing[3],
  },
  track: {
    height: 4,
    borderRadius: Radius.full ?? 999,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: Radius.full ?? 999,
  },
  encouragement: {
    textAlign: 'center',
    marginTop: Spacing[2],
    letterSpacing: 0.2,
  },
});
