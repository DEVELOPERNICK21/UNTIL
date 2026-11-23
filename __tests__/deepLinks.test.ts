import * as fs from 'fs';
import * as path from 'path';
import {
  isQuickCalmUrl,
  openScreenFromUrl,
  parseOpenScreenUrl,
} from '../src/app/navigation/deepLinks';
import { rootNavigationRef } from '../src/shared/navigation/rootNavigationRef';

// The navigation library is ESM, so the ref is replaced by a stand-in the tests can steer.
jest.mock('../src/shared/navigation/rootNavigationRef', () => ({
  rootNavigationRef: {
    isReady: jest.fn(() => false),
    getCurrentRoute: jest.fn(() => ({ name: 'Home' })),
    navigate: jest.fn(),
  },
}));

// The feature's screens are not needed to read its constants; use the real values without them.
jest.mock('../src/features/pause', () =>
  jest.requireActual('../src/features/pause/domain/practices'),
);

describe('parseOpenScreenUrl', () => {
  it('accepts the screens the island links to', () => {
    expect(parseOpenScreenUrl('until://open/DayDetail')).toBe('DayDetail');
    expect(parseOpenScreenUrl('until://open/MonthDetail')).toBe('MonthDetail');
    expect(parseOpenScreenUrl('until://open/YearDetail')).toBe('YearDetail');
    expect(parseOpenScreenUrl('until://open/Life')).toBe('Life');
    expect(parseOpenScreenUrl('until://open/DailyTasks')).toBe('DailyTasks');
    expect(parseOpenScreenUrl('until://open/HourCalculation')).toBe(
      'HourCalculation',
    );
    expect(parseOpenScreenUrl('until://open/Countdowns')).toBe('Countdowns');
    expect(parseOpenScreenUrl('until://open/CustomCounters')).toBe(
      'CustomCounters',
    );
    expect(parseOpenScreenUrl('until://open/Premium')).toBe('Premium');
    expect(parseOpenScreenUrl('until://open/Badges')).toBe('Badges');
    expect(parseOpenScreenUrl('until://open/Pause')).toBe('Pause');
  });

  it('tolerates a trailing slash, query and whitespace', () => {
    expect(parseOpenScreenUrl('until://open/Life/')).toBe('Life');
    expect(parseOpenScreenUrl('until://open/Life?from=island')).toBe('Life');
    expect(parseOpenScreenUrl('  until://open/Life  ')).toBe('Life');
  });

  it('refuses screens that are not on the allow list', () => {
    expect(parseOpenScreenUrl('until://open/Settings')).toBeNull();
    expect(parseOpenScreenUrl('until://open/Account')).toBeNull();
    expect(parseOpenScreenUrl('until://open/ShareSnapshot')).toBeNull();
  });

  it('ignores other links and junk', () => {
    expect(parseOpenScreenUrl(null)).toBeNull();
    expect(parseOpenScreenUrl('')).toBeNull();
    expect(parseOpenScreenUrl('until://')).toBeNull();
    expect(parseOpenScreenUrl('until://increment-counter?id=abc')).toBeNull();
    expect(parseOpenScreenUrl('https://open/Life')).toBeNull();
    expect(parseOpenScreenUrl('until://open/Life/extra')).toBeNull();
  });
});

/** Every screen a widget on either platform sends a tap to must be on the allow list. */
describe('widget tap targets', () => {
  const WIDGET_ROUTES: Record<string, string> = {
    'Day widget': 'DayDetail',
    'Month widget': 'MonthDetail',
    'Year widget': 'YearDetail',
    'Life widget': 'Life',
    'Tasks widget': 'DailyTasks',
    'Hour timer widget': 'HourCalculation',
    'Deadline widget': 'Countdowns',
    'Counter widget (no counter yet)': 'CustomCounters',
  };

  it.each(Object.entries(WIDGET_ROUTES))('%s opens %s', (_widget, route) => {
    expect(parseOpenScreenUrl(`until://open/${route}`)).toBe(route);
  });
});


