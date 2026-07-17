/**
 * Interactive home-screen widget preview beat.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Vibration,
  Animated,
  Easing,
} from 'react-native';
import { Text } from '../../ui';
import {
  useTheme,
  Spacing,
  Typography,
  Radius,
  Weight,
  getFontFamilyForWeight,
  Shadows,
} from '../../theme';
import {
  DAY_LEFT,
  DAY_PASSED,
  useEnter,
  useLiveDayClock,
} from './onboardingMotion';

function WidgetMock({
  title,
  value,
  accent,
  progress,
  selected,
  onPress,
  enterDelay,
  active,
}: {
  title: string;
  value: string;
  accent: string;
  progress: number;
  selected: boolean;
  onPress: () => void;
  enterDelay: number;
  active: boolean;
}) {
  const theme = useTheme();
  const enter = useEnter(active, enterDelay);
  const bob = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, {
          toValue: 1,
          duration: 1600 + enterDelay,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(bob, {
          toValue: 0,
          duration: 1600 + enterDelay,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [active, bob, enterDelay]);

  return (
    <Animated.View
      style={[
        enter,
        {
          flex: 1,
          transform: [
            ...(enter.transform ?? []),
            {
              translateY: bob.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -4],
              }),
            },
            { scale: selected ? 1.04 : 1 },
          ],
        },
      ]}
    >
      <Pressable
        onPress={onPress}
        style={[
          styles.widgetCard,
          {
            backgroundColor: theme.glassBg,
            borderColor: selected ? accent : theme.glassBorder,
            ...Shadows.glass,
          },
        ]}
      >
        <Text
          variant="micro"
          style={{ color: theme.textSecondary, letterSpacing: 1 }}
        >
          {title}
        </Text>
        <Text
          variant="title"
          style={{
            color: accent,
            marginTop: 4,
            fontFamily: getFontFamilyForWeight(Weight.semibold),
          }}
        >
          {value}
        </Text>
        <View style={[styles.widgetBarTrack, { backgroundColor: DAY_PASSED }]}>
          <View
            style={[
              styles.widgetBarFill,
              {
                width: `${Math.round(progress * 100)}%` as `${number}%`,
                backgroundColor: DAY_LEFT,
              },
            ]}
          />
        </View>
        {selected ? (
          <Text
            variant="micro"
            style={{ color: accent, marginTop: 8, textAlign: 'center' }}
          >
            Add from your home screen
          </Text>
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

interface InteractiveWidgetsProps {
  active: boolean;
}

export function InteractiveWidgets({ active }: InteractiveWidgetsProps) {
  const theme = useTheme();
  const clock = useLiveDayClock(active);
  const [focus, setFocus] = useState<'DAY' | 'YEAR' | null>(null);
  const title = useEnter(active, 40);
  const sub = useEnter(active, 120);
  const phone = useEnter(active, 200);
  const phoneScale = useRef(new Animated.Value(0.94)).current;

  useEffect(() => {
    if (!active) {
      phoneScale.setValue(0.94);
      return;
    }
    Animated.spring(phoneScale, {
      toValue: 1,
      friction: 7,
      tension: 70,
      useNativeDriver: true,
    }).start();
  }, [active, phoneScale]);

  return (
    <View style={styles.body}>
      <Animated.View style={title}>
        <Text variant="micro" style={[styles.eyebrow, { color: theme.percent }]}>
          ON YOUR HOME SCREEN
        </Text>
        <Text
          variant="display"
          style={[
            styles.slideTitle,
            {
              color: theme.textPrimary,
              fontFamily: getFontFamilyForWeight(Weight.bold),
            },
          ]}
        >
          Glance. Stay aware.
        </Text>
      </Animated.View>

      <Animated.View style={sub}>
        <Text
          variant="body"
          style={[styles.slideSubtitle, { color: theme.textSecondary }]}
        >
          Tap a preview widget — then add the real ones from your home screen.
        </Text>
      </Animated.View>

      <Animated.View
        style={[
          phone,
          {
            transform: [...(phone.transform ?? []), { scale: phoneScale }],
          },
        ]}
      >
        <View
          style={[
            styles.phoneFrame,
            {
              borderColor: theme.glassBorder,
              backgroundColor: theme.backgroundAlt,
            },
          ]}
        >
          <View
            style={[styles.phoneNotch, { backgroundColor: theme.divider }]}
          />
          <View style={styles.widgetGrid}>
            <WidgetMock
              title="DAY"
              value={`${clock.percentDone}%`}
              accent={theme.percent}
              progress={clock.progress}
              selected={focus === 'DAY'}
              onPress={() => {
                Vibration.vibrate(8);
                setFocus(f => (f === 'DAY' ? null : 'DAY'));
              }}
              enterDelay={260}
              active={active}
            />
            <WidgetMock
              title="YEAR"
              value="53%"
              accent={DAY_LEFT}
              progress={0.53}
              selected={focus === 'YEAR'}
              onPress={() => {
                Vibration.vibrate(8);
                setFocus(f => (f === 'YEAR' ? null : 'YEAR'));
              }}
              enterDelay={360}
              active={active}
            />
          </View>
          <Text
            variant="micro"
            style={{
              color: theme.textSecondary,
              textAlign: 'center',
              marginTop: Spacing.md,
            }}
          >
            Home screen preview
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    flexGrow: 1,
    paddingTop: Spacing.sm,
  },
  eyebrow: {
    letterSpacing: 2,
    marginBottom: Spacing.sm,
  },
  slideTitle: {
    marginBottom: Spacing.sm,
    lineHeight: Typography.display * 1.2,
  },
  slideSubtitle: {
    lineHeight: Typography.body * 1.5,
    marginBottom: Spacing.md,
  },
  phoneFrame: {
    marginTop: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    paddingTop: Spacing.lg,
  },
  phoneNotch: {
    alignSelf: 'center',
    width: 72,
    height: 8,
    borderRadius: 4,
    marginBottom: Spacing.md,
  },
  widgetGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  widgetCard: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
    minHeight: 120,
  },
  widgetBarTrack: {
    height: 6,
    borderRadius: 3,
    marginTop: Spacing.sm,
    overflow: 'hidden',
  },
  widgetBarFill: {
    height: '100%',
    borderRadius: 3,
  },
});
