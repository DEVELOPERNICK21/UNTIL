import React from 'react';
import { Alert, Platform, Text as NativeText } from 'react-native';
import ReactTestRenderer, { act } from 'react-test-renderer';

import {
  formatDaysLeft,
  formatSignedDaysUntil,
} from '../src/features/countdowns/domain/daysLeft';
import { CountdownHomeCard } from '../src/features/countdowns/ui/CountdownHomeCard';
import { CountdownsScreen } from '../src/features/countdowns/ui/CountdownsScreen';
import { CustomCountersScreen } from '../src/features/counters/ui/CustomCountersScreen';
import { SUPPORTED_LANGUAGES } from '../src/shared/i18n/languages';
import { setLanguage } from '../src/shared/i18n/translate';

const mockStore: {
  countdowns: { id: string; title: string; date: string }[];
  counters: { id: string; title: string; count: number }[];
} = { countdowns: [], counters: [] };

jest.mock('../src/app/di', () => ({
  getCountdownsUseCase: { execute: () => mockStore.countdowns },
  addCountdownUseCase: { execute: jest.fn() },
  removeCountdownUseCase: { execute: jest.fn() },
  getCustomCountersUseCase: { execute: () => mockStore.counters },
  addCustomCounterUseCase: { execute: jest.fn() },
  removeCustomCounterUseCase: { execute: jest.fn() },
}));

// A paid plan with room to spare: these tests are about words, not limits (see limitUpgradeFlow).
jest.mock('../src/features/premium', () => ({
  useItemLimit: () => ({ limit: 20, hasPremium: true, ceiling: 20 }),
  useLimitUpgradePrompt: () => jest.fn(),
}));

jest.mock('../src/shared/ui', () => {
  const { Text: Native, View } = require('react-native');
  const Box = ({ children }: { children?: React.ReactNode }) => (
    <View>{children}</View>
  );
  return { Text: Native, ScreenGradient: Box, Card: Box, GlassCard: Box };
});

jest.mock('../src/shared/theme', () => ({
  Spacing: { 1: 4, 2: 8, 3: 12, 4: 16, 5: 20 },
  Radius: { sm: 4, md: 8, lg: 12 },
  Colors: { divider: '#333', textPrimary: '#fff', textSecondary: '#ccc' },
  Typography: { label: 14 },
  Weight: { regular: 'regular', semibold: 'semibold' },
  getFontFamilyForWeight: () => 'System',
  useTheme: () => ({
    textPrimary: '#fff',
    textSecondary: '#ccc',
    percent: '#f60',
    glassBorder: '#444',
  }),
}));

jest.mock('@react-navigation/native', () => {
  const { useEffect } = require('react');
  return {
    useFocusEffect: (effect: () => void) => useEffect(effect, [effect]),
    useNavigation: () => ({ navigate: jest.fn() }),
  };
});

