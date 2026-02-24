import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Text } from './Text';

export interface PieSegment {
  value: number;
  color: string;
  label?: string;
}

const VIEWBOX_SIZE = 100;

interface PieChartProps {
  data: PieSegment[];
  size: number;
  strokeWidth?: number;
  innerRadiusPercent?: number;
  showLegend?: boolean;
  segmentGap?: number;
}

function polarToCartesian(cx: number, cy: number, r: number, angleRad: number) {
  return {
    x: cx + r * Math.cos(angleRad),
    y: cy + r * Math.sin(angleRad),
  };
}

function describeArc(
  cx: number,
  cy: number,
  rOuter: number,
  rInner: number,
  startAngleRad: number,
  endAngleRad: number
): string {
  const startOuter = polarToCartesian(cx, cy, rOuter, startAngleRad);
  const endOuter = polarToCartesian(cx, cy, rOuter, endAngleRad);
  const startInner = polarToCartesian(cx, cy, rInner, startAngleRad);
  const endInner = polarToCartesian(cx, cy, rInner, endAngleRad);
  const largeArc = endAngleRad - startAngleRad <= Math.PI ? 0 : 1;
  return [
    'M', startOuter.x, startOuter.y,
    'A', rOuter, rOuter, 0, largeArc, 1, endOuter.x, endOuter.y,
    'L', endInner.x, endInner.y,
    'A', rInner, rInner, 0, largeArc, 0, startInner.x, startInner.y,
    'Z',
  ].join(' ');
}

function describeArcFull(
  cx: number,
  cy: number,
  r: number,
  startAngleRad: number,
  endAngleRad: number
): string {
  const start = polarToCartesian(cx, cy, r, endAngleRad);
  const end = polarToCartesian(cx, cy, r, startAngleRad);
  const largeArc = endAngleRad - startAngleRad <= Math.PI ? 0 : 1;
  return [
    'M', cx, cy,
    'L', start.x, start.y,
    'A', r, r, 0, largeArc, 1, end.x, end.y,
    'Z',
  ].join(' ');
}

export function PieChart({
  data,
  size,
  strokeWidth = 0,
  innerRadiusPercent = 0,
  showLegend = false,
  segmentGap = 0.5,
}: PieChartProps) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) {
    return (
      <View style={[styles.wrap, { width: size, minHeight: size }]}>
        <Svg width={size} height={size} viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`}>
          <Path
            d={describeArcFull(50, 50, 45, 0, 2 * Math.PI)}
            fill="#2A2A2A"
          />
        </Svg>
      </View>
    );
  }

  const cx = VIEWBOX_SIZE / 2;
  const cy = VIEWBOX_SIZE / 2;
  const rOuter = VIEWBOX_SIZE / 2 - 2;
  const rInner = innerRadiusPercent > 0 ? rOuter * (innerRadiusPercent / 100) : 0;
  const gapRad = (segmentGap * Math.PI) / 180;
  let startAngle = -Math.PI / 2;

  return (
    <View style={[styles.wrap, { width: size }]}>
      <Svg
        width={size}
        height={size}
        viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`}
        style={styles.svg}
      >
        {data.map((segment, i) => {
          const sweep = (segment.value / total) * (2 * Math.PI) - gapRad;
          const endAngle = startAngle + Math.max(0, sweep);
          const d =
            rInner > 0
              ? describeArc(cx, cy, rOuter, rInner, startAngle, endAngle)
              : describeArcFull(cx, cy, rOuter, startAngle, endAngle);
          startAngle = endAngle + gapRad;
          return (
            <Path
              key={i}
              d={d}
              fill={segment.color}
              stroke={strokeWidth > 0 ? '#0E0E10' : undefined}
              strokeWidth={strokeWidth * (VIEWBOX_SIZE / size)}
            />
          );
        })}
      </Svg>
      {showLegend && data.some((d) => d.label) && (
        <View style={styles.legend}>
          {data.map((segment, i) => (
            <View key={i} style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: segment.color }]} />
              <Text variant="caption" color="secondary" numberOfLines={1} style={styles.legendText}>
                {segment.label ?? `Segment ${i + 1}`}
                {total > 0 && ` (${Math.round((segment.value / total) * 100)}%)`}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {},
  svg: {},
  legend: {
    marginTop: 12,
    gap: 6,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  legendText: {
    flex: 1,
  },
});
