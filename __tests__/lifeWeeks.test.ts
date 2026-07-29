import {
  LIFE_WEEKS_DOT_CAP,
  WEEKS_PER_YEAR,
  computeLifeWeeks,
} from '../src/core/time/lifeWeeks';

describe('computeLifeWeeks', () => {
  it('computes total and lived weeks from deathAge and remaining days', () => {
    const deathAge = 80;
    const totalWeeks = Math.round(deathAge * WEEKS_PER_YEAR);
    const remainingDaysLife = 7 * 100; // 100 weeks left
    const result = computeLifeWeeks(deathAge, remainingDaysLife);
    expect(result.totalWeeks).toBe(totalWeeks);
    expect(result.livedWeeks).toBe(totalWeeks - 100);
    expect(result.renderWeeks).toBe(Math.min(totalWeeks, LIFE_WEEKS_DOT_CAP));
  });

  it('treats missing remainingDaysLife as zero remaining weeks (all lived up to total)', () => {
    const result = computeLifeWeeks(80, undefined);
    expect(result.livedWeeks).toBe(result.totalWeeks);
  });

  it('clamps lived weeks to [0, total]', () => {
    expect(computeLifeWeeks(80, -100).livedWeeks).toBeGreaterThanOrEqual(0);
    const over = computeLifeWeeks(10, 999999);
    expect(over.livedWeeks).toBe(0);
  });

  it('caps renderWeeks at LIFE_WEEKS_DOT_CAP', () => {
    const result = computeLifeWeeks(200, 0);
    expect(result.totalWeeks).toBeGreaterThan(LIFE_WEEKS_DOT_CAP);
    expect(result.renderWeeks).toBe(LIFE_WEEKS_DOT_CAP);
  });
});