describe('quick calm link (widget and shortcut)', () => {
  const nav = rootNavigationRef as unknown as {
    isReady: jest.Mock;
    getCurrentRoute: jest.Mock;
    navigate: jest.Mock;
  };

  beforeEach(() => {
    nav.isReady.mockReturnValue(true);
    nav.getCurrentRoute.mockReturnValue({ name: 'Home' });
    nav.navigate.mockClear();
  });

  it('is recognised, with a query or trailing slash', () => {
    expect(isQuickCalmUrl('until://open/PauseNow')).toBe(true);
    expect(isQuickCalmUrl('until://open/PauseNow/')).toBe(true);
    expect(isQuickCalmUrl('until://open/PauseNow?from=widget')).toBe(true);
    expect(isQuickCalmUrl('until://open/Pause')).toBe(false);
    expect(isQuickCalmUrl('until://open/PauseNow/extra')).toBe(false);
    expect(isQuickCalmUrl(null)).toBe(false);
  });

  it('is not an ordinary screen link', () => {
    expect(parseOpenScreenUrl('until://open/PauseNow')).toBeNull();
  });

  it('starts the one-minute sigh with no ready step', () => {
    expect(openScreenFromUrl('until://open/PauseNow')).toBe(true);
    expect(nav.navigate).toHaveBeenCalledWith('PauseSession', {
      practice: 'sigh',
      instant: true,
    });
  });

  it('does not restart a session that is already running', () => {
    nav.getCurrentRoute.mockReturnValue({ name: 'PauseSession' });
    expect(openScreenFromUrl('until://open/PauseNow')).toBe(true);
    expect(nav.navigate).not.toHaveBeenCalled();
  });

  it('still opens the hub for the plain Pause link', () => {
    expect(openScreenFromUrl('until://open/Pause')).toBe(true);
    expect(nav.navigate).toHaveBeenCalledWith('Pause');
  });

  it('leaves other links alone', () => {
    expect(openScreenFromUrl('until://open/Settings')).toBe(false);
    expect(nav.navigate).not.toHaveBeenCalled();
  });
});

/** The native entry points are Kotlin, XML and Swift; this keeps them sending the link the app expects. */
describe('quick calm entry points on the phone', () => {
  const root = path.join(__dirname, '..');
  const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8');

  it('the Android widget sends the quick calm link', () => {
    const kotlin = read('android/app/src/main/java/app/until/time/UNTILPauseWidgetProvider.kt');
    const url = /Uri\.parse\("(until:\/\/[^"]+)"\)/.exec(kotlin)?.[1];
    expect(isQuickCalmUrl(url ?? null)).toBe(true);
  });

  it('the Android app shortcut sends the quick calm link', () => {
    const xml = read('android/app/src/main/res/xml/shortcuts.xml');
    const url = /android:data="([^"]+)"/.exec(xml)?.[1];
    expect(isQuickCalmUrl(url ?? null)).toBe(true);
    expect(read('android/app/src/main/AndroidManifest.xml')).toContain('@xml/shortcuts');
  });

  it('the Android widget is registered', () => {
    const manifest = read('android/app/src/main/AndroidManifest.xml');
    expect(manifest).toContain('.UNTILPauseWidgetProvider');
    expect(manifest).toContain('@xml/widget_pause_info');
  });

  it('the iOS widget sends the quick calm route and is in the bundle', () => {
    const swift = read('ios/UNTILWidgets/UNTILWidgets.swift');
    expect(swift).toMatch(/\.widgetURL\(widgetOpenURL\("PauseNow"\)\)/);
    expect(swift).toMatch(/HourCalculationWidget\(\)\s+PauseWidget\(\)/);
    expect(isQuickCalmUrl('until://open/PauseNow')).toBe(true);
  });

  it('the widgets read Pause counts and nothing else of the app', () => {
    const swift = read('ios/UNTILWidgets/UNTILWidgets.swift');
    const start = swift.indexOf('struct PauseWidgetProvider');
    const end = swift.indexOf('private enum PauseDesign');
    const provider = swift.slice(start, end);
    expect(provider).toContain('loadPauseGlanceJSON');
    expect(provider).not.toMatch(/loadJSON|loadDailyTasks|loadCountdowns|loadCustomCounters|loadHourCalculation/);

    const kotlin = read('android/app/src/main/java/app/until/time/PauseGlance.kt');
    expect(kotlin).toContain('pause.glance');
    // The only fields read from storage are counts: seconds by date, the goal and the level.
    expect([...kotlin.matchAll(/opt(?:Int|String|JSONObject)\("(\w+)"/g)].map(m => m[1]).sort()).toEqual([
      'goalSeconds',
      'level',
      'recent',
    ]);
  });
});
