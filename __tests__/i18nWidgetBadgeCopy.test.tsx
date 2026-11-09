import React from 'react';
import {
  AccessibilityInfo,
  Alert,
  Platform,
  Text as NativeText,
} from 'react-native';
import ReactTestRenderer, { act } from 'react-test-renderer';

import {
  BADGES,
  EMPTY_BADGE_SNAPSHOT,
  getBadgeProgress,
} from '../src/features/badges/domain/badgeCatalog';
import { PERFECT_DAY_MIN_TASKS } from '../src/features/badges/domain/badgeStats';
import type { BadgeView } from '../src/features/badges/domain/useCases/GetBadgesUseCase';
import { useDailyQuests } from '../src/features/badges/hooks/useDailyQuests';
import {
  badgeDescription,
  badgeTitle,
  formatEarnedDate,
  progressLabel,
} from '../src/features/badges/ui/badgeLabels';
import { BadgeShelf } from '../src/features/badges/ui/BadgeShelf';
import { BadgesScreen } from '../src/features/badges/ui/BadgesScreen';
import { BadgeUnlockOverlay } from '../src/features/badges/ui/BadgeUnlockOverlay';
import { DailyQuestsCard } from '../src/features/badges/ui/DailyQuestsCard';
import { WidgetCoachModal } from '../src/features/engagement/ui/WidgetCoachModal';
import { AddToHomeScreenSection } from '../src/features/widgets/ui/AddToHomeScreenSection';
import { DynamicIslandScreen } from '../src/features/widgets/ui/DynamicIslandScreen';
import { HourCalculationScreen } from '../src/features/widgets/ui/HourCalculationScreen';
import { WidgetCustomizationScreen } from '../src/features/widgets/ui/WidgetCustomizationScreen';
import { WidgetScreen } from '../src/features/widgets/ui/WidgetScreen';
import { SUPPORTED_LANGUAGES } from '../src/shared/i18n/languages';
import { resources } from '../src/shared/i18n/resources';
import { setLanguage, t } from '../src/shared/i18n/translate';

// ---- shared mutable state read by the mocks below (names start with `mock`) ----
const mockNavigate = jest.fn();
const mockPremium = { has: false };
const mockStreak = {
  count: 5,
  longest: 8,
  freezeAvailable: true,
  noticedToday: true,
};
const mockStats = { total: 3, completed: 1 };
const mockOverview: {
  badges: BadgeView[];
  earnedCount: number;
  total: number;
} = { badges: [], earnedCount: 0, total: 17 };
const mockLiveStatus = {
  supported: true,
  enabled: false,
  active: false,
  state: 'none',
};
const mockHourState = {
  title: 'Hour timer',
  isRunning: true,
  startTimeMs: 0,
  totalElapsedMs: 0,
};
const mockSyncHour = jest.fn();
const mockStartOverlay = jest.fn();
const mockUsePinWidget = jest.fn();
const mockRequestPin = jest.fn();
const mockWidgetStore = {
  config: {
    type: 'day',
    theme: 'dark',
    layout: 'minimal',
    font: 'clean',
    accent: 'ember',
    showMessage: true,
    message: 'x',
  },
  hydrate: jest.fn(() => Promise.resolve()),
  setType: jest.fn(),
  setTheme: jest.fn(),
  setLayout: jest.fn(),
  setFont: jest.fn(),
  setAccent: jest.fn(),
  setShowMessage: jest.fn(),
  setMessage: jest.fn(),
};

jest.mock('../src/app/di', () => ({
  useWidgetConfigStore: () => mockWidgetStore,
  getDailyTaskStatsUseCase: { execute: () => mockStats },
  observeDailyTasksUseCase: { subscribe: () => () => {} },
}));

jest.mock('../src/shared/ui', () => {
  const { Text: Native, View } = require('react-native');
  const Box = ({ children }: { children?: React.ReactNode }) => (
    <View>{children}</View>
  );
  return {
    Text: Native,
    ScreenGradient: Box,
    GlassCard: Box,
    Card: Box,
    ProgressRing: Box,
    ConfettiBurst: () => null,
    useReduceMotion: () => true,
    PinWidgetButton: ({
      label,
      onPress,
    }: {
      label: string;
      onPress: () => void;
    }) => <Native onPress={onPress}>{label}</Native>,
  };
});

