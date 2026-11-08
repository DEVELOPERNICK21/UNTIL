import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';

import {
  emberFallbackTip,
  emberTimeLeftTip,
  emberTipPoolForRoute,
  pickEmberTip,
} from '../src/features/ember/domain/emberInsights';
import { personalizedEmberTipsForRoute } from '../src/features/onboarding/domain/personalizedInsights';
import emberMessages from '../src/shared/i18n/locales/en/ember.json';
import { SUPPORTED_LANGUAGES } from '../src/shared/i18n/languages';
import { setLanguage } from '../src/shared/i18n/translate';
import { timeOfDayLabel } from '../src/shared/theme/emotionalCopy';
import { Ember } from '../src/shared/ui/Ember';
import { timeLeftLabel } from '../src/shared/ui/emberTime';

// The theme index pulls in the theme store, which reads AsyncStorage.
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(() => Promise.resolve(null)),
    setItem: jest.fn(() => Promise.resolve()),
    removeItem: jest.fn(() => Promise.resolve()),
  },
}));

const NB = ' ';

const ROUTES = [
  'DayDetail',
  'MonthDetail',
  'YearDetail',
  'Life',
  'DailyTasks',
  'DailyTasksAdd',
  'TaskReport',
  'MonthlyGoals',
  'GoalDetail',
  'TasksComingSoon',
  'Widget',
  'WidgetCustomization',
  'Settings',
  'ShareSnapshot',
  'Countdowns',
  'CustomCounters',
  'Premium',
  'HourCalculation',
  'Overlay',
  'DynamicIsland',
  'SomewhereElse',
];

