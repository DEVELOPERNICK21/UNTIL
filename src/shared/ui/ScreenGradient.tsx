import React from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';
import { useTheme } from '../theme';

interface ScreenGradientProps {
  children: React.ReactNode;
  style?: object;
}

/** Atmospheric dark field with a warm percent-tint glow (not flat black). */
export function ScreenGradient({ children, style }: ScreenGradientProps) {
  const { width, height } = useWindowDimensions();
  const theme = useTheme();
  const bg = theme.background;
  const isLight = theme.statusBarStyle === 'dark-content';
  const glow = theme.percent;

  return (
    <View style={[StyleSheet.absoluteFill, style]}>
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="screenBg" x1="0" y1="0" x2="0.15" y2="1">
            <Stop offset="0" stopColor={isLight ? '#FFF9F3' : '#161618'} />
            <Stop offset="0.45" stopColor={bg} />
            <Stop offset="1" stopColor={isLight ? '#EFE8E0' : '#0A0A0C'} />
          </LinearGradient>
          <RadialGradient
            id="warmGlow"
            cx="78%"
            cy="8%"
            rx="60%"
            ry="42%"
          >
            <Stop
              offset="0"
              stopColor={glow}
              stopOpacity={isLight ? 0.2 : 0.38}
            />
            <Stop offset="1" stopColor={glow} stopOpacity={0} />
          </RadialGradient>
          {/* Mid-field glow — glass cards need visible atmosphere behind them */}
          <RadialGradient
            id="midGlow"
            cx="50%"
            cy="42%"
            rx="85%"
            ry="48%"
          >
            <Stop
              offset="0"
              stopColor={glow}
              stopOpacity={isLight ? 0.14 : 0.28}
            />
            <Stop offset="0.55" stopColor={glow} stopOpacity={isLight ? 0.05 : 0.1} />
            <Stop offset="1" stopColor={glow} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient
            id="sideGlow"
            cx="8%"
            cy="58%"
            rx="45%"
            ry="32%"
          >
            <Stop
              offset="0"
              stopColor={glow}
              stopOpacity={isLight ? 0.08 : 0.14}
            />
            <Stop offset="1" stopColor={glow} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient
            id="coolVignette"
            cx="20%"
            cy="88%"
            rx="60%"
            ry="40%"
          >
            <Stop
              offset="0"
              stopColor={isLight ? '#FFFFFF' : '#1A1A22'}
              stopOpacity={isLight ? 0.5 : 0.35}
            />
            <Stop offset="1" stopColor={bg} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x={0} y={0} width={width} height={height} fill="url(#screenBg)" />
        <Rect
          x={0}
          y={0}
          width={width}
          height={height}
          fill="url(#warmGlow)"
        />
        <Rect x={0} y={0} width={width} height={height} fill="url(#midGlow)" />
        <Rect x={0} y={0} width={width} height={height} fill="url(#sideGlow)" />
        <Rect
          x={0}
          y={0}
          width={width}
          height={height}
          fill="url(#coolVignette)"
        />
        {!isLight && (
          <Circle
            cx={width * 0.15}
            cy={height * 0.22}
            r={2}
            fill="#FFFFFF"
            fillOpacity={0.12}
          />
        )}
      </Svg>
      {children}
    </View>
  );
}
