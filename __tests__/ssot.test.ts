/**
 * SSOT guards: things that must be defined once stay defined once.
 *  - time-unit arithmetic lives in shared/time/constants.ts
 *  - the current time comes from the clock (shared/time/clock.ts), not `new Date()`
 *  - helpers shared by several features are not re-declared per feature
 */

import fs from 'fs';
import path from 'path';

const SRC = path.join(__dirname, '..', 'src');

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(ts|tsx)$/.test(entry.name) && !/\.d\.ts$/.test(entry.name)) out.push(full);
  }
  return out;
}

const files = walk(SRC).map(file => ({
  rel: path.relative(SRC, file).split(path.sep).join('/'),
  lines: fs.readFileSync(file, 'utf8').split('\n'),
}));

function offenders(test: (rel: string, line: string) => boolean): string[] {
  const found: string[] = [];
  for (const { rel, lines } of files) {
    lines.forEach((line, i) => {
      if (!/^\s*(\/\/|\*|\/\*)/.test(line) && test(rel, line)) found.push(`${rel}:${i + 1}: ${line.trim()}`);
    });
  }
  return found;
}

describe('single source of truth', () => {
  it('spells out day and hour arithmetic only in shared/time/constants.ts', () => {
    const bad = offenders(
      (rel, line) =>
        rel !== 'shared/time/constants.ts' &&
        /\b(24\s*\*\s*60\s*\*\s*60\s*\*\s*1000|60\s*\*\s*60\s*\*\s*1000|86_?400_?000|3_?600_?000)\b/.test(line),
    );
    expect(bad).toEqual([]);
  });

  it('does not redefine MS_PER_* or ONE_DAY_MS next to the constants', () => {
    const bad = offenders(
      (rel, line) =>
        rel !== 'shared/time/constants.ts' && /\bconst\s+(MS_PER_[A-Z]+|ONE_DAY_MS|ONE_HOUR_MS)\s*=/.test(line),
    );
    expect(bad).toEqual([]);
  });

  it('reads the current time through the clock in domain, data and shared/time', () => {
    const bad = offenders(
      (rel, line) =>
        /^(features\/[^/]+\/(domain|data)\/|shared\/time\/)/.test(rel) &&
        rel !== 'shared/time/clock.ts' &&
        rel !== 'shared/time/ClockAdapter.ts' &&
        /new Date\(\s*\)/.test(line),
    );
    expect(bad).toEqual([]);
  });

  it('builds day keys with the clock, not toISOString (which is UTC)', () => {
    const bad = offenders(
      (rel, line) =>
        // The streak-saver notification id is keyed by the UTC date on purpose: changing it would
        // orphan notifications that are already scheduled under the old id.
        rel !== 'features/presence/services/presenceStreakNotifications.ts' &&
        /toISOString\(\)\.slice\(0,\s*10\)/.test(line),
    );
    expect(bad).toEqual([]);
  });

  it('declares each shared helper once', () => {
    const bad = offenders((rel, line) => rel !== 'shared/utils/randomId.ts' && /function randomId\b/.test(line));
    expect(bad).toEqual([]);
  });
});
