/**
 * Small line icons for the device list: phone, tablet and computer.
 */

import React from 'react';
import Svg, { Path, Rect } from 'react-native-svg';
import type { DeviceKind } from '../domain/deviceList';

export function DeviceGlyph({
  kind,
  color,
  size = 20,
}: {
  kind: DeviceKind;
  color: string;
  size?: number;
}) {
  const stroke = { stroke: color, strokeWidth: 1.8, fill: 'none' } as const;
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {kind === 'phone' ? (
        <>
          <Rect x={7} y={3} width={10} height={18} rx={2.5} {...stroke} />
          <Path d="M11 18h2" {...stroke} strokeLinecap="round" />
        </>
      ) : kind === 'tablet' ? (
        <>
          <Rect x={4} y={3} width={16} height={18} rx={2.5} {...stroke} />
          <Path d="M11 18h2" {...stroke} strokeLinecap="round" />
        </>
      ) : (
        <>
          <Rect x={3} y={5} width={18} height={11} rx={2} {...stroke} />
          <Path d="M8 20h8M12 16v4" {...stroke} strokeLinecap="round" />
        </>
      )}
    </Svg>
  );
}
