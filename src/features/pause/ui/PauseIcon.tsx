import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface Props {
  size?: number;
  color: string;
}

/** Three lines of moving air, each curling at the end: breath. Drawn to match the outline icons beside it. */
export function PauseIcon({ size = 19, color }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 8.5h9a2.6 2.6 0 1 0-2.4-3.6"
        stroke={color}
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M3 12.5h15a2.6 2.6 0 1 1-2.4 3.6"
        stroke={color}
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M5 16.5h5.5a2.6 2.6 0 1 1-2.4 3.6"
        stroke={color}
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
