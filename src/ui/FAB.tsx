import React, { useEffect, useRef } from 'react';
import {
  Pressable,
  StyleSheet,
  ViewStyle,
  Animated,
  Easing,
  View,
} from 'react-native';
import { Text } from './Text';
import { useTheme, Shadows, FontFamily } from '../theme';
import { useReduceMotion } from '../hooks';

const SIZE = 56;
const EXPANDED_WIDTH = 132;
const EXPAND_MS = 280;
const COLLAPSE_MS = 200;
const HOLD_MS = 2200;
const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);

interface FABProps {
  onPress: () => void;
  children: React.ReactNode;
  /** When set, morphs circle → labeled pill, then settles back to a circle. */
  label?: string;
  style?: ViewStyle;
  active?: boolean;
  accessibilityLabel?: string;
}

export function FAB({
  onPress,
  children,
  label,
  style,
  active = true,
  accessibilityLabel,
}: FABProps) {
  const theme = useTheme();
  const reduceMotion = useReduceMotion();
  const width = useRef(
    new Animated.Value(label && reduceMotion ? EXPANDED_WIDTH : SIZE),
  ).current;
  const labelOpacity = useRef(
    new Animated.Value(label && reduceMotion ? 1 : 0),
  ).current;
  const pressScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!label || reduceMotion) {
      width.setValue(label ? EXPANDED_WIDTH : SIZE);
      labelOpacity.setValue(label ? 1 : 0);
      return;
    }

    width.setValue(SIZE);
    labelOpacity.setValue(0);

    const expand = Animated.parallel([
      Animated.timing(width, {
        toValue: EXPANDED_WIDTH,
        duration: EXPAND_MS,
        easing: EASE_OUT,
        useNativeDriver: false,
      }),
      Animated.timing(labelOpacity, {
        toValue: 1,
        duration: 200,
        delay: 80,
        easing: EASE_OUT,
        useNativeDriver: false,
      }),
    ]);
    const collapse = Animated.parallel([
      Animated.timing(width, {
        toValue: SIZE,
        duration: COLLAPSE_MS,
        easing: EASE_OUT,
        useNativeDriver: false,
      }),
      Animated.timing(labelOpacity, {
        toValue: 0,
        duration: 150,
        easing: Easing.bezier(0.4, 0, 1, 1),
        useNativeDriver: false,
      }),
    ]);

    const seq = Animated.sequence([
      Animated.delay(180),
      expand,
      Animated.delay(HOLD_MS),
      collapse,
    ]);
    seq.start();
    return () => seq.stop();
  }, [label, reduceMotion, width, labelOpacity]);

  const onPressIn = () => {
    Animated.timing(pressScale, {
      toValue: 0.94,
      duration: 100,
      easing: EASE_OUT,
      useNativeDriver: true,
    }).start();
  };

  const onPressOut = () => {
    Animated.timing(pressScale, {
      toValue: 1,
      duration: 160,
      easing: EASE_OUT,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={[{ transform: [{ scale: pressScale }] }, style]}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
        style={({ pressed }) => [
          styles.hit,
          pressed && styles.pressed,
        ]}
      >
        <Animated.View
          style={[
            styles.fab,
            {
              width: label ? width : SIZE,
              backgroundColor: active ? theme.percent : theme.divider,
            },
            active && Shadows.fab,
          ]}
        >
          <View style={styles.icon}>{children}</View>
          {label ? (
            <Animated.View
              style={[styles.labelWrap, { opacity: labelOpacity }]}
              pointerEvents="none"
            >
              <Text
                variant="caption"
                numberOfLines={1}
                style={styles.label}
              >
                {label}
              </Text>
            </Animated.View>
          ) : null}
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  hit: {
    alignSelf: 'flex-end',
  },
  pressed: {
    opacity: 0.92,
  },
  fab: {
    height: SIZE,
    borderRadius: SIZE / 2,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
  },
  icon: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelWrap: {
    marginLeft: 8,
    marginRight: 18,
  },
  label: {
    color: '#FFFFFF',
    fontFamily: FontFamily.medium,
    letterSpacing: 0.2,
  },
});
