import React from 'react';
import { Text } from '../../../shared/ui/Text';
import { CALM } from './calmPalette';

type Tone = 'primary' | 'secondary' | 'muted' | 'accent' | 'warm';

const COLORS: Record<Tone, string> = {
  primary: CALM.text,
  secondary: CALM.textSecondary,
  muted: CALM.textMuted,
  accent: CALM.accent,
  warm: CALM.warm,
};

type Props = React.ComponentProps<typeof Text> & { tone?: Tone };

/** The app's text, in Pause's colours. The app's own text colours follow its theme, which would not read on a dark teal sky. */
export function CalmText({ variant = 'body', tone = 'primary', style, ...rest }: Props) {
  return <Text variant={variant} style={[{ color: COLORS[tone] }, style]} {...rest} />;
}
