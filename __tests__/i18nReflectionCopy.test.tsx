import React from 'react';
import { Text as NativeText } from 'react-native';
import ReactTestRenderer, { act } from 'react-test-renderer';

import { computeAccessState } from '../src/features/premium/domain/accessControl';
import {
  generateDailyReflection,
  localizeReflection,
  renderReflection,
} from '../src/features/reflections/domain/reflectionEngine';
import type {
  DailyReflection,
  ReflectionCategory,
  ReflectionPersistence,
  ReflectionTone,
} from '../src/features/reflections/domain/reflectionTypes';
import { GetDailyReflectionUseCase } from '../src/features/reflections/domain/useCases/GetDailyReflectionUseCase';
import { useDailyReflection } from '../src/features/reflections/hooks/useDailyReflection';
import { TimeCoachCard } from '../src/features/reflections/ui/TimeCoachCard';
import type { IOnboardingRepository } from '../src/features/onboarding/domain/ports/IOnboardingRepository';
import type { ITimeRepository } from '../src/features/time/domain/ports/ITimeRepository';
import { SUPPORTED_LANGUAGES } from '../src/shared/i18n/languages';
import { setLanguage } from '../src/shared/i18n/translate';

const NB = ' ';

const mockUseCase: { current: GetDailyReflectionUseCase | null } = {
  current: null,
};

jest.mock('../src/app/di', () => ({
  get getDailyReflectionUseCase() {
    return mockUseCase.current;
  },
}));

jest.mock('../src/shared/time/clock', () => ({
  now: () => new Date(2026, 4, 25, 21, 0, 0),
}));

jest.mock('../src/features/premium', () => ({
  useAccessControl: () => ({
    access: { trialActive: false, isPremium: true },
    hasPremiumBundle: true,
  }),
}));

jest.mock('../src/features/time', () => ({
  useObserveTimeState: () => ({
    userProfile: { birthDate: '1995-01-01' },
    timeState: { day: 0.86, month: 0.5, year: 0.4, life: 0.3 },
  }),
}));

jest.mock('../src/shared/ui', () => {
  const { Text: Native, View } = require('react-native');
  const Box = ({ children }: { children?: React.ReactNode }) => (
    <View>{children}</View>
  );
  return { Text: Native, GlassCard: Box };
});

jest.mock('../src/shared/theme', () => {
  const loose = (value: unknown) =>
    new Proxy(
      {},
      { get: (_target, key) => (key === 'then' ? undefined : value) },
    );
  return { Spacing: loose(8), Radius: loose(8), useTheme: () => loose('#888') };
});

jest.mock('../src/shared/analytics/analytics', () => ({
  logAnalyticsEvent: jest.fn(() => Promise.resolve()),
}));

