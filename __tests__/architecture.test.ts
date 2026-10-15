/**
 * Architecture guard: Feature-Based Architecture + Pragmatic Clean Architecture.
 *
 * Resolves every import under src/ to a real file and checks the rules in docs/ARCHITECTURE.md:
 *   1. src/ holds only app/, features/, shared/, config/ and assets/.
 *   2. shared/ and config/ never import a feature or the app.
 *   3. A feature reaches another feature only through its public API (index.ts), or, from its
 *      domain, data and services layers, through the pure domain entry (domain/index.ts).
 *   4. Feature-to-feature imports follow FEATURE_DEPENDENCIES below, which must stay acyclic.
 *   5. Features reach the app only through the composition root (app/di).
 *   6. The app shell reaches features through their public API (app/di may wire anything).
 *   7. domain/ is pure: no packages, no data/hooks/services/ui, no app.
 *   8. No new file passes the 300-line limit, and the legacy ones do not grow.
 */

import fs from 'fs';
import path from 'path';

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const FEATURES_DIR = path.join(SRC, 'features');

/**
 * The only feature-to-feature dependencies allowed. Adding one is an architectural decision:
 * change it here, in docs/ARCHITECTURE.md, and say why in the PR. It has to stay a DAG.
 */
const FEATURE_DEPENDENCIES: Record<string, string[]> = {
  account: ['onboarding', 'time'],
  activity: ['premium', 'time'],
  'app-update': [],
  badges: ['countdowns', 'premium', 'presence', 'tasks', 'time'],
  countdowns: [],
  counters: [],
  ember: ['onboarding', 'presence', 'time'],
  engagement: ['countdowns', 'premium', 'presence'],
  home: ['activity', 'badges', 'premium', 'presence', 'reflections', 'tasks', 'time'],
  life: ['premium', 'presence', 'time'],
  onboarding: ['time'],
  premium: ['account', 'time'],
  presence: [],
  reflections: ['onboarding', 'premium', 'time'],
  settings: ['account', 'activity', 'app-update', 'engagement', 'premium', 'time'],
  share: ['premium', 'time'],
  tasks: ['ember'],
  time: ['presence'],
  widgets: ['countdowns', 'counters', 'premium', 'tasks', 'time'],
};

/** Layers a feature folder may contain. */
const LAYERS = ['config', 'data', 'domain', 'hooks', 'services', 'ui'];
/** domain/, data/ and services/ never load screens or hooks of another feature. */
const PURE_LAYERS = ['domain', 'data', 'services'];

/** Files over the 300-line limit that predate the guard. They may shrink, never grow. */
const LEGACY_OVERSIZE: Record<string, number> = {
  'features/tasks/ui/DailyTasksScreen.tsx': 1078,
  'features/share/ui/ShareSnapshotScreen.tsx': 1043,
  'features/settings/ui/SettingsScreen.tsx': 869,
  'features/account/ui/AccountScreen.tsx': 852,
  'features/premium/ui/PremiumPaywallBody.tsx': 819,
  'features/home/ui/HomeScreen.tsx': 773,
  'features/ember/ui/EmberCompanion.tsx': 755,
  'features/onboarding/ui/OnboardingScreen.tsx': 705,
  'features/account/ui/AccountPromptScreen.tsx': 703,
  'shared/ui/Ember.tsx': 682,
  'shared/ui/PeriodGlyph.tsx': 586,
  'app/di/index.ts': 579,
  'features/widgets/data/WidgetSync.ts': 573,
  'features/account/data/FirebaseAuthServiceAdapter.ts': 551,
  'features/widgets/ui/WidgetCustomizationScreen.tsx': 531,
  'app/navigation/RootNavigator.tsx': 510,
  'features/tasks/ui/TasksComingSoonScreen.tsx': 504,
  'features/time/ui/PeriodDetailScreen.tsx': 477,
  'features/account/ui/IdentitySetupScreen.tsx': 475,
  'features/tasks/ui/TaskReportContent.tsx': 464,
  'features/widgets/ui/DynamicIslandScreen.tsx': 426,
  'features/onboarding/ui/InteractiveDayDemo.tsx': 412,
  'features/account/ui/LoginScreen.tsx': 402,
  'features/tasks/ui/GoalDetailScreen.tsx': 394,
  'features/widgets/ui/WidgetScreen.tsx': 388,
  'shared/analytics/analytics.ts': 346,
  'features/badges/ui/BadgeMedal.tsx': 333,
  'features/badges/domain/badgeCatalog.ts': 333,
  'app/App.tsx': 328,
  'features/onboarding/ui/InteractiveWidgets.tsx': 322,
  'features/badges/ui/BadgeUnlockOverlay.tsx': 311,
  'features/onboarding/ui/InteractiveWelcome.tsx': 309,
  'config/monetization.ts': 305,
  'shared/types/index.ts': 302,
};

