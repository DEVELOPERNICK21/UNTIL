import React from 'react';
import Svg, { Line, Rect } from 'react-native-svg';

/** Clipboard glyph on the Home "Tasks" button. */
export function TasksFabIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Rect
        x={5}
        y={3}
        width={14}
        height={18}
        rx={2}
        stroke="#FFFFFF"
        strokeWidth={2}
        fill="none"
      />
      <Line
        x1={8}
        y1={8}
        x2={16}
        y2={8}
        stroke="#FFFFFF"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <Line
        x1={8}
        y1={12}
        x2={16}
        y2={12}
        stroke="#FFFFFF"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <Line
        x1={8}
        y1={16}
        x2={14}
        y2={16}
        stroke="#FFFFFF"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </Svg>
  );
}
