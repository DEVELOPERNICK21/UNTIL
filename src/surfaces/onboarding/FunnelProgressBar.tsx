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
    opacity.setValue(0.35);
    Animated.timing(opacity, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [encouragement, progress, opacity]);

  if (!visible) return <View style={styles.spacer} />;

  const clamped = Math.max(0, Math.min(1, progress));
  const percentLabel = Math.round(clamped * 100);
  const percentText = `${percentLabel}% complete`;
  const label = encouragement
    ? `${encouragement} · ${percentText}`
    : percentText;

  return (
    <View style={styles.wrap}>
      {/* Track row matches back-button height so the bar stays level */}
      <View style={styles.trackRow}>
        <View
          style={[styles.track, { backgroundColor: theme.progressTrack }]}
          accessibilityRole="progressbar"
          accessibilityValue={{
            min: 0,
            max: 100,
            now: percentLabel,
          }}
          accessibilityLabel={label}
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
      </View>
      <Animated.View style={{ opacity }}>
        <Text
          variant="caption"
          style={[
            styles.meta,
            {
              color: theme.textSecondary,
              fontFamily: getFontFamilyForWeight(Weight.medium),
            },
          ]}
        >
          {encouragement ? (
            <>
              {encouragement}
              <Text
                variant="caption"
                style={{
                  color: theme.percent,
                  fontFamily: getFontFamilyForWeight(Weight.semibold),
                }}
              >
                {` · ${percentText}`}
              </Text>
            </>
          ) : (
            <Text
              variant="caption"
              style={{
                color: theme.percent,
                fontFamily: getFontFamilyForWeight(Weight.semibold),
              }}
            >
              {percentText}
            </Text>
          )}
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  spacer: {
    height: 36,
    marginBottom: Spacing[2],
  },
  wrap: {
    width: '100%',
    marginBottom: Spacing[2],
  },
  trackRow: {
    height: 36,
    justifyContent: 'center',
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
  meta: {
    textAlign: 'center',
    letterSpacing: 0.2,
    lineHeight: 18,
    marginTop: -2,
  },
});
