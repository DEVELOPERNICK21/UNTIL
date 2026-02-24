import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { Text } from './Text';

export interface BarDataPoint {
  label: string;
  value: number;
  value2?: number;
}

const VIEWBOX_WIDTH = 400;
const VIEWBOX_HEIGHT = 220;
const MARGIN_LEFT = 48;
const MARGIN_RIGHT = 24;
const MARGIN_TOP = 16;
const MARGIN_BOTTOM = 36;
const PLOT_WIDTH = VIEWBOX_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;
const PLOT_HEIGHT = VIEWBOX_HEIGHT - MARGIN_TOP - MARGIN_BOTTOM;

interface BarChartProps {
  data: BarDataPoint[];
  width: number;
  barColor?: string;
  barColor2?: string;
  maxValue?: number;
  showLegend?: boolean;
}

export function BarChart({
  data,
  width,
  barColor = '#34C759',
  barColor2 = '#E9A23A',
  maxValue: maxValueProp,
  showLegend = true,
}: BarChartProps) {
  const maxVal = maxValueProp ?? Math.max(1, ...data.map((d) => d.value + (d.value2 ?? 0)));
  const count = Math.max(1, data.length);
  const barGap = 8;
  const barWidth = Math.max(12, (PLOT_WIDTH - barGap * (count - 1)) / count);

  return (
    <View style={[styles.wrap, { width }]}>
      <Svg
        width={width}
        height={(width / VIEWBOX_WIDTH) * VIEWBOX_HEIGHT}
        viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
        style={styles.svg}
      >
        {data.map((point, i) => {
          const total = point.value + (point.value2 ?? 0);
          const x = MARGIN_LEFT + i * (barWidth + barGap);
          const h1 = maxVal > 0 ? (point.value / maxVal) * PLOT_HEIGHT : 0;
          const h2 = maxVal > 0 && point.value2 != null ? (point.value2 / maxVal) * PLOT_HEIGHT : 0;
          const y1 = MARGIN_TOP + PLOT_HEIGHT - h1 - h2;
          const y2 = MARGIN_TOP + PLOT_HEIGHT - h2;

          return (
            <React.Fragment key={i}>
              {point.value2 != null && point.value2 > 0 && (
                <Rect
                  x={x}
                  y={y2}
                  width={barWidth}
                  height={h2}
                  rx={4}
                  ry={4}
                  fill={barColor2}
                />
              )}
              <Rect
                x={x}
                y={y1}
                width={barWidth}
                height={h1}
                rx={4}
                ry={4}
                fill={barColor}
              />
            </React.Fragment>
          );
        })}
      </Svg>
      <View style={styles.labelsRow}>
        {data.map((point, i) => (
          <View
            key={i}
            style={[
              styles.labelSlot,
              { width: `${100 / count}%` },
            ]}
          >
            <Text
              variant="caption"
              color="secondary"
              style={styles.label}
              numberOfLines={1}
            >
              {point.label}
            </Text>
          </View>
        ))}
      </View>
      {showLegend && (
        <View style={styles.legend}>
          <View style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: barColor }]} />
            <Text variant="caption" color="secondary">Done</Text>
          </View>
          <View style={[styles.legendRow, styles.legendRowRight]}>
            <View style={[styles.legendDot, { backgroundColor: barColor2 }]} />
            <Text variant="caption" color="secondary">Pending</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {},
  svg: {},
  labelsRow: {
    flexDirection: 'row',
    marginTop: 8,
    paddingHorizontal: 2,
  },
  labelSlot: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    textAlign: 'center',
  },
  legend: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 16,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendRowRight: {
    marginLeft: 8,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
});
