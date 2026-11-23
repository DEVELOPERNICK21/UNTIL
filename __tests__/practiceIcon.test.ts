import { breathCurvePath } from '../src/features/pause/ui/practiceIcon';
import { BREATH_TECHNIQUES, type BreathTechniqueId } from '../src/features/pause/domain/breathing';

const IDS = Object.keys(BREATH_TECHNIQUES) as BreathTechniqueId[];
const pts = (d: string) => d.split(/(?=[ML])/).map(p => p.slice(1).trim().split(' ').map(Number));

describe('breathCurvePath', () => {
  it.each(IDS)('%s starts at the bottom left and ends at the bottom right, inside the box', id => {
    const p = pts(breathCurvePath(id, 24, 3));
    expect(p[0]).toEqual([3, 21]);
    expect(p[p.length - 1][0]).toBeCloseTo(21, 1);
    expect(p[p.length - 1][1]).toBeCloseTo(21, 1);
    p.forEach(([x, y]) => {
      expect(x).toBeGreaterThanOrEqual(2.99);
      expect(x).toBeLessThanOrEqual(21.01);
      expect(y).toBeGreaterThanOrEqual(2.99);
      expect(y).toBeLessThanOrEqual(21.01);
    });
  });

  it('draws a hold as a level line at the top', () => {
    const box = pts(breathCurvePath('box', 24, 3));
    const top = box.filter(([, y]) => Math.abs(y - 3) < 0.01);
    expect(top.length).toBeGreaterThanOrEqual(2);
    expect(top[top.length - 1][0] - top[0][0]).toBeGreaterThan(3);
  });

  it('gives every practice a different shape', () => {
    expect(new Set(IDS.map(id => breathCurvePath(id, 24, 3))).size).toBe(IDS.length);
  });
});
