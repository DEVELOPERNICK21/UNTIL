import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';
import { useTheme } from '../theme';
import type { PeriodGlyphKind } from './PeriodGlyph';

const MOTIF: Record<PeriodGlyphKind, string> = {
  day: '#34D399',
  month: '#FBBF24',
  year: '#FB923C',
  life: '#FB7185',
};

const SIZE = { w: 132, h: 108 };

interface PeriodCardBackdropProps {
  kind: PeriodGlyphKind;
}

/**
 * Corner motif only. Fixed pixel size so it cannot stretch the card.
 */
export function PeriodCardBackdrop({ kind }: PeriodCardBackdropProps) {
  const theme = useTheme();
  const isLight = theme.statusBarStyle === 'dark-content';
  const color = MOTIF[kind];
  const wash = isLight ? 0.08 : 0.12;
  const ink = isLight ? 0.12 : 0.16;

  return (
    <View style={styles.wrap} pointerEvents="none" accessibilityElementsHidden>
      <Svg width={SIZE.w} height={SIZE.h} viewBox={`0 0 ${SIZE.w} ${SIZE.h}`}>
        <Circle cx={108} cy={64} r={52} fill={color} fillOpacity={wash} />
        {kind === 'day' ? <DayMotif color={color} opacity={ink} /> : null}
        {kind === 'month' ? <MonthMotif color={color} opacity={ink} /> : null}
        {kind === 'year' ? <YearMotif color={color} opacity={ink} /> : null}
        {kind === 'life' ? <LifeMotif color={color} opacity={ink} /> : null}
      </Svg>
    </View>
  );
}

function DayMotif({ color, opacity }: { color: string; opacity: number }) {
  return (
    <G>
      <Circle cx={96} cy={64} r={18} fill={color} fillOpacity={opacity} />
      <Path
        d="M96 34v8M96 86v8M66 64h8M118 64h8M75 43l6 6M111 79l6 6M75 85l6-6M111 49l6-6"
        stroke={color}
        strokeOpacity={opacity}
        strokeWidth={2.5}
        strokeLinecap="round"
      />
    </G>
  );
}

function MonthMotif({ color, opacity }: { color: string; opacity: number }) {
  const cells = [];
  for (let r = 0; r < 3; r += 1) {
    for (let c = 0; c < 4; c += 1) {
      cells.push(
        <Rect
          key={`${r}-${c}`}
          x={52 + c * 16}
          y={40 + r * 16}
          width={11}
          height={11}
          rx={2}
          fill={color}
          fillOpacity={opacity * (r === 0 && c < 2 ? 1 : 0.5)}
        />,
      );
    }
  }
  return (
    <G>
      <Rect
        x={44}
        y={24}
        width={72}
        height={70}
        rx={8}
        fill={color}
        fillOpacity={opacity * 0.25}
      />
      <Path
        d="M54 24v10M106 24v10M44 40h72"
        stroke={color}
        strokeOpacity={opacity}
        strokeWidth={1.75}
        strokeLinecap="round"
      />
      {cells}
    </G>
  );
}

function YearMotif({ color, opacity }: { color: string; opacity: number }) {
  const dots = [];
  for (let r = 0; r < 5; r += 1) {
    for (let c = 0; c < 7; c += 1) {
      dots.push(
        <Circle
          key={`${r}-${c}`}
          cx={48 + c * 11}
          cy={28 + r * 14}
          r={2.1}
          fill={color}
          fillOpacity={opacity * (c + r < 5 ? 1 : 0.4)}
        />,
      );
    }
  }
  return <G>{dots}</G>;
}

function LifeMotif({ color, opacity }: { color: string; opacity: number }) {
  return (
    <Path
      d="M96 92s-28-18-28-36c0-10 8-17 17-17 6 0 10 3 12 6.5 2-3.5 6-6.5 12-6.5 9 0 17 7 17 17 0 18-28 36-28 36z"
      fill={color}
      fillOpacity={opacity}
    />
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: SIZE.w,
    height: SIZE.h,
  },
});
