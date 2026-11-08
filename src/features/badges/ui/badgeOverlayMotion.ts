import type { Animated } from 'react-native';
import type { ThemePalette } from '../../../shared/theme';

interface OverlayValues {
  backdrop: Animated.Value;
  card: Animated.Value;
  flip: Animated.Value;
  reveal: Animated.Value;
}

/** Animated styles of the unlock overlay: backdrop fade, card rise, medal flip and text reveal. */
export function overlayStyles(
  { backdrop, card, flip, reveal }: OverlayValues,
  theme: ThemePalette,
) {
  const backdropStyle = { opacity: backdrop };
  const cardStyle = {
    backgroundColor: theme.cardBase,
    borderColor: theme.glassBorder,
    opacity: card,
    transform: [
      {
        translateY: card.interpolate({
          inputRange: [0, 1],
          outputRange: [36, 0],
        }),
      },
      {
        scale: card.interpolate({
          inputRange: [0, 1],
          outputRange: [0.9, 1],
        }),
      },
    ],
  };
  const medalStyle = {
    opacity: flip.interpolate({
      inputRange: [0, 0.25, 1],
      outputRange: [0, 1, 1],
    }),
    transform: [
      { perspective: 700 },
      {
        rotateY: flip.interpolate({
          inputRange: [0, 1],
          outputRange: ['-100deg', '0deg'],
        }),
      },
      {
        scale: flip.interpolate({
          inputRange: [0, 1],
          outputRange: [0.6, 1],
        }),
      },
    ],
  };
  const textStyle = {
    opacity: reveal,
    transform: [
      {
        translateY: reveal.interpolate({
          inputRange: [0, 1],
          outputRange: [10, 0],
        }),
      },
    ],
  };
  const buttonStyle = { backgroundColor: theme.percent };
  return { backdropStyle, cardStyle, medalStyle, textStyle, buttonStyle };
}
