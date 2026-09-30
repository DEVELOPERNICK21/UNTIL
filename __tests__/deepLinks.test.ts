import { parseOpenScreenUrl } from '../src/services/deepLinks';

// The navigation library is ESM; only the URL parser is under test here.
jest.mock('../src/navigation/rootNavigationRef', () => ({
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
