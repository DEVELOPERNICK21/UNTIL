/**
 * SSOT guard: every STORAGE_KEYS entry is read/written by exactly one module.
 * Other code gets the value through that module (repository, use case or injected source).
 */
import * as fs from 'fs';
import * as path from 'path';

const SRC = path.join(__dirname, '..', 'src');

/** Modules that legitimately touch keys they do not own. */
const EXEMPT = new Set([
  'persistence/schema.ts', // defines the keys
  'persistence/migration.ts', // rewrites old keys on upgrade
  'types/widgetDataContract.ts', // key names shared with native widgets
]);

function sourceFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(full);
    return /\.tsx?$/.test(entry.name) ? [full] : [];
  });
}

function keyOwners(): Map<string, Set<string>> {
  const owners = new Map<string, Set<string>>();
  for (const file of sourceFiles(SRC)) {
    const rel = path.relative(SRC, file).split(path.sep).join('/');
    if (EXEMPT.has(rel)) continue;
    const text = fs.readFileSync(file, 'utf8');
    for (const [, key] of text.matchAll(/STORAGE_KEYS\.([A-Z0-9_]+)/g)) {
      if (!owners.has(key)) owners.set(key, new Set());
      owners.get(key)!.add(rel);
    }
  }
  return owners;
}

describe('storage key ownership', () => {
  it('each storage key is used by a single module', () => {
    const shared = [...keyOwners()]
      .filter(([, files]) => files.size > 1)
      .map(([key, files]) => `${key}: ${[...files].sort().join(', ')}`);
    expect(shared).toEqual([]);
  });
});
