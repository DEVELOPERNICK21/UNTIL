import {
  computeDotsGridLayout,
  DOT_CELL_W,
  DOT_RADIUS,
  dotCenter,
} from '../src/ui/periodDotsLayout';

describe('periodDotsLayout', () => {
  it('computes columns from width and cell size', () => {
    const layout = computeDotsGridLayout(100, DOT_CELL_W * 10);
    expect(layout.cols).toBe(10);
    expect(layout.rows).toBe(10);
    expect(layout.height).toBe(120);
  });

  it('handles zero width / zero count', () => {
    expect(computeDotsGridLayout(100, 0)).toEqual({
      cols: 0,
      rows: 0,
      height: 0,
    });
    expect(computeDotsGridLayout(0, 200)).toEqual({
      cols: 0,
      rows: 0,
      height: 0,
    });
  });

  it('places first and second dots on the first row', () => {
    expect(dotCenter(0, 10)).toEqual({ x: DOT_RADIUS + 2, y: DOT_RADIUS + 3 });
    expect(dotCenter(1, 10).y).toBe(dotCenter(0, 10).y);
    expect(dotCenter(1, 10).x).toBeGreaterThan(dotCenter(0, 10).x);
  });
});
