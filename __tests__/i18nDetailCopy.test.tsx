import React from 'react';
import { Alert, Text as NativeText } from 'react-native';
import ReactTestRenderer, { act } from 'react-test-renderer';

import { shouldIntervene } from '../src/features/activity/domain/intervention';
import { InterventionHomeCard } from '../src/features/activity/ui/InterventionHomeCard';
import { emberTapHint } from '../src/features/ember/domain/emberInsights';
import { FeatureDiscoveryModal } from '../src/features/engagement/ui/FeatureDiscoveryModal';
import { ReminderOptInModal } from '../src/features/engagement/ui/ReminderOptInModal';
import { LifeScreen } from '../src/features/life/ui/LifeScreen';
import { TasksComingSoonScreen } from '../src/features/tasks/ui/TasksComingSoonScreen';
import { DayDetailScreen } from '../src/features/time/ui/DayDetailScreen';
import { MonthDetailScreen } from '../src/features/time/ui/MonthDetailScreen';
import { YearDetailScreen } from '../src/features/time/ui/YearDetailScreen';
import { SplashScreen } from '../src/app/splash/SplashScreen';
import { promptDesktopDownload } from '../src/shared/desktopDownload';
import activityMessages from '../src/shared/i18n/locales/en/activity.json';
import detailMessages from '../src/shared/i18n/locales/en/detail.json';
import engagementMessages from '../src/shared/i18n/locales/en/engagement.json';
import { SUPPORTED_LANGUAGES } from '../src/shared/i18n/languages';
import {
  setLanguage,
  tIn,
  type TranslationKey,
} from '../src/shared/i18n/translate';

const NB = ' ';

// ---- state read by the mocks below (names start with `mock`) ----
const mockTime: {
  state: Record<string, number | undefined>;
  birthDate?: string;
} = {
  state: {},
};
const mockAccess = { canAccessLife: true, hasPremiumBundle: false };
const mockGoals = { enabled: true };
const mockNavigate = jest.fn();
const mockTotals = { nothing: 1.5, tracking: false };
const mockLimit = { limitCrossed: false };

jest.mock('../src/features/time/hooks/useObserveTimeState', () => ({
  useObserveTimeState: () => ({
    timeState: mockTime.state,
    userProfile: { birthDate: mockTime.birthDate, deathAge: 80 },
  }),
}));

jest.mock('../src/features/time', () => ({
  PeriodDetailScreen: jest.requireActual(
    '../src/features/time/ui/PeriodDetailScreen',
  ).PeriodDetailScreen,
  useObserveTimeState: () => ({
    timeState: mockTime.state,
    userProfile: { birthDate: mockTime.birthDate, deathAge: 80 },
  }),
}));

jest.mock('../src/features/premium', () => ({
  useAccessControl: () => ({
    canAccessLife: mockAccess.canAccessLife,
    hasPremiumBundle: mockAccess.hasPremiumBundle,
  }),
  LifeUnlockEndedModal: () => null,
}));

jest.mock('../src/features/presence', () => ({
  usePresenceStreak: () => ({ streak: { count: 5 } }),
}));

jest.mock('../src/features/life/hooks/useTrackLifeScreenVisit', () => ({
  useTrackLifeScreenVisit: () => {},
}));

jest.mock('../src/features/life/hooks/useLifeUnlockPaywallPrompt', () => ({
  useLifeUnlockPaywallPrompt: () => ({ visible: false, dismiss: () => {} }),
}));

jest.mock('../src/shared/hooks/useLifeWeeks', () => ({
  useLifeWeeks: () => ({
    totalWeeks: 4160,
    livedWeeks: 1300,
    renderWeeks: 4160,
    renderLivedWeeks: 1300,
  }),
}));

jest.mock('../src/shared/featureFlags/useGoalsFeatureEnabled', () => ({
  useGoalsFeatureEnabled: () => mockGoals.enabled,
}));

jest.mock('../src/features/activity/hooks/useInterventionState', () => ({
  useInterventionState: () => ({
    limitCrossed: mockLimit.limitCrossed,
    message: mockLimit.limitCrossed ? 'x' : null,
  }),
}));
jest.mock('../src/features/activity/hooks/useObserveCategoryTotals', () => ({
  useObserveCategoryTotals: () => ({
    today: { nothing: mockTotals.nothing },
    currentCategory: mockTotals.tracking ? 'nothing' : null,
  }),
}));
jest.mock('../src/features/activity/hooks/useLogActivity', () => ({
  useLogActivity: () => ({
    startCategory: jest.fn(),
    endCurrent: jest.fn(),
    addPastBlock: jest.fn(),
  }),
}));
jest.mock('../src/features/activity/hooks/useDailyNothingLimit', () => ({
  useDailyNothingLimit: () => ({ limitHours: 3 }),
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}));

jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return { SafeAreaView: View };
});

jest.mock('../src/shared/ui', () => {
  const { Text: Native, View } = require('react-native');
  const Box = ({ children }: { children?: React.ReactNode }) => (
    <View>{children}</View>
  );
  const Nothing = () => null;
  return {
    Text: Native,
    ScreenGradient: Box,
    GlassCard: Box,
    ProgressLine: Nothing,
    CircularProgress: Nothing,
    PeriodGlyph: Nothing,
    PeriodDotsGrid: Nothing,
    LifeWeeksGrid: Nothing,
  };
});

jest.mock('../src/shared/ui/useReduceMotion', () => ({
  useReduceMotion: () => true,
}));

jest.mock('../src/shared/theme', () => {
  const loose = (value: unknown) =>
    new Proxy(
      {},
      { get: (_target, key) => (key === 'then' ? undefined : value) },
    );
  return {
    Spacing: loose(8),
    Radius: loose(8),
    Typography: loose(14),
    FontFamily: loose('System'),
    Shadows: loose({}),
    SplashColors: loose('#fff'),
    Weight: loose('regular'),
    getFontFamilyForWeight: () => 'System',
    getProgressColor: () => '#E87C20',
    feelForPeriod: jest.requireActual('../src/shared/theme/emotionalCopy')
      .feelForPeriod,
    useTheme: () => loose('#888'),
  };
});

jest.mock('../src/shared/analytics/analytics', () => ({
  logAnalyticsEvent: jest.fn(() => Promise.resolve()),
}));
jest.mock('../src/shared/analytics/useAnalytics', () => ({
  useAnalytics: () => ({ logEvent: jest.fn() }),
}));
jest.mock('../src/shared/navigation/rootNavigationRef', () => ({
  rootNavigationRef: { isReady: () => true, navigate: jest.fn() },
}));
jest.mock('../src/config/monetization', () => ({
  DESKTOP_DOWNLOAD_URLS: { mac: 'mac', windows: 'win', page: 'page' },
}));

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

function pressText(tree: ReactTestRenderer.ReactTestRenderer, label: string) {
  const textNode = tree.root
    .findAllByType(NativeText)
    .find(
      node => React.Children.toArray(node.props.children).join('') === label,
    );
  let node: ReactTestRenderer.ReactTestInstance | null = textNode ?? null;
  while (node && !node.props.onPress) node = node.parent;
  if (!node) throw new Error(`nothing to press for "${label}"`);
  const press = node.props.onPress;
  act(() => press());
}

beforeEach(() => {
  jest.useFakeTimers({ now: new Date(2026, 4, 25, 18, 0, 0) });
  mockTime.state = {};
  mockTime.birthDate = undefined;
  mockAccess.canAccessLife = true;
  mockAccess.hasPremiumBundle = false;
  mockGoals.enabled = true;
  mockTotals.nothing = 1.5;
  mockTotals.tracking = false;
  mockLimit.limitCrossed = false;
  mockNavigate.mockClear();
});

