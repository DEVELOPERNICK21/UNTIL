import { BREATH_TECHNIQUES, cycleMs, type BreathTechniqueId } from '../domain/breathing';

/**
 * The shape of one breath as an SVG path in a `size` square: it rises as the lungs fill, stays level on a
 * hold, falls as they empty. So each practice's icon is its own rhythm, and the six are easy to tell apart.
 */
export function breathCurvePath(id: BreathTechniqueId, size: number, inset = 0): string {
  const phases = BREATH_TECHNIQUES[id];
  const total = cycleMs(id);
  const width = size - inset * 2;
  const height = size - inset * 2;
  const point = (ms: number, fullness: number) =>
    `${(inset + (width * ms) / total).toFixed(2)} ${(inset + height * (1 - fullness)).toFixed(2)}`;

  let elapsed = 0;
  const parts = [`M${point(0, 0)}`];
  phases.forEach(phase => {
    const steps = phase.from === phase.to ? 1 : 8;
    for (let i = 1; i <= steps; i += 1) {
      const t = i / steps;
      const eased = (1 - Math.cos(Math.PI * t)) / 2;
      parts.push(`L${point(elapsed + phase.ms * t, phase.from + (phase.to - phase.from) * eased)}`);
    }
    elapsed += phase.ms;
  });
  return parts.join(' ');
}
