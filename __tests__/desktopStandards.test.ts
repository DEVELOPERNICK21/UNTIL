/**
 * Desktop standards that can be checked without running the app (see desktop/STANDARDS.md):
 * contrast of the text colours, the Content Security Policy, the install defaults, and
 * the least-privilege capability files.
 */

import fs from 'fs';
import path from 'path';

const DESKTOP = path.join(__dirname, '..', 'desktop');
const read = (rel: string) => fs.readFileSync(path.join(DESKTOP, rel), 'utf8');
const conf = JSON.parse(read('src-tauri/tauri.conf.json'));

function luminance(hex: string): number {
  const channel = (i: number) => {
    const c = parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(0) + 0.7152 * channel(1) + 0.0722 * channel(2);
}
function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
function token(css: string, name: string): string {
  const match = css.match(new RegExp(`${name}:\\s*(#[0-9a-fA-F]{6})`));
  if (!match) throw new Error(`token ${name} not found`);
  return match[1];
}

describe('desktop: readable text (WCAG AA, 4.5:1)', () => {
  const css = read('src/panel.css');
  const [dark, light] = css.split('@media (prefers-color-scheme: light)');

  it.each(['--text', '--text-2', '--text-3'])('%s on the dark panel', name => {
    expect(contrast(token(dark, name), token(dark, '--bg-solid'))).toBeGreaterThanOrEqual(4.5);
  });

  it.each(['--text', '--text-2', '--text-3'])('%s on the light panel', name => {
    expect(contrast(token(light, name), token(light, '--bg-solid'))).toBeGreaterThanOrEqual(4.5);
  });
});

describe('desktop: Content Security Policy', () => {
  const csp = conf.app.security.csp;

  it('is set, and starts from same-origin', () => {
    expect(csp).toBeTruthy();
    expect(csp['default-src']).toBe("'self'");
  });

  it('allows no remote script, no plugins and no base-tag hijack', () => {
    expect(csp['script-src']).toBe("'self'");
    expect(csp['object-src']).toBe("'none'");
    expect(csp['base-uri']).toBe("'self'");
  });

  it('reaches only the Tauri bridge and the Google endpoints Firebase needs', () => {
    const hosts = String(csp['connect-src']).split(/\s+/);
    for (const host of hosts) {
      expect(host).toMatch(/^('self'|ipc:|http:\/\/ipc\.localhost|https:\/\/(firestore|identitytoolkit|securetoken|www)\.googleapis\.com)$/);
    }
  });

  it('keeps the loose development policy out of the release policy', () => {
    expect(JSON.stringify(csp)).not.toMatch(/unsafe-eval|localhost:1420/);
  });
});

describe('desktop: installers', () => {
  it('installs per user, so no administrator prompt', () => {
    expect(conf.bundle.windows.nsis.installMode).toBe('currentUser');
  });

  it('keeps the hardened runtime on for notarization and declares the minimum macOS', () => {
    expect(conf.bundle.macOS.hardenedRuntime).toBe(true);
    expect(conf.bundle.macOS.minimumSystemVersion).toBe('11.0');
  });

  it('names its publisher and home page', () => {
    expect(conf.bundle.publisher).toBe('UNTIL');
    expect(conf.bundle.homepage).toMatch(/^https:\/\//);
  });

  it('is a menu bar app from the first frame (LSUIElement)', () => {
    expect(read('src-tauri/Info.plist')).toMatch(/<key>LSUIElement<\/key>\s*<true\/>/);
  });
});

describe('desktop: least privilege', () => {
  const caps = fs
    .readdirSync(path.join(DESKTOP, 'src-tauri/capabilities'))
    .map(f => JSON.parse(read(`src-tauri/capabilities/${f}`)));

  it('names the windows each capability applies to, never a bare wildcard', () => {
    for (const cap of caps) {
      expect(cap.windows).not.toContain('*');
      expect(cap.windows.length).toBeGreaterThan(0);
    }
  });

  it('keeps updater, restart and autostart on the panel only', () => {
    for (const cap of caps) {
      if (cap.windows.includes('panel')) continue;
      const names = cap.permissions.join(' ');
      expect(names).not.toMatch(/updater|process:|autostart|opener/);
    }
  });

  it('keeps remote content out: no remote capability, no isolation-free asset protocol', () => {
    for (const cap of caps) expect(cap.remote).toBeUndefined();
    expect(conf.app.security.assetProtocol?.enable ?? false).toBe(false);
  });
});

describe('desktop: accessibility basics in the CSS', () => {
  it.each(['panel.css', 'notch.css', 'widgets.css'])('%s respects reduced motion or has no motion', file => {
    const css = read(`src/${file}`);
    const animates = /animation|transition/.test(css);
    if (animates) expect(css).toMatch(/prefers-reduced-motion/);
  });

  it('supports forced colors (Windows High Contrast) in the panel and widgets', () => {
    expect(read('src/panel.css')).toMatch(/forced-colors:\s*active/);
    expect(read('src/widgets.css')).toMatch(/forced-colors:\s*active/);
  });
});