const LOOKS_UNTRANSLATED = /\bember\.[A-Za-z]|\{\{/;

afterEach(() => {
  setLanguage('en');
});

describe('Ember tip pools', () => {
  it('has a test route for every route that has copy', () => {
    const routesWithCopy = new Set(
      Object.keys(emberMessages)
        .map(key => /^ember\.([A-Z][A-Za-z]+)\.\d/.exec(key)?.[1])
        .filter(route => route && route !== 'Default'),
    );
    for (const route of routesWithCopy) expect(ROUTES).toContain(route);
  });

  it('keeps the English wording', () => {
    expect(pickEmberTip('DayDetail', { dayProgress: 0.2 }, 0)).toEqual({
      eyebrow: 'Today',
      body: 'Most of today is still ahead. Watch what’s left.',
    });
    expect(pickEmberTip('Premium', { dayProgress: 0.2 }, 0)).toEqual({
      eyebrow: 'No rush',
      body: 'Premium unlocks when you’re ready. Ember stays.',
    });
    expect(pickEmberTip('Home', { dayProgress: 0.2 }, 0)).toBeNull();
    expect(emberTipPoolForRoute('Nowhere', { dayProgress: 0.9 })).toEqual([
      { eyebrow: 'Ember', body: 'A quiet glance at what’s left.' },
      { eyebrow: 'Still here', body: 'Evening. Go easy on what’s left.' },
    ]);
    expect(emberFallbackTip()).toEqual({
      eyebrow: 'Ember',
      body: 'Tap me when you want a tip.',
    });
    expect(emberTimeLeftTip('6h left today')).toEqual({
      eyebrow: 'Right now',
      body: '6h left today',
    });
  });

  it('adds streak lines whose wording follows the length of the streak', () => {
    const lines = (streakCount: number) =>
      emberTipPoolForRoute('DailyTasks', { dayProgress: 0.2, streakCount })
        ?.filter(item => item.eyebrow === 'Here')
        .map(item => item.body);
    expect(lines(1)).toEqual([]);
    expect(lines(3)).toEqual([
      'Day 3. Nice to see you open the app.',
      '3 days in a row. Keep going at your pace.',
    ]);
    expect(lines(8)).toEqual([
      '8 days opened. That adds up.',
      '8 days noticed. Thanks for checking in.',
    ]);
    expect(lines(1234)).toEqual([
      '1,234 days together. Still here.',
      'Long streak: 1,234 days. Wear it lightly.',
    ]);
  });

  it('names the time of day in the first tip of the coming-soon screen', () => {
    setLanguage('de');
    expect(pickEmberTip('TasksComingSoon', { dayProgress: 0.3 }, 0)).toEqual({
      eyebrow: timeOfDayLabel(),
      body: 'Aufgaben kommen später. Die Zeit zu bemerken, reicht für jetzt.',
    });
  });

  it('writes every tip in every language, never a raw key or a hole', () => {
    for (const { code } of SUPPORTED_LANGUAGES) {
      setLanguage(code);
      for (const route of ROUTES) {
        for (const streakCount of [undefined, 3, 8, 20]) {
          for (const dayProgress of [0.1, 0.5, 0.9]) {
            const pool = emberTipPoolForRoute(route, {
              dayProgress,
              streakCount,
            });
            expect(pool?.length).toBeGreaterThan(1);
            for (const item of pool ?? []) {
              expect(item.eyebrow.trim()).not.toBe('');
              expect(item.body.trim()).not.toBe('');
              expect(`${item.eyebrow} ${item.body}`).not.toMatch(
                LOOKS_UNTRANSLATED,
              );
            }
          }
        }
      }
    }
  });

  it('uses the Russian plural forms for the streak', () => {
    setLanguage('ru');
    const lines = (streakCount: number) =>
      emberTipPoolForRoute('DayDetail', { dayProgress: 0.2, streakCount })
        ?.filter(item => item.eyebrow === 'Серия')
        .map(item => item.body);
    expect(lines(3)?.[1]).toBe('3 дня подряд. Идите в своём темпе.');
    expect(lines(5)?.[1]).toBe(
      'Вы замечаете время уже 5 дней. Спасибо, что заглядываете.',
    );
    expect(lines(21)).toEqual([
      'Вместе уже 21 день. Всё ещё здесь.',
      'Долгая серия: 21 день. Несите её легко.',
    ]);
    expect(lines(22)?.[0]).toBe('Вместе уже 22 дня. Всё ещё здесь.');
    expect(lines(25)?.[0]).toBe('Вместе уже 25 дней. Всё ещё здесь.');
  });

  it('says the fallback and the held time in the active language', () => {
    setLanguage('ru');
    expect(emberFallbackTip()).toEqual({
      eyebrow: 'Ember',
      body: 'Коснитесь меня, когда захотите подсказку.',
    });
    expect(emberTimeLeftTip(timeLeftLabel(0.5))).toEqual({
      eyebrow: 'Прямо сейчас',
      body: 'Осталось 12 ч сегодня',
    });
  });
});

describe('personalized Ember tips', () => {
  const answers = {
    goal: 'calm',
    valuesPriority: 'calm',
    timeDrain: 'social',
    cadence: 'widgets',
  } as const;

  it('keeps the English wording', () => {
    const tips = personalizedEmberTipsForRoute('Life', answers, {
      dayProgress: 0.4,
    });
    expect(tips).toEqual([
      {
        eyebrow: 'Your map',
        body: 'You wanted less doomscroll. Watch for when your calm slips away today.',
      },
      {
        eyebrow: 'Leak watch',
        body: 'You named phone and social scrolling as the drain. Catch one leak early.',
      },
      {
        eyebrow: 'Life grid',
        body: 'Zoom out. Calm and less doomscroll still fit in a finite life.',
      },
    ]);
    expect(
      personalizedEmberTipsForRoute('Settings', answers, {
        dayProgress: 0.4,
      }).at(-1),
    ).toEqual({
      eyebrow: 'Widgets first',
      body: 'You chose widgets over check-ins. A glance can still change a day.',
    });
  });

  it('puts the time left into the deep-focus tip, in the language and style of each language', () => {
    const focus = { goal: 'focus', valuesPriority: 'focus' } as const;
    expect(
      personalizedEmberTipsForRoute('DayDetail', focus, { dayProgress: 0.4 })[0]
        .body,
    ).toBe(
      'Deep focus was your pick. Protect one quiet block before 60% of today is gone.',
    );
    setLanguage('tr');
    expect(
      personalizedEmberTipsForRoute('DayDetail', focus, { dayProgress: 0.4 })[0]
        .body,
    ).toBe(
      'Derin odak senin seçimindi. Bugünün %60 kadarı geçmeden önce sessiz bir blok koru.',
    );
    setLanguage('de');
    expect(
      personalizedEmberTipsForRoute('DayDetail', focus, { dayProgress: 0.4 })[0]
        .body,
    ).toBe(
      `Tiefer Fokus war deine Wahl. Schütze einen ruhigen Block, bevor 60${NB}% des heutigen Tages vorbei sind.`,
    );
  });

  it('writes a tip for every answer in every language', () => {
    for (const { code } of SUPPORTED_LANGUAGES) {
      setLanguage(code);
      for (const priority of [
        'people',
        'focus',
        'health',
        'calm',
        'rest',
        'other',
      ] as const) {
        for (const drain of [
          'social',
          'work',
          'busywork',
          'priorities',
          'unsure',
        ] as const) {
          for (const route of ['Life', 'Settings', 'DayDetail']) {
            const tips = personalizedEmberTipsForRoute(
              route,
              {
                goal: priority === 'rest' ? 'other' : priority,
                valuesPriority: priority,
                timeDrain: drain,
                cadence: 'widgets',
              },
              { dayProgress: 0.3 },
            );
            expect(tips.length).toBeGreaterThanOrEqual(1);
            for (const tip of tips) {
              expect(tip.eyebrow.trim()).not.toBe('');
              expect(`${tip.eyebrow} ${tip.body}`).not.toMatch(
                LOOKS_UNTRANSLATED,
              );
            }
          }
        }
      }
    }
  });
});

describe('time left', () => {
  it('keeps the English wording', () => {
    expect(timeLeftLabel(1)).toBe('Today is done');
    expect(timeLeftLabel(0)).toBe('A whole new day');
    expect(timeLeftLabel(0.5)).toBe('12h left today');
    expect(timeLeftLabel(10.5 / 24)).toBe('13h 30m left today');
    expect(timeLeftLabel(23.5 / 24)).toBe('30m left today');
  });

  it('reads naturally in other languages', () => {
    setLanguage('ru');
    expect(timeLeftLabel(0.5)).toBe('Осталось 12 ч сегодня');
    setLanguage('es');
    expect(timeLeftLabel(10.5 / 24)).toBe('Quedan 13 h 30 min hoy');
    setLanguage('ja');
    expect(timeLeftLabel(0.75)).toBe('今日はあと6時間');
    expect(timeLeftLabel(23.5 / 24)).toBe('今日はあと30分');
  });

  it('writes every state in every language', () => {
    for (const { code } of SUPPORTED_LANGUAGES) {
      setLanguage(code);
      for (const progress of [0, 0.3, 0.5, 10.5 / 24, 23.5 / 24, 0.999, 1]) {
        const label = timeLeftLabel(progress);
        expect(label.trim()).not.toBe('');
        expect(label).not.toMatch(LOOKS_UNTRANSLATED);
      }
    }
  });
});

describe('Ember for screen readers', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  async function render(element: React.ReactElement) {
    let tree!: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      tree = ReactTestRenderer.create(element);
    });
    return tree;
  }

  const button = (tree: ReactTestRenderer.ReactTestRenderer) =>
    tree.root.findByProps({ accessibilityRole: 'button' }).props;

  it('keeps the English wording, with a spoken mood', async () => {
    const tree = await render(<Ember progress={0.5} />);
    expect(button(tree).accessibilityLabel).toBe(
      'Ember companion, midday mood. 12h left today. Tap to say hello',
    );
    expect(button(tree).accessibilityActions).toEqual([
      { name: 'timeLeft', label: 'Hear time left today' },
    ]);
    act(() => tree.unmount());
  });

  it('is described in the active language and follows a language change', async () => {
    setLanguage('de');
    const tree = await render(<Ember progress={0.5} />);
    expect(button(tree).accessibilityLabel).toBe(
      'Ember, dein Begleiter, Stimmung: Mittag. Heute noch 12 h. Tippen zum Begrüßen',
    );
    expect(button(tree).accessibilityActions).toEqual([
      { name: 'timeLeft', label: 'Verbleibende Zeit heute anhören' },
    ]);

    await act(async () => {
      setLanguage('ja');
    });
    expect(button(tree).accessibilityLabel).toBe(
      'Ember、あなたの相棒。昼の気分。今日はあと12時間。タップしてあいさつ',
    );
    act(() => tree.unmount());
  });

  it('hands the time left over in the active language when held', async () => {
    const onLongPress = jest.fn();
    setLanguage('fr');
    const tree = await render(
      <Ember progress={0.75} onLongPress={onLongPress} />,
    );
    act(() => button(tree).onLongPress());
    expect(onLongPress).toHaveBeenCalledWith('Encore 6 h aujourd’hui');
    act(() => tree.unmount());
  });

  it('drops the tap hint and the action when it is not interactive', async () => {
    setLanguage('es');
    const tree = await render(<Ember progress={0.5} interactive={false} />);
    const labelled = tree.root.findAll(
      node => typeof node.props.accessibilityLabel === 'string',
    );
    expect(labelled[0].props.accessibilityLabel).toBe(
      'Ember, tu compañero, ánimo de mediodía. Quedan 12 h hoy',
    );
    expect(labelled[0].props.accessibilityActions).toEqual([]);
    act(() => tree.unmount());
  });
});
