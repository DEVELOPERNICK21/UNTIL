/** Layout math for period dots grid (life weeks / year days). */

export const DOT_SIZE = 6;
export const DOT_RADIUS = DOT_SIZE / 2;
export const DOT_MARGIN_H = 2;
export const DOT_MARGIN_V = 3;
export const DOT_CELL_W = DOT_SIZE + DOT_MARGIN_H * 2;
export const DOT_CELL_H = DOT_SIZE + DOT_MARGIN_V * 2;

export type DotsGridLayout = {
  cols: number;
  rows: number;
  height: number;
};

export function computeDotsGridLayout(
  totalCount: number,
  width: number,
): DotsGridLayout {
  const safeTotal = Math.max(0, totalCount);
  if (width <= 0 || safeTotal === 0) {
    return { cols: 0, rows: 0, height: 0 };
  }
  const cols = Math.max(1, Math.floor(width / DOT_CELL_W));
  const rows = Math.ceil(safeTotal / cols);
  return { cols, rows, height: rows * DOT_CELL_H };
}

export function dotCenter(
  index: number,
  cols: number,
): { x: number; y: number } {
  const col = index % cols;
  const row = Math.floor(index / cols);
  return {
    x: col * DOT_CELL_W + DOT_MARGIN_H + DOT_RADIUS,
    y: row * DOT_CELL_H + DOT_MARGIN_V + DOT_RADIUS,
  };
}