const LINE_LIMIT = 300;

type Ref = { from: string; to: string; line: number; spec: string; typeOnly: boolean };

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(ts|tsx)$/.test(entry.name) && !/\.d\.ts$/.test(entry.name)) out.push(full);
  }
  return out;
}

const EXTENSIONS = ['', '.ts', '.tsx', '.js', '.json', '/index.ts', '/index.tsx'];
function resolveRelative(fromFile: string, spec: string): string | null {
  const base = path.resolve(path.dirname(fromFile), spec);
  for (const ext of EXTENSIONS) {
    const candidate = base + ext;
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
  }
  return null;
}

// A deliberately small import scanner: static import/export-from, require() and dynamic import().
const IMPORT_RE =
  /(?:^|\n)\s*(import|export)\s+(type\s+)?(?:[^'"`;]*?\sfrom\s+)?['"]([^'"]+)['"]|(?:require|import)\(\s*['"]([^'"]+)['"]\s*\)/g;

function refsOf(file: string): Ref[] {
  const text = fs.readFileSync(file, 'utf8');
  const refs: Ref[] = [];
  let match: RegExpExecArray | null;
  IMPORT_RE.lastIndex = 0;
  while ((match = IMPORT_RE.exec(text))) {
    const spec = match[3] ?? match[4];
    if (!spec) continue;
    const line = text.slice(0, match.index + (match[0].startsWith('\n') ? 1 : 0)).split('\n').length;
    const typeOnly = Boolean(match[2]);
    if (!spec.startsWith('.')) {
      refs.push({ from: file, to: spec, line, spec, typeOnly });
      continue;
    }
    const resolved = resolveRelative(file, spec);
    if (resolved) refs.push({ from: file, to: resolved, line, spec, typeOnly });
  }
  return refs;
}

const rel = (abs: string) => path.relative(SRC, abs).split(path.sep).join('/');
const isPackage = (to: string) => !path.isAbsolute(to);

function zone(abs: string): { kind: string; feature?: string; layer?: string; isIndex?: boolean; isDomainEntry?: boolean } {
  const r = rel(abs);
  const top = r.split('/')[0];
  if (top === 'features') {
    const [, feature, ...rest] = r.split('/');
    const layer = rest.length > 1 ? rest[0] : undefined;
    return {
      kind: 'feature',
      feature,
      layer,
      isIndex: rest.length === 1 && rest[0] === 'index.ts',
      isDomainEntry: rest.length === 2 && rest[0] === 'domain' && rest[1] === 'index.ts',
    };
  }
  if (top === 'app') return { kind: r.startsWith('app/di/') || r === 'app/di.ts' ? 'app-di' : 'app' };
  return { kind: top };
}

const srcFiles = walk(SRC);
const allRefs = srcFiles.flatMap(refsOf);
const at = (ref: Ref) => `${rel(ref.from)}:${ref.line} -> ${ref.spec}`;

describe('architecture', () => {
  it('keeps src/ to app, features, shared, config and assets', () => {
    const tops = fs.readdirSync(SRC).filter(name => !name.startsWith('.'));
    expect(tops.sort()).toEqual(['app', 'assets', 'config', 'features', 'shared']);
  });

  it('keeps feature folders to the known layers plus index.ts', () => {
    const bad: string[] = [];
    for (const feature of fs.readdirSync(FEATURES_DIR)) {
      const dir = path.join(FEATURES_DIR, feature);
      if (!fs.statSync(dir).isDirectory()) continue;
      for (const name of fs.readdirSync(dir)) {
        if (name === 'index.ts') continue;
        if (!LAYERS.includes(name)) bad.push(`${feature}/${name}`);
      }
    }
    expect(bad).toEqual([]);
  });

  it('declares a dependency entry for every feature, and the declared graph has no cycle', () => {
    const features = fs.readdirSync(FEATURES_DIR).filter(n => fs.statSync(path.join(FEATURES_DIR, n)).isDirectory());
    expect(Object.keys(FEATURE_DEPENDENCIES).sort()).toEqual(features.sort());

    const state: Record<string, 'visiting' | 'done'> = {};
    const stack: string[] = [];
    const visit = (feature: string): string | null => {
      if (state[feature] === 'done') return null;
      if (state[feature] === 'visiting') return [...stack.slice(stack.indexOf(feature)), feature].join(' -> ');
      state[feature] = 'visiting';
      stack.push(feature);
      for (const dep of FEATURE_DEPENDENCIES[feature]) {
        expect(features).toContain(dep);
        const cycle = visit(dep);
        if (cycle) return cycle;
      }
      stack.pop();
      state[feature] = 'done';
      return null;
    };
    for (const feature of features) expect(visit(feature)).toBeNull();
  });

  it('never lets shared/ or config/ import a feature or the app', () => {
    const bad = allRefs
      .filter(ref => ['shared', 'config'].includes(zone(ref.from).kind) && !isPackage(ref.to))
      .filter(ref => ['feature', 'app', 'app-di'].includes(zone(ref.to).kind))
      .map(at);
    expect(bad).toEqual([]);
  });

  it('lets a feature reach another feature only through its public API', () => {
    const bad: string[] = [];
    for (const ref of allRefs) {
      if (isPackage(ref.to)) continue;
      const from = zone(ref.from);
      const to = zone(ref.to);
      if (to.kind !== 'feature' || from.kind === 'app-di') continue;
      if (from.kind === 'feature' && from.feature === to.feature) continue;
      const pure = from.kind === 'feature' && PURE_LAYERS.includes(from.layer ?? '');
      if (pure) {
        if (!to.isDomainEntry) bad.push(`${at(ref)} (domain, data and services may only use ${to.feature}/domain/index.ts)`);
      } else if (!to.isIndex) {
        bad.push(`${at(ref)} (use ${to.feature}/index.ts)`);
      }
    }
    expect(bad).toEqual([]);
  });

  it('only lets a feature depend on the features declared for it', () => {
    const bad: string[] = [];
    for (const ref of allRefs) {
      if (isPackage(ref.to)) continue;
      const from = zone(ref.from);
      const to = zone(ref.to);
      if (from.kind !== 'feature' || to.kind !== 'feature' || from.feature === to.feature) continue;
      if (!FEATURE_DEPENDENCIES[from.feature!].includes(to.feature!)) {
        bad.push(`${at(ref)} (${from.feature} may not depend on ${to.feature})`);
      }
    }
    expect(bad).toEqual([]);
  });

  it('lets features reach the app only through the composition root (app/di)', () => {
    const bad = allRefs
      .filter(ref => zone(ref.from).kind === 'feature' && !isPackage(ref.to))
      .filter(ref => ['app', 'app-di'].includes(zone(ref.to).kind))
      .filter(ref => zone(ref.to).kind !== 'app-di')
      .map(at);
    expect(bad).toEqual([]);
  });

  it('keeps the domain entry and the public index free of other features', () => {
    const bad: string[] = [];
    for (const ref of allRefs) {
      const from = zone(ref.from);
      if (from.kind !== 'feature' || !(from.isIndex || from.isDomainEntry) || isPackage(ref.to)) continue;
      const to = zone(ref.to);
      if (to.kind !== 'feature' || to.feature !== from.feature) bad.push(`${at(ref)} (an entry file re-exports only its own feature)`);
      if (from.isDomainEntry && to.layer !== 'domain') bad.push(`${at(ref)} (the domain entry re-exports only domain files)`);
    }
    expect(bad).toEqual([]);
  });

  it('keeps domain/ pure: no packages, no data, hooks, services, ui or app', () => {
    const bad: string[] = [];
    for (const ref of allRefs) {
      const from = zone(ref.from);
      if (from.kind !== 'feature' || from.layer !== 'domain') continue;
      if (isPackage(ref.to)) {
        bad.push(`${at(ref)} (package import)`);
        continue;
      }
      const to = zone(ref.to);
      if (to.kind === 'app' || to.kind === 'app-di') bad.push(`${at(ref)} (app)`);
      if (to.kind === 'feature' && to.feature === from.feature && to.layer && to.layer !== 'domain' && to.layer !== 'config') {
        bad.push(`${at(ref)} (${to.layer})`);
      }
      if (to.kind === 'shared') {
        const r = rel(ref.to);
        if (/^shared\/(analytics|platform|persistence|hooks|ui)\//.test(r) || r === 'shared/theme/themeStore.ts') {
          bad.push(`${at(ref)} (shared service)`);
        }
      }
    }
    expect(bad).toEqual([]);
  });

  it('keeps files under the line limit, and legacy long files from growing', () => {
    const tooLong: string[] = [];
    const grown: string[] = [];
    for (const file of srcFiles) {
      const lines = fs.readFileSync(file, 'utf8').split('\n').length;
      if (lines <= LINE_LIMIT) continue;
      const key = rel(file);
      const allowed = LEGACY_OVERSIZE[key];
      if (allowed === undefined) tooLong.push(`${key} (${lines} lines)`);
      else if (lines > allowed) grown.push(`${key}: ${lines} > ${allowed}`);
    }
    expect({ tooLong, grown }).toEqual({ tooLong: [], grown: [] });
  });
});
