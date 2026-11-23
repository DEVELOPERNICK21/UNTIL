import { wavePath } from '../src/features/pause/ui/wavePath';

describe('wavePath', () => {
  const points = (d: string) => d.split(/(?=[ML])/).map(p => p.slice(1).split(' ').map(Number));

  it('draws one path from the left edge to the right edge', () => {
    const d = wavePath(600, 50, 10, 3);
    expect(d.startsWith('M0.0')).toBe(true);
    const pts = points(d);
    expect(pts[0][0]).toBe(0);
    expect(pts[pts.length - 1][0]).toBeCloseTo(600, 0);
  });

  it('stays within the amplitude around its base line', () => {
    points(wavePath(600, 50, 10, 3)).forEach(([, y]) => {
      expect(y).toBeGreaterThanOrEqual(39.9);
      expect(y).toBeLessThanOrEqual(60.1);
    });
  });

  it('ends where it starts, so two copies side by side loop without a seam', () => {
    const pts = points(wavePath(800, 46, 11, 4));
    expect(pts[pts.length - 1][1]).toBeCloseTo(pts[0][1], 1);
  });

  it('is flat with no amplitude', () => {
    points(wavePath(300, 20, 0, 2)).forEach(([, y]) => expect(y).toBeCloseTo(20, 5));
  });
});
