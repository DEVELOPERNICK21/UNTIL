import fs from 'fs';
import path from 'path';

const DESKTOP = path.join(__dirname, '..', 'desktop');
const SKIP = new Set(['node_modules', 'dist', 'src-tauri']);

function sourceFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    if (SKIP.has(entry.name)) return [];
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(full);
    return /\.(ts|tsx)$/.test(entry.name) ? [full] : [];
  });
}

const IMPORT = /(?:from|import)\s*\(?\s*['"]([^'"]+)['"]/g;

const FORBIDDEN: Array<[RegExp, string]> = [
  [/(^|\/)src\/di$|^@until\/di$/, 'phone di.ts'],
  [/(^|\/)persistence(\/|$)/, 'phone persistence (MMKV)'],
  [/(^|\/)hooks(\/|$)/, 'phone hooks'],
  [/(^|\/)surfaces(\/|$)/, 'phone screens'],
  [/(^|\/)infrastructure(\/|$)/, 'phone infrastructure'],
  [/^react-native($|-)|^@react-native/, 'React Native'],
];

describe('desktop companion import boundary', () => {
  it('has source files to check', () => {
    expect(sourceFiles(DESKTOP).length).toBeGreaterThan(0);
  });

  it('does not import phone-only layers', () => {
    const violations: string[] = [];
    for (const file of sourceFiles(DESKTOP)) {
      const text = fs.readFileSync(file, 'utf8');
      for (const match of text.matchAll(IMPORT)) {
        const spec = match[1];
        for (const [pattern, what] of FORBIDDEN) {
          if (pattern.test(spec)) {
            violations.push(`${path.relative(DESKTOP, file)} imports ${spec} (${what})`);
          }
        }
      }
    }
    expect(violations).toEqual([]);
  });
});
