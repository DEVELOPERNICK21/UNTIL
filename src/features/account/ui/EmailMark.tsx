/**
 * Envelope glyph for the "Continue with email" button.
 */

import React from 'react';
import Svg, { Path, Rect } from 'react-native-svg';

export function EmailMark({ size = 20, color }: { size?: number; color: string }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      accessibilityElementsHidden
    >
      <Rect
        x={3}
        y={5}
        width={18}
        height={14}
        rx={3}
        stroke={color}
        strokeWidth={1.8}
        fill="none"
      />
      <Path
        d="M4 7.5l8 5.5 8-5.5"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}
