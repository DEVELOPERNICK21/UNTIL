/**
 * Progress color scale — SSOT for "where you are" in time.
 * Start (green) → middle (amber) → end (red). Bright, clear progression.
 */

export const PROGRESS_COLOR_START = '#22C55E'; // bright green — start of period
export const PROGRESS_COLOR_MID = '#F59E0B';   // bright amber — middle
export const PROGRESS_COLOR_END = '#EF4444';   // clear red — end of period

function parseHex(hex: string): [number, number, number] {
  const n = hex.replace('#', '');
  const r = parseInt(n.slice(0, 2), 16);
  const g = parseInt(n.slice(2, 4), 16);
  const b = parseInt(n.slice(4, 6), 16);
  return [r, g, b];
}

function toHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((x) => Math.round(x).toString(16).padStart(2, '0')).join('');
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpHex(hex1: string, hex2: string, t: number): string {
  const [r1, g1, b1] = parseHex(hex1);
  const [r2, g2, b2] = parseHex(hex2);
  const t2 = Math.max(0, Math.min(1, t));
  return toHex(
    lerp(r1, r2, t2),
    lerp(g1, g2, t2),
    lerp(b1, b2, t2)
  );
}

/**
 * Returns a color for the given progress (0–1).
 * 0 = green, 0.5 = orange, 1 = red. Interpolated in between.
 */
export function getProgressColor(progress: number): string {
  const p = Math.max(0, Math.min(1, progress));
  if (p <= 0.5) {
    return lerpHex(PROGRESS_COLOR_START, PROGRESS_COLOR_MID, p * 2);
  }
  return lerpHex(PROGRESS_COLOR_MID, PROGRESS_COLOR_END, (p - 0.5) * 2);
}