jest.mock('@react-native-community/datetimepicker', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('../src/shared/platform/useWidgetSyncActions', () => ({
  useWidgetSyncActions: () => ({
    syncCountdowns: jest.fn(),
    syncCustomCounters: jest.fn(),
  }),
}));

jest.mock('../src/shared/analytics/useAnalytics', () => ({
  useAnalytics: () => ({ logEvent: jest.fn() }),
}));

jest.mock('../src/shared/analytics/analytics', () => ({
  logAnalyticsEvent: jest.fn(),
}));

/** Local `YYYY-MM-DD` for today plus an offset in days. */
function dateIn(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
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

/** Every piece of visible text, one string per Text node. */
function texts(tree: ReactTestRenderer.ReactTestRenderer): string[] {
  return tree.root
    .findAllByType(NativeText)
    .map(node => React.Children.toArray(node.props.children).join(''));
}

function pressText(tree: ReactTestRenderer.ReactTestRenderer, label: string) {
  const textNode = tree.root
    .findAllByType(NativeText)
    .find(node => React.Children.toArray(node.props.children).join('') === label);
  let node: ReactTestRenderer.ReactTestInstance | null = textNode ?? null;
  while (node && !node.props.onPress) node = node.parent;
  if (!node) throw new Error(`nothing to press for "${label}"`);
  const press = node.props.onPress;
  act(() => press());
}

beforeEach(() => {
  mockStore.countdowns = [];
  mockStore.counters = [];
});

afterEach(() => {
  // Unmount first: resetting the language would otherwise re-render the old trees outside act().
  act(() => {
    mounted.splice(0).forEach(tree => tree.unmount());
  });
  setLanguage('en');
});

describe('day labels', () => {
  it('keeps the English wording', () => {
    expect(formatSignedDaysUntil(5)).toBe('5 days left');
    expect(formatSignedDaysUntil(1)).toBe('1 day left');
    expect(formatSignedDaysUntil(0)).toBe('Today');
    expect(formatSignedDaysUntil(-1)).toBe('1 day ago');
    expect(formatSignedDaysUntil(-3)).toBe('3 days ago');
    expect(formatDaysLeft(0)).toBe('Today');
    expect(formatDaysLeft(2)).toBe('2 days left');
    expect(formatSignedDaysUntil(1234)).toBe('1,234 days left');
  });

  it('writes a label for every count in every language, never an empty or raw key', () => {
    for (const { code } of SUPPORTED_LANGUAGES) {
      setLanguage(code);
      for (let days = -40; days <= 40; days += 1) {
        const label = formatSignedDaysUntil(days);
        expect(label).toBeTruthy();
        expect(label).not.toMatch(/countdowns\.|common\.|\{\{/);
        if (days !== 0) expect(label).toContain(String(Math.abs(days)));
      }
      expect(formatDaysLeft(0)).not.toMatch(/common\./);
    }
  });

  it('uses the Russian plural forms', () => {
    setLanguage('ru');
    expect(formatSignedDaysUntil(1)).toBe('Остался 1 день');
    expect(formatSignedDaysUntil(2)).toBe('Осталось 2 дня');
    expect(formatSignedDaysUntil(5)).toBe('Осталось 5 дней');
    expect(formatSignedDaysUntil(11)).toBe('Осталось 11 дней');
    expect(formatSignedDaysUntil(21)).toBe('Остался 21 день');
    expect(formatSignedDaysUntil(-22)).toBe('22 дня назад');
    expect(formatSignedDaysUntil(-25)).toBe('25 дней назад');
  });

  it('reads naturally in Spanish, German and Japanese', () => {
    setLanguage('es');
    expect(formatSignedDaysUntil(1)).toBe('Falta 1 día');
    expect(formatSignedDaysUntil(3)).toBe('Faltan 3 días');
    setLanguage('de');
    expect(formatSignedDaysUntil(-1)).toBe('Vor 1 Tag');
    expect(formatSignedDaysUntil(-2)).toBe('Vor 2 Tagen');
    setLanguage('ja');
    expect(formatSignedDaysUntil(3)).toBe('あと3日');
  });
});

describe('deadlines screen', () => {
  it('shows the empty state and the form in the active language', () => {
    const tree = render(<CountdownsScreen />);
    expect(texts(tree)).toEqual(
      expect.arrayContaining([
        'Deadlines',
        'No deadlines yet. Add one above, then add the Deadline widget to your home screen.',
        'Add',
      ]),
    );
    expect(
      tree.root.findByProps({ placeholder: 'Title (e.g. Project, Interview)' }),
    ).toBeTruthy();

    act(() => setLanguage('de'));
    expect(texts(tree)).toEqual(
      expect.arrayContaining([
        'Fristen',
        'Noch keine Fristen. Füge oben eine hinzu und lege dann das Frist-Widget auf deinen Startbildschirm.',
        'Hinzufügen',
      ]),
    );
    expect(
      tree.root.findByProps({
        placeholder: 'Titel (z. B. Projekt, Vorstellungsgespräch)',
      }),
    ).toBeTruthy();
  });

  it('relabels an existing deadline when the language changes, without a refresh', () => {
    mockStore.countdowns = [{ id: 'a', title: 'Exam', date: dateIn(21) }];
    const tree = render(<CountdownsScreen />);
    const row = () => texts(tree).find(text => text.includes('Exam') === false && /·/.test(text));
    expect(row()).toMatch(/· 21 days left$/);

    act(() => setLanguage('ru'));
    expect(row()).toMatch(/· Остался 21 день$/);

    act(() => setLanguage('ja'));
    expect(row()).toMatch(/· あと21日$/);
    expect(texts(tree)).toContain('削除');
  });

  it('asks before removing, in the active language', () => {
    mockStore.countdowns = [{ id: 'a', title: 'Exam', date: dateIn(3) }];
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    setLanguage('es');
    const tree = render(<CountdownsScreen />);
    pressText(tree, 'Eliminar');
    expect(alert).toHaveBeenCalledWith(
      'Eliminar cuenta regresiva',
      '¿Eliminar «Exam»?',
      [
        expect.objectContaining({ text: 'Cancelar' }),
        expect.objectContaining({ text: 'Eliminar', style: 'destructive' }),
      ],
    );
    alert.mockRestore();
  });
});

describe('countdown card on Home', () => {
  it('invites you to add one, then shows the next countdown with its label', () => {
    setLanguage('tr');
    const tree = render(<CountdownHomeCard />);
    expect(texts(tree)).toEqual([
      'GERİ SAYIMLAR',
      'Bir şeye doğru geri say',
      'Bir sınav, bir yolculuk, bir doğum günü, bir son tarih.',
      'Ekle',
    ]);

    mockStore.countdowns = [
      { id: 'a', title: 'Trip', date: dateIn(40) },
      { id: 'b', title: 'Exam', date: dateIn(9) },
    ];
    const withData = render(<CountdownHomeCard />);
    expect(texts(withData)).toEqual([
      'SONRAKİ GERİ SAYIM',
      'Exam',
      '9 gün kaldı',
    ]);

    act(() => setLanguage('hi'));
    expect(texts(withData)).toEqual(['अगला काउंटडाउन', 'Exam', '9 दिन बचे']);
  });
});

describe('counters screen', () => {
  it('shows the empty state and the install hint for the platform', () => {
    setLanguage('fr');
    const tree = render(<CustomCountersScreen />);
    expect(texts(tree)).toEqual(
      expect.arrayContaining([
        'Compteurs personnalisés',
        'Aucun compteur pour le moment. Ajoutez-en un ci-dessus, puis ajoutez le widget Compteur depuis votre écran d’accueil et choisissez ce compteur.',
        'Appuyez longuement sur l’écran d’accueil → + → recherchez Until → ajoutez le widget « Counter ».',
      ]),
    );

    jest.replaceProperty(Platform, 'OS', 'android');
    try {
      const android = render(<CustomCountersScreen />);
      expect(texts(android)).toContain(
        'Appuyez longuement sur l’écran d’accueil → Widgets → Until → Counter.',
      );
    } finally {
      jest.restoreAllMocks();
    }
  });

  it('shows the count with grouping and warns about losing it in the active language', () => {
    mockStore.counters = [{ id: 'c', title: 'Water', count: 1234 }];
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const tree = render(<CustomCountersScreen />);
    expect(texts(tree)).toContain('Count: 1,234');

    act(() => setLanguage('de'));
    expect(texts(tree)).toContain('Stand: 1.234');
    pressText(tree, 'Entfernen');
    expect(alert).toHaveBeenCalledWith(
      'Zähler entfernen',
      '„Water“ entfernen? Der Zählerstand (1.234) geht verloren.',
      expect.any(Array),
    );
    alert.mockRestore();
  });
});
