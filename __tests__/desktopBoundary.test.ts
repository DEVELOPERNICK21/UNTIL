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

const SRC = path.join(__dirname, '..', 'src');

/** What the desktop app may take from the phone code: pure kernel modules and feature domains. */
const ALLOWED_SHARED = /^@until\/(shared\/(time|types|utils|ports)(\/|$)|shared\/theme\/(progressColor|emotionalCopy|palettes)$|features\/[^/]+\/domain\/|assets\/|config\/)/;

const FORBIDDEN: Array<[RegExp, string]> = [
  [/^@until\/app(\/|$)/, 'phone app shell and composition root'],
  [/(^|\/)persistence(\/|$)/, 'phone persistence (MMKV)'],
  [/(^|\/)hooks(\/|$)/, 'phone hooks'],
  [/(^|\/)ui(\/|$)/, 'phone screens'],
  [/(^|\/)data(\/|$)/, 'phone data adapters'],
  [/(^|\/)services(\/|$)/, 'phone services'],
  [/^react-native($|-)|^@react-native/, 'React Native'],
];

function resolveInSrc(from: string, spec: string): string | null {
  const base = spec.startsWith('@until/')
    ? path.join(SRC, spec.slice('@until/'.length))
    : path.resolve(path.dirname(from), spec);
  for (const ext of ['', '.ts', '.tsx', '/index.ts', '/index.tsx']) {
    const candidate = base + ext;
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
  }
  return null;
}

/** Every package and file the desktop reaches through @until/*, following imports inside src/. */
function closureOfSharedImports(): { packages: Set<string>; files: Set<string> } {
  const packages = new Set<string>();
  const files = new Set<string>();
  const queue: string[] = [];
  for (const file of sourceFiles(DESKTOP)) {
    for (const match of fs.readFileSync(file, 'utf8').matchAll(IMPORT)) {
      if (match[1].startsWith('@until/')) {
        const target = resolveInSrc(file, match[1]);
        if (target) queue.push(target);
      }
    }
  }
  while (queue.length) {
    const file = queue.pop()!;
    if (files.has(file)) continue;
    files.add(file);
    for (const match of fs.readFileSync(file, 'utf8').matchAll(IMPORT)) {
      const spec = match[1];
      if (!spec.startsWith('.')) {
        packages.add(spec);
        continue;
      }
      const target = resolveInSrc(file, spec);
      if (target) queue.push(target);
    }
  }
  return { packages, files };
}

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

  it('takes only pure kernel modules and feature domains from the phone code', () => {
    const violations: string[] = [];
    for (const file of sourceFiles(DESKTOP)) {
      for (const match of fs.readFileSync(file, 'utf8').matchAll(IMPORT)) {
        const spec = match[1];
        if (spec.startsWith('@until/') && !ALLOWED_SHARED.test(spec)) {
          violations.push(`${path.relative(DESKTOP, file)} imports ${spec}`);
        }
      }
    }
    expect(violations).toEqual([]);
  });

  it('never pulls a package into the web build through the shared code it imports', () => {
    const { packages, files } = closureOfSharedImports();
    expect(files.size).toBeGreaterThan(0);
    expect([...packages]).toEqual([]);
  });
});
