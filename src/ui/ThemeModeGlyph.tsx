import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import Svg, { Circle, Path, Defs, RadialGradient, Stop } from 'react-native-svg';

type Props = {
  mode: 'light' | 'dark';
  size?: number;
  accent: string;
  moonColor: string;
};

/**
 * Lively sun / moon glyph for the theme toggle (idle glow + spin / bob).
 * dark mode → shows sun (switch to light); light mode → shows moon.
 */
export function ThemeModeGlyph({
  mode,
  size = 22,
  accent,
  moonColor,
}: Props) {
  const spin = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0)).current;
  const bob = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(glow, {
          toValue: 0,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    const spinLoop =
      mode === 'dark'
        ? Animated.loop(
            Animated.timing(spin, {
              toValue: 1,
              duration: 9000,
              easing: Easing.linear,
              useNativeDriver: true,
            }),
          )
        : Animated.loop(
            Animated.sequence([
              Animated.timing(bob, {
                toValue: 1,
                duration: 2200,
                easing: Easing.inOut(Easing.sin),
                useNativeDriver: true,
              }),
              Animated.timing(bob, {
                toValue: 0,
                duration: 2200,
                easing: Easing.inOut(Easing.sin),
                useNativeDriver: true,
              }),
            ]),
          );

    glowLoop.start();
    spinLoop.start();
    return () => {
      glowLoop.stop();
      spinLoop.stop();
    };
  }, [mode, glow, spin, bob]);

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  const glowOpacity = glow.interpolate({
    inputRange: [0, 1],
    outputRange: [0.2, 0.55],
  });
  const glowScale = glow.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.2],
  });
  const translateY = bob.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -1.5],
  });
  const fill = mode === 'dark' ? accent : moonColor;
  const gid = `theme-${mode}`;

  return (
    <View style={[styles.wrap, { width: size + 8, height: size + 8 }]}>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.glow,
          {
            width: size + 4,
            height: size + 4,
            borderRadius: (size + 4) / 2,
            backgroundColor: fill,
            opacity: glowOpacity,
            transform: [{ scale: glowScale }],
          },
        ]}
      />
      <Animated.View
        style={{
          width: size,
          height: size,
          overflow: 'hidden',
          borderRadius: size / 2,
          transform: [
            { rotate: mode === 'dark' ? rotate : '0deg' },
            { translateY: mode === 'light' ? translateY : 0 },
          ],
        }}
      >
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Defs>
            <RadialGradient id={gid} cx="35%" cy="30%" r="70%">
              <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.95" />
              <Stop offset="0.55" stopColor={fill} stopOpacity="1" />
              <Stop offset="1" stopColor={fill} stopOpacity="0.75" />
            </RadialGradient>
          </Defs>
          {mode === 'dark' ? (
            <>
              <Path
                d="M12 3.2v1.8M12 19v1.8M3.2 12h1.8M19 12h1.8M5.6 5.6l1.3 1.3M17.1 17.1l1.3 1.3M5.6 18.4l1.3-1.3M17.1 6.9l1.3-1.3"
                stroke={fill}
                strokeWidth={1.6}
                strokeLinecap="round"
              />
              <Circle cx={12} cy={12} r={4.2} fill={`url(#${gid})`} />
            </>
          ) : (
            <Path
              d="M15.4 3.2a7.8 7.8 0 1 0 5.4 13.2 6.2 6.2 0 1 1-5.4-13.2z"
              fill={`url(#${gid})`}
            />
          )}
        </Svg>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
  },
});
