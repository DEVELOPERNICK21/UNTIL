import { msUntilNext } from '../desktop/src/useNow';

describe('msUntilNext', () => {
  it('lands just after the next whole second', () => {
    const t = 1_000_000_000_250;
    const wait = msUntilNext(1000, t);
    expect(wait).toBe(758);
    expect((t + wait) % 1000).toBe(8);
  });

  it('waits a full step when it is already on the beat, not zero', () => {
    expect(msUntilNext(1000, 5_000)).toBe(1008);
    expect(msUntilNext(60_000, 120_000)).toBe(60_008);
  });

  it('lands just after the next whole minute', () => {
    const t = 1_700_000_000_000 + 37_500;
    const wait = msUntilNext(60_000, t);
    expect((t + wait) % 60_000).toBe(8);
    expect(wait).toBeGreaterThan(0);
    expect(wait).toBeLessThanOrEqual(60_008);
  });

  it('never waits a negative or absurd time', () => {
    for (let i = 0; i < 200; i++) {
      const t = Math.floor(Math.random() * 2_000_000_000_000);
      const w = msUntilNext(1000, t);
      expect(w).toBeGreaterThan(0);
      expect(w).toBeLessThanOrEqual(1008);
    }
  });
});
