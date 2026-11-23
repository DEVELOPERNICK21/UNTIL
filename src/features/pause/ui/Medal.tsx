import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import type { MilestoneId } from '../domain/pauseProgress';
import { CALM } from './calmPalette';

const GLYPH: Record<MilestoneId, string> = {
  first: 'M12 5c4 3 6 7 0 14C6 12 8 8 12 5z',
  five: 'M5 12c2-4 4-4 6 0s4 4 6 0 2-2 3-1',
  ten: 'M12 6.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11zm0 3a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z',
  explorer: 'M12 4.5l3.2 7.5-3.2 7.5-3.2-7.5z',
  week: 'M7 12h.01M12 12h.01M17 12h.01',
  night: 'M15 5a7 7 0 1 0 4 11 5.5 5.5 0 0 1-4-11z',
};

interface Props {
  id: MilestoneId;
  earned: boolean;
  size?: number;
}

/** A round medal: lit when earned, a quiet outline when not yet. */
export function Medal({ id, earned, size = 56 }: Props) {
  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Circle
          cx="12"
          cy="12"
          r="11"
          fill={earned ? CALM.cardSelected : 'transparent'}
          stroke={earned ? CALM.accent : CALM.cardBorder}
          strokeWidth={earned ? 1.2 : 1}
          strokeDasharray={earned ? undefined : '2 2.4'}
        />
        <Path
          d={GLYPH[id]}
          stroke={earned ? CALM.accent : CALM.textMuted}
          strokeWidth={id === 'week' ? 2.6 : 1.4}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill={earned && id === 'night' ? CALM.accent : 'none'}
          opacity={earned ? 1 : 0.6}
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
