/** A smooth sine wave as an SVG path, `periods` whole waves across `width`, so two copies side by side loop seamlessly. */
export function wavePath(width: number, baseY: number, amplitude: number, periods: number): string {
  const steps = Math.max(8, Math.round(width / 6));
  const points: string[] = [];
  for (let i = 0; i <= steps; i += 1) {
    const x = (width * i) / steps;
    const y = baseY + amplitude * Math.sin((2 * Math.PI * periods * i) / steps);
    points.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(2)}`);
  }
  return points.join(' ');
}
