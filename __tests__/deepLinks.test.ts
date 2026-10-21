import { parseOpenScreenUrl } from '../src/app/navigation/deepLinks';

// The navigation library is ESM; only the URL parser is under test here.
jest.mock('../src/shared/navigation/rootNavigationRef', () => ({
  rootNavigationRef: { isReady: () => false, navigate: jest.fn() },
}));

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