afterEach(() => {
  act(() => {
    mounted.splice(0).forEach(tree => tree.unmount());
  });
  setLanguage('en');
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('new messages', () => {
  it('leave no placeholder open in any language', () => {
    const keys = [
      ...Object.entries(detailMessages),
      ...Object.entries(engagementMessages),
      ...Object.entries(activityMessages),
    ];
    for (const { code } of SUPPORTED_LANGUAGES) {
      for (const [key, english] of keys) {
        const names = [...english.matchAll(/\{\{\s*(\w+)\s*\}\}/g)].map(
          m => m[1],
        );
        const params = Object.fromEntries(names.map(name => [name, 7]));
        const out = tIn(code, key as TranslationKey, params);
        expect(out.trim()).not.toBe('');
        expect(out).not.toMatch(/\{\{|^detail\.|^engagement\.|^activity\./);
      }
    }
  });
});

describe('day, month and year detail screens', () => {
  it('keeps the English wording of the day screen', () => {
    const tree = render(<DayDetailScreen />);
    expect(texts(tree)).toEqual(
      expect.arrayContaining([
        'Today',
        'Every second counts',
        'Seconds',
        'Updates every second',
        'Live clock. Tap the ring to feel the pulse',
        'Passed',
        '18h 0m 0s',
        'Left',
        '5h 59m 59s',
        '75% of the day passed · 25% left',
        "Today's tasks",
        'Add and tick off your daily tasks →',
      ]),
    );
  });

  it('writes the day screen in the active language and follows a language change', () => {
    setLanguage('de');
    const tree = render(<DayDetailScreen />);
    expect(texts(tree)).toEqual(
      expect.arrayContaining([
        'Heute',
        'Jede Sekunde zählt',
        'Vergangen',
        'Übrig',
        `75${NB}% des Tages sind vergangen · 25${NB}% übrig`,
      ]),
    );
    act(() => setLanguage('ru'));
    expect(texts(tree)).toEqual(
      expect.arrayContaining([
        'Каждая секунда на счету',
        '18ч 0м 0с',
        '5ч 59м 59с',
        `75${NB}% дня прошло · осталось 25${NB}%`,
      ]),
    );
  });

  it('explains that tasks are not there yet, when the goals feature is off', () => {
    mockGoals.enabled = false;
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    setLanguage('de');
    const tree = render(<DayDetailScreen />);
    pressText(tree, tIn('de', 'nav.todaysTasks'));
    expect(alert).toHaveBeenCalledWith(
      'Demnächst',
      'Tagesaufgaben stehen in einem kommenden Update bereit.',
    );
  });

  it('writes the month and year screens in the active language', () => {
    mockTime.state = {
      month: 0.8,
      remainingDaysMonth: 6,
      year: 0.73,
      remainingDaysYear: 100,
    };
    const month = render(<MonthDetailScreen />);
    expect(texts(month)).toEqual(
      expect.arrayContaining([
        '25 of 31 days · 20% of month remaining',
        'Days passed',
        'Days left',
      ]),
    );
    const year = render(<YearDetailScreen />);
    expect(texts(year)).toEqual(
      expect.arrayContaining([
        '265 / 365 days',
        '265 of 365 days · 27% of year remaining',
      ]),
    );

    act(() => setLanguage('ru'));
    expect(texts(month)).toEqual(
      expect.arrayContaining([
        `25 из 31 дн. · осталось 20${NB}% месяца`,
        'Дней прошло',
        'Дней осталось',
      ]),
    );
    expect(texts(year)).toEqual(
      expect.arrayContaining([
        '265 / 365 дн.',
        `265 из 365 дн. · осталось 27${NB}% года`,
      ]),
    );
    act(() => setLanguage('ja'));
    expect(texts(month)).toContain('31日中25日 · 今月の残り20%');
  });
});

describe('life screen', () => {
  it('asks for a birth date, then offers Premium, in the active language', () => {
    setLanguage('fr');
    const tree = render(<LifeScreen />);
    expect(texts(tree)).toEqual(
      expect.arrayContaining([
        'Votre vie',
        '5 jours de présence · Ember est avec vous',
        'Indiquez votre date de naissance dans Réglages pour voir quelle part de votre vie est passée et combien il en reste.',
        'Ouvrir les réglages →',
      ]),
    );
    pressText(tree, 'Ouvrir les réglages →');
    expect(mockNavigate).toHaveBeenCalledWith('Settings');

    mockTime.birthDate = '1995-01-01';
    mockAccess.canAccessLife = false;
    const locked = render(<LifeScreen />);
    expect(texts(locked)).toContain('Débloquer Premium →');
  });

  it('shows what has been lived, with grouping that follows the language', () => {
    mockTime.birthDate = '1995-01-01';
    mockTime.state = { life: 0.3, remainingDaysLife: 20000 };
    const tree = render(<LifeScreen />);
    expect(texts(tree)).toEqual(
      expect.arrayContaining([
        'You have lived',
        '1,300 weeks / 4,160 weeks',
        'Days lived',
        'Based on 80 years. 30% used · 70% remaining.',
      ]),
    );
    act(() => setLanguage('de'));
    expect(texts(tree)).toEqual(
      expect.arrayContaining([
        'Du hast gelebt',
        '1.300 Wochen / 4.160 Wochen',
        `Basierend auf 80 Jahren. 30${NB}% verbraucht · 70${NB}% übrig.`,
      ]),
    );
  });
});

describe('engagement prompts', () => {
  it('invites to the day detail in the active language', () => {
    setLanguage('es');
    const tree = render(
      <FeatureDiscoveryModal visible onDismiss={() => {}} onCta={() => {}} />,
    );
    expect(texts(tree)).toEqual([
      'Ve más a fondo con UNTIL',
      'Entra en el detalle de hoy o prueba las tareas diarias para crear un ritmo alrededor de tu tiempo.',
      'Explorar el detalle de hoy',
      'Probar tareas diarias',
      'Ahora no',
    ]);
  });

  it('offers the morning reminder and can be postponed', () => {
    const onDismiss = jest.fn();
    setLanguage('tr');
    const tree = render(
      <ReminderOptInModal
        visible
        onAccept={() => Promise.resolve(true)}
        onDismiss={onDismiss}
      />,
    );
    expect(texts(tree)).toEqual([
      'Her sabah sakin bir hatırlatma?',
      'Saat 08.00’de tek bir satır: haftanın ve yılının ne kadarı geçti. Başka hiçbir şey yok ve istediğin zaman Ayarlar’dan kapatabilirsin.',
      'Evet, hatırlat',
      'Şimdi değil',
    ]);
    pressText(tree, 'Şimdi değil');
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});

describe('lost-time card', () => {
  it('teases the feature before Premium and shows the budget after, in the active language', () => {
    setLanguage('fr');
    const locked = render(<InterventionHomeCard />);
    expect(texts(locked)).toEqual([
      'Alertes de temps perdu',
      'Débloquer',
      'Notez les heures perdues. Recevez un rappel quand vous dépassez votre limite quotidienne.',
    ]);

    mockAccess.hasPremiumBundle = true;
    const open = render(<InterventionHomeCard />);
    expect(texts(open)).toEqual([
      'Temps perdu aujourd’hui',
      '1h 30m / 3h',
      'Il reste 1h 30m avant l’alerte.',
      'Suivre',
      '+30m',
      '+1h',
    ]);
    act(() => setLanguage('ru'));
    expect(texts(open)).toEqual([
      'Потерянное время сегодня',
      '1ч 30м / 3ч',
      'До оповещения осталось 1ч 30м.',
      'Учёт',
      '+30м',
      '+1ч',
    ]);
  });

  it('shows the tracking state and the crossed-limit line', () => {
    mockAccess.hasPremiumBundle = true;
    mockTotals.tracking = true;
    setLanguage('ja');
    const tree = render(<InterventionHomeCard />);
    expect(texts(tree)).toEqual(
      expect.arrayContaining([
        '記録中です。集中し直したら止めましょう。',
        '停止',
      ]),
    );
    expect(shouldIntervene(4, 3).message).toBe('この1日は二度と戻りません。');
    expect(shouldIntervene(1, 3).message).toBeNull();
  });
});

describe('desktop download offer', () => {
  it('is worded in the active language', () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    setLanguage('es');
    promptDesktopDownload();
    expect(alert).toHaveBeenCalledWith(
      'UNTIL en Mac y Windows',
      'El % del día en la barra de menús o la bandeja. La misma cuenta que este teléfono. Abre el instalador. Termina la descarga en ese ordenador.',
      [
        expect.objectContaining({ text: 'Mac' }),
        expect.objectContaining({ text: 'Windows' }),
        expect.objectContaining({ text: 'Cancelar', style: 'cancel' }),
      ],
    );
  });
});

describe('splash, tasks preview and the Ember hint', () => {
  it('writes the splash lines in the active language', () => {
    setLanguage('fr');
    const tree = render(<SplashScreen />);
    expect(texts(tree)).toEqual(
      expect.arrayContaining([
        'UNTIL',
        'LE FUTUR, C’EST MAINTENANT',
        'PREMIUM · MINIMALISTE · INTEMPOREL',
        'INITIALISATION',
        'CONÇU POUR L’EXCELLENCE',
      ]),
    );
  });

  it('writes the tasks preview in the active language', () => {
    setLanguage('es');
    const tree = render(<TasksComingSoonScreen />);
    expect(texts(tree)).toEqual(
      expect.arrayContaining([
        'Próximamente',
        'Lo que viene',
        'Un adelanto rápido. Toca arriba para cerrar.',
        'Metas del mes con un progreso que se ve de un vistazo',
      ]),
    );
  });

  it('says how to get another tip, in the active language', () => {
    expect(emberTapHint()).toBe('Tap again for another whisper');
    setLanguage('tr');
    expect(emberTapHint()).toBe('Bir fısıltı daha için tekrar dokun');
  });
});
