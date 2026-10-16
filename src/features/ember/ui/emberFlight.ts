/**
 * Unique Ember flight styles — rotate so travel never feels copy-paste.
 */

export type EmberFlightStyle =
  | 'arc'
  | 'spiral'
  | 'cascade'
  | 'zip'
  | 'drift'
  | 'comet';

export type EmberExitStyle = 'fadeUp' | 'swirl' | 'pop' | 'slideAway';

export type EmberFlightPlan = {
  style: EmberFlightStyle;
  startX: number;
  startY: number;
  midX: number;
  midY: number;
  /** Final spin value mapped in UI (−1…1 → degrees). */
  spinTo: number;
  durationMs: number;
  trail: 'soft' | 'bright' | 'spark';
};

export type EmberExitPlan = {
  style: EmberExitStyle;
  endX: number;
  endY: number;
  spinTo: number;
  durationMs: number;
};

const ENTER_STYLES: EmberFlightStyle[] = [
  'arc',
  'spiral',
  'cascade',
  'zip',
  'drift',
  'comet',
];

const EXIT_STYLES: EmberExitStyle[] = ['fadeUp', 'swirl', 'pop', 'slideAway'];

let enterCursor = 0;
let exitCursor = 0;
let lastEnter: EmberFlightStyle | null = null;
let lastExit: EmberExitStyle | null = null;

function nextEnterStyle(): EmberFlightStyle {
  let style = ENTER_STYLES[enterCursor % ENTER_STYLES.length];
  enterCursor += 1;
  if (style === lastEnter) {
    style = ENTER_STYLES[enterCursor % ENTER_STYLES.length];
    enterCursor += 1;
  }
  lastEnter = style;
  return style;
}

function nextExitStyle(): EmberExitStyle {
  let style = EXIT_STYLES[exitCursor % EXIT_STYLES.length];
  exitCursor += 1;
  if (style === lastExit) {
    style = EXIT_STYLES[exitCursor % EXIT_STYLES.length];
    exitCursor += 1;
  }
  lastExit = style;
  return style;
}

export function planEmberEnter(screenW: number): EmberFlightPlan {
  const style = nextEnterStyle();
  switch (style) {
    case 'arc':
      return {
        style,
        startX: screenW * 0.35,
        startY: 120,
        midX: screenW * 0.08,
        midY: -56,
        spinTo: 0.35,
        durationMs: 680,
        trail: 'soft',
      };
    case 'spiral':
      return {
        style,
        startX: -screenW * 0.4,
        startY: 40,
        midX: screenW * 0.12,
        midY: -24,
        spinTo: 1,
        durationMs: 720,
        trail: 'spark',
      };
    case 'cascade':
      return {
        style,
        startX: 20,
        startY: -160,
        midX: -10,
        midY: 36,
        spinTo: -0.2,
        durationMs: 640,
        trail: 'soft',
      };
    case 'zip':
      return {
        style,
        startX: screenW * 0.55,
        startY: 16,
        midX: -28,
        midY: 8,
        spinTo: 0.15,
        durationMs: 520,
        trail: 'bright',
      };
    case 'drift':
      return {
        style,
        startX: -screenW * 0.25,
        startY: 70,
        midX: -screenW * 0.05,
        midY: -18,
        spinTo: 0.08,
        durationMs: 780,
        trail: 'soft',
      };
    case 'comet':
    default:
      return {
        style: 'comet',
        startX: screenW * 0.2,
        startY: -100,
        midX: screenW * 0.15,
        midY: 20,
        spinTo: 0.7,
        durationMs: 700,
        trail: 'spark',
      };
  }
}

export function planEmberExit(screenW: number): EmberExitPlan {
  const style = nextExitStyle();
  switch (style) {
    case 'fadeUp':
      return {
        style,
        endX: -screenW * 0.05,
        endY: -130,
        spinTo: 0.2,
        durationMs: 380,
      };
    case 'swirl':
      return {
        style,
        endX: -screenW * 0.35,
        endY: -40,
        spinTo: -0.9,
        durationMs: 420,
      };
    case 'pop':
      return {
        style,
        endX: 24,
        endY: 50,
        spinTo: 0.4,
        durationMs: 300,
      };
    case 'slideAway':
    default:
      return {
        style: 'slideAway',
        endX: screenW * 0.4,
        endY: -20,
        spinTo: 0.25,
        durationMs: 360,
      };
  }
}