const evening = new Date(2026, 4, 25, 21, 0, 0);
const sundayMorning = new Date(2026, 6, 19, 10, 0, 0);
const LOOKS_UNTRANSLATED = /\breflections\.[A-Za-z]|\{\{/;

function baseInput(overrides = {}) {
  return {
    date: evening,
    dayProgress: 0.86,
    monthProgress: 0.58,
    yearProgress: 0.41,
    lifeProgress: 0.32,
    hasBirthDate: true,
    hasPremiumBundle: true,
    tone: 'quiet' as const,
    ...overrides,
  };
}

function makePersistence() {
  let date: string | undefined;
  let payload: string | undefined;
  let dismissedDate: string | undefined;
  let tone: string | undefined;
  const persistence: ReflectionPersistence = {
    getDailyReflectionDate: () => date,
    setDailyReflectionDate: value => {
      date = value;
    },
    getDailyReflectionPayload: () => payload,
    setDailyReflectionPayload: value => {
      payload = value;
    },
    getDailyReflectionDismissedDate: () => dismissedDate,
    setDailyReflectionDismissedDate: value => {
      dismissedDate = value;
    },
    getReflectionTone: () => tone,
    setReflectionTone: value => {
      tone = value;
    },
  };
  return { persistence, payload: () => payload };
}

function makeUseCase(persistence: ReflectionPersistence) {
  const timeRepository: ITimeRepository = {
    getUserProfile: () => ({ birthDate: '1995-01-01', deathAge: 80 }),
    getTimeState: () => ({
      day: 0.86,
      week: 0.4,
      month: 0.5,
      year: 0.4,
      life: 0.3,
    }),
    getWidgetCache: () => {
      throw new Error('unused');
    },
    setUserProfile: () => {},
    subscribe: () => () => {},
  };
  const onboardingRepository: IOnboardingRepository = {
    getCompleted: () => true,
    setCompleted: () => {},
    getFunnelStep: () => 'results',
    setFunnelStep: () => {},
    getQuizAnswers: () => ({ goal: 'health' }),
    setQuizAnswers: () => {},
    patchQuizAnswers: patch => ({ goal: 'health', ...patch }),
  };
  const access = {
    execute: (now: number = Date.now()) =>
      computeAccessState({
        now,
        isPremium: true,
        purchaseType: null,
        purchaseDate: null,
        trialStartDate: null,
        appOpenCount: 0,
        lifeScreenViewed: false,
        lifeUnlockUntil: null,
      }),
  };
  return new GetDailyReflectionUseCase(
    timeRepository,
    access,
    persistence,
    onboardingRepository,
  );
}

const mounted: ReactTestRenderer.ReactTestRenderer[] = [];

function render(element: React.ReactElement) {
  let tree!: ReactTestRenderer.ReactTestRenderer;
  act(() => {
    tree = ReactTestRenderer.create(element);
  });
  mounted.push(tree);
  return tree;
}

function texts(tree: ReactTestRenderer.ReactTestRenderer): string[] {
  return tree.root
    .findAllByType(NativeText)
    .map(node => React.Children.toArray(node.props.children).join(''));
}

afterEach(() => {
  act(() => {
    mounted.splice(0).forEach(tree => tree.unmount());
  });
  setLanguage('en');
});

describe('reflection text', () => {
  it('keeps the English wording', () => {
    const day = generateDailyReflection(baseInput());
    expect(day.title).toBe('Today is still yours');
    expect(day.message).toBe(
      '86% of today has passed. Most of today has passed. Pick one small action you’ll be glad you did.',
    );

    const weekly = generateDailyReflection(
      baseInput({
        date: sundayMorning,
        dayProgress: 0.4,
        quizAnswers: { goal: 'health' },
      }),
    );
    expect(weekly.title).toBe('Week in review');
    expect(weekly.message).toBe(
      'Seven days passed whether you noticed or not. Name one moment worth repeating. Your life grid is 32% complete. This week is one more row. Protect health and energy before the week fills up.',
    );

    const prompt = generateDailyReflection(
      baseInput({ date: new Date(2026, 4, 5, 9, 0, 0), hasBirthDate: false }),
    );
    expect(prompt.action).toBe('setBirthDate');
    expect(prompt.title).toBe('Make it personal');
  });

  it('is written in the active language', () => {
    setLanguage('de');
    const day = generateDailyReflection(baseInput({ tone: 'radical' }));
    expect(day.title).toBe('Nutze, was bleibt');
    expect(day.message).toBe(
      `86${NB}% von heute sind vergangen. Der größte Teil von heute ist weg. Bring eine Sache zu Ende, bevor der Tag endet.`,
    );
    setLanguage('tr');
    expect(generateDailyReflection(baseInput()).message).toBe(
      'Bugünün %86 kadarı geçti. Bugünün büyük kısmı geçti. Yaptığına sevineceğin küçük bir şey seç.',
    );
  });

  it('joins the weekly sentences without spaces in Japanese', () => {
    setLanguage('ja');
    const weekly = generateDailyReflection(
      baseInput({
        date: sundayMorning,
        dayProgress: 0.4,
        quizAnswers: { goal: 'focus' },
      }),
    );
    expect(weekly.message).toBe(
      '気づいても気づかなくても、7日が過ぎました。くり返したい瞬間をひとつ挙げましょう。あなたのライフグリッドは32%埋まりました。今週はもう1行です。週が埋まる前に、深い集中を守りましょう。',
    );
  });

  it('writes every reflection in every language, never a raw key or a hole', () => {
    const categories: ReflectionCategory[] = [
      'day',
      'month',
      'year',
      'life',
      'weekly',
    ];
    const tones: ReflectionTone[] = ['quiet', 'radical'];
    const priorities = [
      'people',
      'focus',
      'health',
      'calm',
      'rest',
      'other',
    ] as const;
    for (const { code } of SUPPORTED_LANGUAGES) {
      setLanguage(code);
      const seen: string[] = [];
      for (const category of categories) {
        for (const tone of tones) {
          for (const priority of category === 'weekly'
            ? priorities
            : [undefined]) {
            const { title, message } = renderReflection({
              kind: 'template',
              category,
              tone,
              percent: category === 'weekly' ? undefined : 42,
              lifeGridPercent: category === 'weekly' ? 32 : undefined,
              priority,
            });
            expect(title.trim()).not.toBe('');
            expect(message.trim()).not.toBe('');
            expect(`${title} ${message}`).not.toMatch(LOOKS_UNTRANSLATED);
            if (category !== 'weekly') expect(message).toContain('42');
            seen.push(title);
          }
        }
      }
      expect(new Set(seen).size).toBeGreaterThanOrEqual(10);
      const prompt = renderReflection({ kind: 'birthDatePrompt' });
      expect(`${prompt.title} ${prompt.message}`).not.toMatch(
        LOOKS_UNTRANSLATED,
      );
    }
  });
});

describe('a saved reflection', () => {
  it('is written again in the active language without making a new one', () => {
    const { persistence, payload } = makePersistence();
    const useCase = makeUseCase(persistence);

    const first = useCase.execute(evening);
    expect(first.reflection.title).toBe('Today is still yours');
    const saved = payload();

    setLanguage('es');
    const second = useCase.execute(evening);
    expect(second.reflection.id).toBe(first.reflection.id);
    expect(second.reflection.title).toBe('Hoy sigue siendo tuyo');
    expect(second.reflection.message).toBe(
      `Ha pasado el 86${NB}% de hoy. Ya pasó la mayor parte de hoy. Elige una acción pequeña que te alegre haber hecho.`,
    );
    expect(payload()).toBe(saved);

    setLanguage('en');
    expect(useCase.execute(evening).reflection).toEqual(first.reflection);
  });

  it('keeps the text it was saved with when it has nothing to write it from', () => {
    const old: DailyReflection = {
      id: '2026-05-25-day-quiet',
      dateKey: '2026-05-25',
      title: 'Today is still yours',
      message: 'An older message.',
      category: 'day',
      tone: 'quiet',
      premium: false,
    };
    setLanguage('de');
    expect(localizeReflection(old)).toBe(old);

    const { persistence } = makePersistence();
    persistence.setDailyReflectionDate('2026-05-25');
    persistence.setDailyReflectionPayload(JSON.stringify(old));
    const shown = makeUseCase(persistence).execute(evening).reflection;
    expect(shown.message).toBe('An older message.');
  });
});

describe('time coach card', () => {
  const reflection = () => generateDailyReflection(baseInput());

  it('is in the active language and follows a language change', () => {
    setLanguage('fr');
    const tree = render(
      <TimeCoachCard
        reflection={reflection()}
        tone="quiet"
        canUsePremiumReflections
        onDismiss={() => {}}
        onToneChange={() => {}}
        onBirthDatePress={() => {}}
      />,
    );
    expect(texts(tree)).toEqual(
      expect.arrayContaining([
        'Coach du temps',
        'Pas aujourd’hui',
        'Calme',
        'Radical',
      ]),
    );

    act(() => setLanguage('ja'));
    expect(texts(tree)).toEqual(
      expect.arrayContaining([
        'タイムコーチ',
        '今日はやめる',
        '穏やか',
        'ストレート',
      ]),
    );
  });

  it('says what is locked and offers the birth date, in the active language', () => {
    setLanguage('ru');
    const prompt = generateDailyReflection(
      baseInput({ date: new Date(2026, 4, 5, 9, 0, 0), hasBirthDate: false }),
    );
    const tree = render(
      <TimeCoachCard
        reflection={prompt}
        tone="quiet"
        canUsePremiumReflections={false}
        onDismiss={() => {}}
        onToneChange={() => {}}
        onBirthDatePress={() => {}}
      />,
    );
    expect(texts(tree)).toEqual(
      expect.arrayContaining([
        'Сделайте это личным',
        'Размышления о жизни открываются во время предпросмотра или с Премиумом.',
        'Указать дату рождения',
      ]),
    );
  });

  it('labels a weekly reflection', () => {
    setLanguage('es');
    const weekly = generateDailyReflection(
      baseInput({ date: sundayMorning, dayProgress: 0.4 }),
    );
    const tree = render(
      <TimeCoachCard
        reflection={weekly}
        tone="quiet"
        canUsePremiumReflections
        onDismiss={() => {}}
        onToneChange={() => {}}
        onBirthDatePress={() => {}}
      />,
    );
    expect(texts(tree)).toContain('Semanal');
  });
});

describe('daily reflection hook', () => {
  function Probe() {
    const { reflection } = useDailyReflection();
    return <NativeText>{reflection.title}</NativeText>;
  }

  it('rewrites today’s reflection when the language changes', () => {
    mockUseCase.current = makeUseCase(makePersistence().persistence);
    const tree = render(<Probe />);
    expect(texts(tree)).toEqual(['Today is still yours']);

    act(() => setLanguage('ru'));
    expect(texts(tree)).toEqual(['Сегодня всё ещё ваш']);

    act(() => setLanguage('ja'));
    expect(texts(tree)).toEqual(['今日はまだあなたのもの']);
  });
});