// Every theme token is a plain value; only the shape matters for these tests.
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
    Colors: loose('#888'),
    Shadows: loose({}),
    FontFamily: loose('System'),
    useTheme: () => loose('#888'),
  };
});

jest.mock('../src/features/badges/ui/BadgeMedal', () => ({
  BadgeMedal: () => null,
  TIER_CONFETTI: {
    bronze: ['#fff'],
    silver: ['#fff'],
    gold: ['#fff'],
    ember: ['#fff'],
  },
}));

jest.mock('../src/features/badges/hooks/useBadges', () => ({
  useBadges: () => mockOverview,
}));

jest.mock('../src/features/presence', () => ({
  usePresenceStreak: () => ({ streak: mockStreak }),
}));

jest.mock('../src/shared/hooks/useTodayIso', () => ({
  useTodayIso: () => '2026-10-01',
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('../src/shared/analytics/analytics', () => ({
  logAnalyticsEvent: jest.fn(() => Promise.resolve()),
}));

jest.mock('../src/shared/analytics/useAnalytics', () => ({
  useAnalytics: () => ({ logEvent: jest.fn() }),
}));

jest.mock('../src/shared/navigation/rootNavigationRef', () => ({
  rootNavigationRef: { isReady: () => true, navigate: jest.fn() },
}));

jest.mock('@react-navigation/native', () => {
  const { useEffect } = require('react');
  return {
    useFocusEffect: (effect: () => void) => useEffect(effect, [effect]),
    useNavigation: () => ({ navigate: mockNavigate }),
  };
});

jest.mock('../src/features/premium', () => ({
  useAccessControl: () => ({ hasPremiumBundle: mockPremium.has }),
}));

jest.mock('../src/features/widgets/data/WidgetSync', () => ({
  startLiveActivity: jest.fn(),
  updateLiveActivity: jest.fn(),
  endLiveActivity: jest.fn(),
  getLiveActivityStatus: () => Promise.resolve(mockLiveStatus),
  getLiveActivityWidgetType: () => 'day',
  setLiveActivityWidgetType: jest.fn(),
  canDrawOverlays: () => Promise.resolve(false),
  getOverlayWidgetType: () => 'day',
  isOverlayEnabled: () => false,
  requestOverlayPermission: jest.fn(),
  setOverlayWidgetType: jest.fn(),
  startOverlay: () => mockStartOverlay(),
  stopOverlay: jest.fn(),
  updateOverlay: jest.fn(),
  getHourCalculationState: () => mockHourState,
  syncHourCalculationWidget: (...args: unknown[]) => mockSyncHour(...args),
}));

jest.mock('../src/shared/platform/widgetPin', () => ({
  canPinWidgets: () => Promise.resolve(true),
  requestPinWidget: (...args: unknown[]) => mockRequestPin(...args),
}));

jest.mock('../src/shared/platform/usePinWidget', () => ({
  usePinWidget: (...args: unknown[]) => mockUsePinWidget(...args),
}));

// ---- helpers ----
const mounted: ReactTestRenderer.ReactTestRenderer[] = [];

async function render(element: React.ReactElement) {
  let tree!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    tree = ReactTestRenderer.create(element);
  });
  mounted.push(tree);
  return tree;
}

async function switchLanguage(code: Parameters<typeof setLanguage>[0]) {
  await act(async () => {
    setLanguage(code);
  });
}

/** Every piece of visible text, one string per Text node. */
function texts(tree: ReactTestRenderer.ReactTestRenderer): string[] {
  return tree.root
    .findAllByType(NativeText)
    .map(node => React.Children.toArray(node.props.children).join(''));
}

async function pressText(
  tree: ReactTestRenderer.ReactTestRenderer,
  label: string,
) {
  const textNode = tree.root
    .findAllByType(NativeText)
    .find(
      node => React.Children.toArray(node.props.children).join('') === label,
    );
  let node: ReactTestRenderer.ReactTestInstance | null = textNode ?? null;
  while (node && !node.props.onPress) node = node.parent;
  if (!node) throw new Error(`nothing to press for "${label}"`);
  const press = node.props.onPress;
  await act(async () => {
    press();
  });
}

function view(id: string, patch: { value?: number } = {}): BadgeView {
  const definition = BADGES.find(b => b.id === id)!;
  const progress = getBadgeProgress(definition, {
    ...EMPTY_BADGE_SNAPSHOT,
    [definition.metric]: patch.value ?? 0,
  });
  return {
    definition,
    progress,
    earned: progress.reached,
    earnedOn: progress.reached ? '2026-10-01' : null,
    isNew: false,
  };
}

function asOs(os: 'ios' | 'android') {
  return jest.replaceProperty(Platform, 'OS', os);
}

beforeEach(() => {
  mockPremium.has = false;
  mockStreak.count = 5;
  mockStreak.longest = 8;
  mockStreak.freezeAvailable = true;
  mockStats.total = 3;
  mockStats.completed = 1;
  mockLiveStatus.enabled = false;
  mockHourState.isRunning = true;
  mockUsePinWidget.mockReset();
  mockUsePinWidget.mockReturnValue({
    available: false,
    busy: false,
    pin: jest.fn(),
  });
  mockStartOverlay.mockReset();
  mockSyncHour.mockReset();
  mockNavigate.mockReset();
  Object.values(mockWidgetStore).forEach(fn => {
    if (typeof fn === 'function' && 'mockClear' in fn)
      (fn as jest.Mock).mockClear();
  });
});

afterEach(async () => {
  // Unmount first: resetting the language would otherwise re-render the old trees outside act().
  await act(async () => {
    mounted.splice(0).forEach(tree => tree.unmount());
  });
  setLanguage('en');
});

// ---- messages ----
describe('badge text', () => {
  it('has a title and a description in every language, never a raw key or placeholder', () => {
    for (const { code } of SUPPORTED_LANGUAGES) {
      setLanguage(code);
      for (const badge of BADGES) {
        for (const text of [badgeTitle(badge), badgeDescription(badge)]) {
          expect(text.length).toBeGreaterThan(0);
          expect(text).not.toMatch(/badges\.|\{\{/);
          expect(text).not.toContain('—');
        }
      }
    }
  });

  it('puts the clean-day task minimum into the description in every language', () => {
    const badge = BADGES.find(b => b.id === 'perfect_1')!;
    for (const { code } of SUPPORTED_LANGUAGES) {
      setLanguage(code);
      expect(badgeDescription(badge)).toContain(String(PERFECT_DAY_MIN_TASKS));
    }
  });

  it('writes the progress in the active language, with Russian plural forms', () => {
    expect(progressLabel(view('streak_7', { value: 5 }))).toBe('5 of 7 days');
    expect(progressLabel(view('task_10', { value: 3 }))).toBe('3 of 10 tasks');
    expect(progressLabel(view('opens_50', { value: 12 }))).toBe(
      '12 of 50 opens',
    );
    expect(progressLabel(view('streak_1'))).toBe('Not yet');
    expect(progressLabel(view('streak_1', { value: 1 }))).toBe('Done');

    setLanguage('ru');
    expect(progressLabel(view('streak_3', { value: 2 }))).toBe('2 из 3 дней');
    expect(progressLabel(view('streak_30', { value: 21 }))).toBe(
      '21 из 30 дней',
    );
    expect(progressLabel(view('task_10', { value: 3 }))).toBe('3 из 10 задач');
    expect(progressLabel(view('task_1'))).toBe('Пока нет');
    expect(t('badges.summary.streak', { count: 21, best: 25 })).toBe(
      'Серия: 21 день. Лучшая: 25.',
    );
    expect(t('badges.summary.streak', { count: 2, best: 25 })).toBe(
      'Серия: 2 дня. Лучшая: 25.',
    );
    expect(t('badges.quests.tasks', { count: 5 })).toBe('5 задач');

    setLanguage('de');
    expect(progressLabel(view('task_10', { value: 1 }))).toBe(
      '1 von 10 Aufgaben',
    );
    expect(t('badges.quests.tasks', { count: 1 })).toBe('1 Aufgabe');
  });

  it('formats the earned date in the active language with Latin digits', () => {
    const english = formatEarnedDate('2026-10-01');
    expect(english).toContain('2026');
    setLanguage('de');
    expect(formatEarnedDate('2026-10-01')).not.toBe(english);
    setLanguage('ja');
    expect(formatEarnedDate('2026-10-01')).toContain('10月');
    setLanguage('hi');
    expect(formatEarnedDate('2026-10-01')).toMatch(/2026/);
    expect(formatEarnedDate('2026-10-01')).not.toMatch(/[०-९]/);
    expect(formatEarnedDate(null)).toBe('');
  });
});

describe('widget section labels', () => {
  it('stores eyebrow labels already in capitals, so no runtime upper-casing is needed', () => {
    const keys = Object.keys(resources.en).filter(
      key =>
        key.startsWith('widgets.section.') ||
        key.startsWith('widgets.custom.section.'),
    );
    expect(keys.length).toBeGreaterThan(8);
    for (const { code } of SUPPORTED_LANGUAGES) {
      if (code === 'hi' || code === 'mr' || code === 'ja') continue;
      for (const key of keys) {
        const text = resources[code][key];
        expect(text).toBe(text.toLocaleUpperCase(code));
      }
    }
  });
});

// ---- badges UI ----
describe('badges screen', () => {
  it('relabels the list, the streak line and the progress when the language changes', async () => {
    mockOverview.badges = [
      view('streak_1', { value: 1 }),
      view('streak_7', { value: 5 }),
      view('task_10', { value: 3 }),
    ];
    mockOverview.earnedCount = 1;
    const tree = await render(<BadgesScreen />);
    expect(texts(tree)).toEqual(
      expect.arrayContaining([
        'Streaks',
        'Tasks',
        '1 of 17 badges',
        'Streak: 5 days. Best: 8.',
        'One missed day is forgiven. Ready now.',
        'Day one',
        'Earned',
        '5 of 7 days',
        '3 of 10 tasks',
      ]),
    );

    await switchLanguage('ru');
    expect(texts(tree)).toEqual(
      expect.arrayContaining([
        'Серии',
        'Задачи',
        '1 из 17 значков',
        'Серия: 5 дней. Лучшая: 8.',
        'Один пропущенный день прощается. Готово.',
        'День первый',
        'Получен',
        '5 из 7 дней',
        '3 из 10 задач',
      ]),
    );
    expect(
      tree.root.findAll(
        n =>
          n.props.accessibilityLabel ===
          'День первый. Получен. Откройте UNTIL. Отсчёт начинается здесь.',
      ).length,
    ).toBeGreaterThan(0);

    await switchLanguage('ja');
    expect(texts(tree)).toEqual(
      expect.arrayContaining([
        '連続記録',
        '17個中1個のバッジ',
        '連続記録：5日。最高：8日。',
        '初日',
        '獲得済み',
        '7日中5日',
        '10個中3個',
      ]),
    );
  });

  it('says when the freeze is used', async () => {
    mockStreak.freezeAvailable = false;
    const tree = await render(<BadgesScreen />);
    expect(texts(tree)).toContain(
      'Freeze used. It comes back after 7 days in a row.',
    );
    await switchLanguage('es');
    expect(texts(tree)).toContain(
      'Congelación usada. Vuelve tras 7 días seguidos.',
    );
  });
});

describe('badge shelf', () => {
  it('follows the language for the title, count, next badge and accessibility label', async () => {
    const badges = [
      view('streak_1', { value: 1 }),
      view('task_10', { value: 4 }),
      view('streak_7', { value: 3 }),
    ];
    const tree = await render(
      <BadgeShelf
        overview={{
          badges,
          earnedCount: 1,
          total: BADGES.length,
          upNext: badges[1],
        }}
        onOpen={jest.fn()}
      />,
    );
    expect(texts(tree)).toEqual(
      expect.arrayContaining([
        'Badges',
        '1 of 17  ›',
        'Up next: Ten down',
        '4 of 10 tasks',
      ]),
    );

    await switchLanguage('de');
    expect(texts(tree)).toEqual(
      expect.arrayContaining([
        'Abzeichen',
        '1 von 17  ›',
        'Als Nächstes: Zehn geschafft',
        '4 von 10 Aufgaben',
      ]),
    );
    expect(
      tree.root.findAll(
        n =>
          n.props.accessibilityLabel ===
          'Abzeichen. 1 von 17 erhalten. Alle Abzeichen öffnen.',
      ).length,
    ).toBeGreaterThan(0);
  });
});

describe('daily quests', () => {
  function Quests() {
    return (
      <DailyQuestsCard quests={useDailyQuests()} onQuestPress={jest.fn()} />
    );
  }

  it('relabels the quests without a refresh', async () => {
    const tree = await render(<Quests />);
    expect(texts(tree)).toEqual(
      expect.arrayContaining([
        'Today',
        '2 of 3 done',
        'Open UNTIL',
        'Plan your day',
        '3 tasks',
        'Finish your tasks',
        '1/3',
      ]),
    );

    await switchLanguage('es');
    expect(texts(tree)).toEqual(
      expect.arrayContaining([
        'Hoy',
        '2 de 3 hechas',
        'Abre UNTIL',
        'Planifica tu día',
        '3 tareas',
        'Termina tus tareas',
      ]),
    );

    await switchLanguage('ru');
    expect(texts(tree)).toEqual(
      expect.arrayContaining([
        'Спланируйте день',
        '3 задачи',
        'Выполните свои задачи',
      ]),
    );
  });

  it('invites an empty day to add a task, in the active language', async () => {
    mockStats.total = 0;
    mockStats.completed = 0;
    setLanguage('tr');
    const tree = await render(<Quests />);
    expect(texts(tree)).toContain('Bir görev ekle');
  });
});

describe('badge overlay', () => {
  it('describes an earned badge in German with the date in German', async () => {
    setLanguage('de');
    const tree = await render(
      <BadgeUnlockOverlay
        badge={view('streak_7', { value: 7 })}
        mode="detail"
        earnedCount={1}
        total={17}
        onClose={jest.fn()}
      />,
    );
    const out = texts(tree);
    expect(out).toContain(`Erhalten am ${formatEarnedDate('2026-10-01')}`);
    expect(out).toContain('Eine ganze Woche');
    expect(out).toContain('Öffne UNTIL an 7 Tagen in Folge.');
    expect(out).toContain('Schließen');
  });

  it('celebrates in French, offers the next badge and announces the new one', async () => {
    setLanguage('fr');
    const announce = jest
      .spyOn(AccessibilityInfo, 'announceForAccessibility')
      .mockImplementation(() => {});
    const tree = await render(
      <BadgeUnlockOverlay
        badge={view('streak_7', { value: 7 })}
        mode="unlock"
        remaining={2}
        earnedCount={3}
        total={17}
        onClose={jest.fn()}
      />,
    );
    expect(texts(tree)).toEqual(
      expect.arrayContaining([
        'Nouveau badge',
        'Une semaine complète',
        'Ouvrez UNTIL 7 jours de suite.',
        '3 sur 17 obtenus',
        'Suivant (2 de plus)',
      ]),
    );
    expect(
      tree.root.findAll(
        n => n.props.accessibilityLabel === 'Badge suivant, 2 de plus',
      ).length,
    ).toBeGreaterThan(0);
    expect(announce).toHaveBeenCalledWith(
      'Nouveau badge. Une semaine complète. Ouvrez UNTIL 7 jours de suite.',
    );
    announce.mockRestore();
  });

  it('shows the progress of a locked badge in Japanese', async () => {
    setLanguage('ja');
    const tree = await render(
      <BadgeUnlockOverlay
        badge={view('streak_7', { value: 5 })}
        mode="detail"
        earnedCount={0}
        total={17}
        onClose={jest.fn()}
      />,
    );
    const out = texts(tree);
    expect(out).toContain('7日中5日');
    expect(out).toContain('UNTILを7日連続で開きます。');
    expect(out).not.toContain('新しいバッジ');
  });
});

// ---- widgets UI ----
describe('widgets screen', () => {
  it('keeps the English text', async () => {
    const tree = await render(<WidgetScreen />);
    expect(texts(tree)).toEqual(
      expect.arrayContaining([
        'Widgets',
        'ALWAYS VISIBLE',
        'Dynamic Island',
        'Inactive',
        'PREMIUM HOME SCREEN WIDGETS',
        'Month widget',
        'Upgrade to Premium to add this widget.',
        'MANAGE DATA & FEATURES',
        'Custom counters',
        'Deadlines',
        'Hour calculation',
        'Task report',
        'Long-press the home screen, tap +, then search for Until to add a widget.',
      ]),
    );
  });

  it('shows every section, tile and quick link in German', async () => {
    setLanguage('de');
    const tree = await render(<WidgetScreen />);
    expect(texts(tree)).toEqual(
      expect.arrayContaining([
        'IMMER SICHTBAR',
        'Dynamic Island',
        'Inaktiv',
        'PREMIUM-WIDGETS FÜR DEN HOME-BILDSCHIRM',
        'Monats-Widget',
        'Lebens-Widget',
        'Wechsle zu Premium, um dieses Widget hinzuzufügen.',
        'DATEN & FUNKTIONEN VERWALTEN',
        'Eigene Zähler',
        'Fristen',
        'Stundenrechnung',
        'Aufgabenbericht',
        'Halte den Home-Bildschirm gedrückt, tippe auf + und suche nach Until, um ein Widget hinzuzufügen.',
      ]),
    );
  });

  it('keeps Turkish capitals (dotted İ) because the labels are stored in capitals', async () => {
    setLanguage('tr');
    const tree = await render(<WidgetScreen />);
    expect(texts(tree)).toEqual(
      expect.arrayContaining([
        'HER ZAMAN GÖRÜNÜR',
        'VERİ VE ÖZELLİKLERİ YÖNET',
      ]),
    );
  });

  it('relabels the screen when the language changes', async () => {
    const tree = await render(<WidgetScreen />);
    await switchLanguage('ja');
    expect(texts(tree)).toEqual(
      expect.arrayContaining([
        '常に表示',
        '無効',
        'データと機能の管理',
        '期限',
      ]),
    );
  });

  it('names Live Island and the Android hint on Android', async () => {
    const os = asOs('android');
    try {
      setLanguage('es');
      const tree = await render(<WidgetScreen />);
      expect(texts(tree)).toEqual(
        expect.arrayContaining([
          'Live Island',
          'Inactivo',
          'Mantén pulsada la pantalla de inicio y toca Widgets para añadir un widget de Until.',
        ]),
      );
    } finally {
      os.restore();
    }
  });
});

describe('add to home screen', () => {
  it('lists the widgets, with the Premium ones locked, in English and Japanese', async () => {
    mockUsePinWidget.mockReturnValue({
      available: true,
      busy: false,
      pin: jest.fn(),
    });
    const tree = await render(
      <AddToHomeScreenSection premium={false} onLocked={jest.fn()} />,
    );
    expect(texts(tree)).toEqual(
      expect.arrayContaining([
        'ADD TO HOME SCREEN',
        'Day',
        'Today, live',
        'This year so far',
        'Premium',
        'See Premium',
        'Add',
      ]),
    );

    await switchLanguage('ja');
    expect(texts(tree)).toEqual(
      expect.arrayContaining([
        'ホーム画面に追加',
        '今日、リアルタイム',
        '今年のここまで',
        'プレミアム',
        'プレミアムを見る',
        '追加',
      ]),
    );
  });
});

describe('dynamic island screen', () => {
  it('labels the options and the status, and relabels them without a refresh', async () => {
    const tree = await render(<DynamicIslandScreen />);
    expect(texts(tree)).toEqual(
      expect.arrayContaining([
        'Dynamic Island',
        'What to show',
        'Status',
        'Inactive',
        'Start',
        'Stop',
        'Today',
        'This month',
        'Tasks',
        'Hour timer',
        'Upgrade to Premium to use this',
      ]),
    );

    await switchLanguage('ru');
    expect(texts(tree)).toEqual(
      expect.arrayContaining([
        'Что показывать',
        'Состояние',
        'Неактивно',
        'Старт',
        'Стоп',
        'Сегодня',
        'Этот месяц',
        'Задачи',
        'Часовой таймер',
        'Перейдите на Премиум, чтобы использовать это',
      ]),
    );
  });

  it('explains why the island is not running, in the active language', async () => {
    setLanguage('de');
    const tree = await render(<DynamicIslandScreen />);
    expect(texts(tree)).toEqual(
      expect.arrayContaining([
        'Live Activities sind für UNTIL ausgeschaltet. Schalte sie in den Einstellungen ein, komm zurück und tippe auf Starten.',
        'Einstellungen öffnen',
      ]),
    );
    await switchLanguage('fr');
    expect(texts(tree)).toContain(
      'Les Live Activities sont désactivées pour UNTIL. Activez-les dans les Réglages, puis revenez et touchez Démarrer.',
    );
  });

  it('shows the Live Island screen on Android and keeps a start error in the new language', async () => {
    const os = asOs('android');
    try {
      setLanguage('es');
      const tree = await render(<DynamicIslandScreen />);
      expect(texts(tree)).toEqual(
        expect.arrayContaining([
          'Live Island',
          'Elige una. La píldora compacta y la notificación se actualizan juntas.',
          'Opcional: permite «Mostrar sobre otras apps» para la píldora flotante. El progreso en la pantalla de bloqueo sigue funcionando después de pulsar Iniciar.',
          'Temporizador de horas',
          'Llegará en una próxima actualización.',
        ]),
      );

      mockStartOverlay.mockImplementationOnce(() => {
        throw new Error('no permission');
      });
      await pressText(tree, 'Iniciar');
      expect(texts(tree)).toContain(
        'No se pudo iniciar Live Island. Revisa el permiso de notificaciones e inténtalo de nuevo.',
      );
      await switchLanguage('de');
      expect(texts(tree)).toContain(
        'Live Island konnte nicht gestartet werden. Prüfe die Benachrichtigungsberechtigung und versuche es erneut.',
      );
    } finally {
      os.restore();
    }
  });
});

describe('hour calculation screen', () => {
  it('shows the timer screen in French and asks before resetting', async () => {
    setLanguage('fr');
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const tree = await render(<HourCalculationScreen />);
    expect(texts(tree)).toEqual(
      expect.arrayContaining([
        'Calcul des heures',
        'Titre du widget',
        'Enregistrer',
        'Temps actuel',
        'En cours',
        'Arrêter',
        'Réinitialiser',
      ]),
    );
    // The long-press path names the native widget, which stays in English.
    const hint = texts(tree).find(text => text.includes('Hour calculation'));
    expect(hint).toContain('Until');

    await pressText(tree, 'Réinitialiser');
    expect(alert).toHaveBeenCalledWith(
      'Réinitialiser le minuteur',
      'Arrêter le minuteur et le remettre à 0:00:00 ?',
      [
        expect.objectContaining({ text: 'Annuler', style: 'cancel' }),
        expect.objectContaining({
          text: 'Réinitialiser',
          style: 'destructive',
        }),
      ],
    );
    alert.mockRestore();
  });

  it('falls back to the title of the active language when the title is left empty', async () => {
    setLanguage('tr');
    const tree = await render(<HourCalculationScreen />);
    const input = tree.root.findAllByProps({
      placeholder: 'ör. Mesai saati',
    })[0];
    await act(async () => {
      input.props.onChangeText('   ');
    });
    await pressText(tree, 'Kaydet');
    expect(mockSyncHour).toHaveBeenCalledWith({ title: 'Saat zamanlayıcı' });
  });
});

describe('widget customization screen', () => {
  it('labels every control in German', async () => {
    setLanguage('de');
    const tree = await render(<WidgetCustomizationScreen />);
    expect(texts(tree)).toEqual(
      expect.arrayContaining([
        'Widget-Vorschau',
        'WIDGET-TYP',
        'Heute',
        'Dieser Monat',
        'Dieses Jahr',
        'Leben',
        'DESIGN',
        'Hell',
        'Dunkel',
        'AMOLED',
        'LAYOUT',
        'Minimal',
        'Detailliert',
        'SCHRIFTSTIL',
        'Klar',
        'Gefühlvoll',
        'AKZENTFARBE',
        'PREMIUM',
        'Glut',
        'Ozean',
        'Wald',
        'Pflaume',
        'Rose',
        'Mono',
        'OPTIONALE NACHRICHT',
        'Nachricht anzeigen',
        'Vorlagen',
        'Die Zeit läuft',
        'Oder schreibe eine eigene',
        'Widget hinzufügen',
      ]),
    );
    expect(
      tree.root.findAllByProps({
        placeholder: 'Schreibe eine kurze Erinnerung an dein zukünftiges Ich',
      }).length,
    ).toBeGreaterThan(0);
  });

  it('explains Premium widgets, accents and the add steps in German', async () => {
    setLanguage('de');
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const tree = await render(<WidgetCustomizationScreen />);
    const buttons = [
      expect.objectContaining({ text: 'Nicht jetzt', style: 'cancel' }),
      expect.objectContaining({ text: 'Premium ansehen' }),
    ];

    await pressText(tree, 'Dieser Monat');
    expect(alert).toHaveBeenLastCalledWith(
      'Premium-Widget',
      'Das Monats-Widget gehört zu Premium. Wechsle zu Premium, um es zu deinem Home-Bildschirm hinzuzufügen.',
      buttons,
    );
    await pressText(tree, 'Leben');
    expect(alert).toHaveBeenLastCalledWith(
      'Premium-Widget',
      'Das Lebens-Widget gehört zu Premium. Wechsle zu Premium, um es zu deinem Home-Bildschirm hinzuzufügen.',
      buttons,
    );
    await pressText(tree, 'Ozean');
    expect(alert).toHaveBeenLastCalledWith(
      'Premium-Akzent',
      'Akzentfarben gehören zu Premium. Wechsle zu Premium, um deine Widgets zu personalisieren.',
      buttons,
    );
    expect(mockWidgetStore.setAccent).not.toHaveBeenCalled();

    await pressText(tree, 'Widget hinzufügen');
    expect(alert).toHaveBeenLastCalledWith(
      'Widget hinzufügen',
      'Halte den Home-Bildschirm gedrückt, tippe auf Widgets und wähle dann Until und deine bevorzugte Größe.',
      [{ text: 'OK' }],
    );
    alert.mockRestore();
  });

  it('lets a Premium user pick the accent and drops the Premium tag', async () => {
    mockPremium.has = true;
    setLanguage('de');
    const tree = await render(<WidgetCustomizationScreen />);
    expect(texts(tree)).not.toContain('PREMIUM');
    await pressText(tree, 'Ozean');
    expect(mockWidgetStore.setAccent).toHaveBeenCalledWith('ocean');
  });

  it('keeps the English preview text', async () => {
    mockWidgetStore.config.layout = 'detailed';
    try {
      const tree = await render(<WidgetCustomizationScreen />);
      expect(texts(tree)).toEqual(
        expect.arrayContaining([
          'Widget preview',
          'Detailed',
          'done',
          '42% of time used',
          '58% remaining',
        ]),
      );
      await switchLanguage('ru');
      expect(texts(tree)).toEqual(
        expect.arrayContaining([
          'Предпросмотр виджета',
          'Подробно',
          'готово',
          '42 % времени использовано',
          'осталось 58 %',
        ]),
      );
    } finally {
      mockWidgetStore.config.layout = 'minimal';
    }
  });
});

describe('widget coach and manual steps', () => {
  it('offers the setup steps in Spanish when the launcher cannot pin a widget', async () => {
    const os = asOs('android');
    try {
      setLanguage('es');
      const tree = await render(
        <WidgetCoachModal visible onDismiss={jest.fn()} />,
      );
      expect(texts(tree)).toEqual(
        expect.arrayContaining([
          'Añade el widget del día',
          'Fija UNTIL en tu pantalla de inicio para ver cuánto queda de hoy y de este mes sin abrir la app.',
          'Configurar widgets',
          'Ahora no',
          'Mantén pulsada la pantalla de inicio → Widgets → UNTIL → Day',
        ]),
      );
    } finally {
      os.restore();
    }
  });

  it('tells the user to add the widget by hand, in the language active at that moment', async () => {
    const { usePinWidget } = jest.requireActual(
      '../src/shared/platform/usePinWidget',
    );
    mockRequestPin.mockResolvedValue('unsupported');
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    let pin!: () => Promise<unknown>;
    function Probe() {
      pin = usePinWidget('day', 'test').pin;
      return null;
    }
    await render(<Probe />);

    setLanguage('fr');
    await act(async () => {
      await pin();
    });
    expect(alert).toHaveBeenLastCalledWith(
      'Ajoutez-le à la main',
      'Appuyez longuement sur un espace vide de l’écran d’accueil, touchez Widgets, puis choisissez UNTIL.',
    );

    setLanguage('tr');
    await act(async () => {
      await pin();
    });
    expect(alert).toHaveBeenLastCalledWith(
      'Elle ekle',
      "Ana ekranda boş bir yere uzun bas, Widget'lar'a dokun, sonra UNTIL'i seç.",
    );
    alert.mockRestore();
  });
});
