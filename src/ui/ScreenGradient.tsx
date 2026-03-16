import React from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { useTheme } from '../theme';

interface ScreenGradientProps {
  children: React.ReactNode;
  style?: object;
}

export function ScreenGradient({ children, style }: ScreenGradientProps) {
  const { width, height } = useWindowDimensions();
  const theme = useTheme();
  const bg = theme.background;

  return (
    <View style={[StyleSheet.absoluteFill, style]}>
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="screenBg" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={bg} />
            <Stop offset="0.5" stopColor={bg} />
            <Stop offset="1" stopColor={bg} />
          </LinearGradient>
        </Defs>
        <Rect x={0} y={0} width={width} height={height} fill="url(#screenBg)" />
      </Svg>
      {children}
    </View>
  );
}
