import fs from 'fs';
import path from 'path';
import React from 'react';
import { Alert, Platform, Text as NativeText } from 'react-native';
import ReactTestRenderer, { act } from 'react-test-renderer';

import { CrashErrorBoundary } from '../src/app/CrashErrorBoundary';
import { checkForAppUpdate as checkInAppUpdate } from '../src/features/app-update/data/InAppUpdate';
import type { UpdateDecision } from '../src/features/app-update/domain/updatePolicy';
import { UpdateSheet } from '../src/features/app-update/ui/UpdateSheet';
import { SharePromptModal } from '../src/features/engagement/ui/SharePromptModal';
import { ShareSnapshotScreen } from '../src/features/share/ui/ShareSnapshotScreen';
import { shareImageLanguage } from '../src/features/share/ui/shareImageLanguage';
import { SUPPORTED_LANGUAGES } from '../src/shared/i18n/languages';
import { setLanguage, tIn } from '../src/shared/i18n/translate';

const NB = ' ';

// ---- state read by the mocks below (names start with `mock`) ----
const mockNavigate = jest.fn();
const mockSetOptions = jest.fn();
const mockShareOpen = jest.fn(() => Promise.resolve());
const mockStartUpdate = jest.fn(() => Promise.resolve());
const mockCanvas: { current: null | { makeImageSnapshot: () => unknown } } = {
  current: null,
};
const mockFonts = { ready: false };

jest.mock('@shopify/react-native-skia', () => {
  const { forwardRef } = require('react');
  const Nothing = forwardRef(() => null);
  const anyMethod: object = new Proxy(
    {},
    { get: (_t, key) => (key === 'then' ? undefined : () => anyMethod) },
  );
  return {
    Canvas: Nothing,
    Group: Nothing,
    Image: Nothing,
    Path: Nothing,
    Rect: Nothing,
    Text: Nothing,
    Skia: { Path: { Make: () => anyMethod } },
    useCanvasRef: () => mockCanvas,
    useFont: () =>
      mockFonts.ready ? { getTextWidth: () => 10, getSize: () => 10 } : null,
    useImage: () => null,
  };
});

jest.mock('react-native-share', () => ({
  __esModule: true,
  default: { open: (...args: unknown[]) => mockShareOpen(...(args as [])) },
}));

jest.mock('react-native-fs', () => ({
  __esModule: true,
  default: {
    CachesDirectoryPath: '/cache',
    writeFile: jest.fn(() => Promise.resolve()),
  },
}));

jest.mock('../src/assets/fonts/Inter_18pt-Regular.ttf', () => 1);
jest.mock('../src/assets/fonts/Inter_18pt-Medium.ttf', () => 1);
jest.mock('../src/assets/fonts/Inter_18pt-Bold.ttf', () => 1);

jest.mock('../src/assets/images', () => ({ appLogoIcon: 1 }));

jest.mock('../src/config/storeUrls', () => ({
  shareInviteUrl: () => 'https://example.test/until',
}));

jest.mock('../src/features/time', () => ({
  useObserveTimeState: () => ({
    timeState: { day: 0.42, month: 0.65, year: 0.18, life: 0.73 },
  }),
}));

jest.mock('../src/features/premium', () => ({
  useAccessControl: () => ({ hasPremiumBundle: false }),
}));

jest.mock('../src/shared/ui', () => {
  const { Text: Native, View } = require('react-native');
  const Box = ({ children }: { children?: React.ReactNode }) => (
    <View>{children}</View>
  );
  return { Text: Native, ScreenGradient: Box, Card: Box };
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
    FontFamily: loose('System'),
    getProgressColor: () => '#E87C20',
    Weight: loose('600'),
    getFontFamilyForWeight: () => 'System',
    useTheme: () => loose('#888'),
  };
});

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate, setOptions: mockSetOptions }),
}));

jest.mock('../src/shared/analytics/analytics', () => ({
  logAnalyticsEvent: jest.fn(() => Promise.resolve()),
  recordCrashError: jest.fn(),
  logCrashBreadcrumb: jest.fn(),
}));

jest.mock('../src/shared/analytics/useAnalytics', () => ({
  useAnalytics: () => ({ logEvent: jest.fn() }),
}));

jest.mock('../src/shared/navigation/rootNavigationRef', () => ({
  rootNavigationRef: { isReady: () => true, navigate: jest.fn() },
}));

jest.mock('../src/features/app-update/services/updateService', () => ({
  openStoreUrl: jest.fn(),
}));

jest.mock('../src/features/app-update/data/AppVersion', () => ({
  getAppVersion: () => '1.0.0',
}));

jest.mock(
  'sp-react-native-in-app-updates',
  () => ({
    __esModule: true,
    default: class {
      checkNeedsUpdate = () => Promise.resolve({ shouldUpdate: true });
      startUpdate = (...args: unknown[]) => mockStartUpdate(...(args as []));
    },
    IAUUpdateKind: { FLEXIBLE: 0 },
  }),
  { virtual: true },
);

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
  return act(async () => {
    press();
    // Let the share flow (animation frame, file write, share sheet) finish.
    await new Promise(resolve => setTimeout(resolve, 20));
  });
}

beforeEach(() => {
  mockCanvas.current = null;
  mockFonts.ready = false;
  mockShareOpen.mockClear();
  mockStartUpdate.mockClear();
  mockSetOptions.mockClear();
});

afterEach(() => {
  // Unmount first: resetting the language would otherwise re-render the old trees outside act().
  act(() => {
    mounted.splice(0).forEach(tree => tree.unmount());
  });
  setLanguage('en');
  jest.restoreAllMocks();
});

// ---- the bundled font ----

/** Every code point the font can draw (cmap formats 4 and 12 are all Inter uses). */
function fontCodepoints(file: string): Set<number> {
  const d = fs.readFileSync(file);
  const numTables = d.readUInt16BE(4);
  let cmap = -1;
  for (let i = 0; i < numTables; i += 1) {
    const record = 12 + 16 * i;
    if (d.toString('latin1', record, record + 4) === 'cmap') {
      cmap = d.readUInt32BE(record + 8);
    }
  }
  const found = new Set<number>();
  const records = d.readUInt16BE(cmap + 2);
  for (let i = 0; i < records; i += 1) {
    const sub = cmap + d.readUInt32BE(cmap + 4 + 8 * i + 4);
    const format = d.readUInt16BE(sub);
    if (format === 4) {
      const segments = d.readUInt16BE(sub + 6) / 2;
      const ends = sub + 14;
      const starts = ends + segments * 2 + 2;
      for (let s = 0; s < segments; s += 1) {
        const end = d.readUInt16BE(ends + 2 * s);
        for (
          let c = d.readUInt16BE(starts + 2 * s);
          c <= end && c < 0xffff;
          c += 1
        ) {
          found.add(c);
        }
      }
    } else if (format === 12) {
      const groups = d.readUInt32BE(sub + 12);
      for (let g = 0; g < groups; g += 1) {
        const at = sub + 16 + 12 * g;
        for (let c = d.readUInt32BE(at); c <= d.readUInt32BE(at + 4); c += 1) {
          found.add(c);
        }
      }
    }
  }
  return found;
}

const IMAGE_KEYS = [
  'share.label.day',
  'share.label.month',
  'share.label.year',
  'share.label.life',
  'share.quote.day',
  'share.quote.month',
  'share.quote.year',
  'share.quote.life',
  'share.line.day',
  'share.line.month',
  'share.line.year',
  'share.line.life',
  'share.watermark',
] as const;

const PERCENT_KEYS = IMAGE_KEYS.filter(
  key => key.includes('.quote.') || key.includes('.line.'),
);

describe('share image text and the bundled font', () => {
  const fontDir = path.join(__dirname, '../src/assets/fonts');
  const fonts = ['Regular', 'Medium', 'Bold'].map(weight => ({
    weight,
    glyphs: fontCodepoints(path.join(fontDir, `Inter_18pt-${weight}.ttf`)),
  }));

  it('can draw every character of the image text in the language it is drawn in', () => {
    for (const { code } of SUPPORTED_LANGUAGES) {
      const drawn = shareImageLanguage(code);
      const text =
        IMAGE_KEYS.map(key => tIn(drawn, key, { percent: 42 })).join('') +
        'UNTIL%0123456789';
      for (const { weight, glyphs } of fonts) {
        const missing = [...new Set(text)].filter(
          ch => !glyphs.has(ch.codePointAt(0) as number),
        );
        expect({ code, drawn, weight, missing }).toEqual({
          code,
          drawn,
          weight,
          missing: [],
        });
      }
    }
  });

  it('draws Hindi, Marathi and Japanese in English, which the font cannot write', () => {
    // The font reader works, and Inter really lacks these scripts (this is why the fallback exists).
    for (const { glyphs } of fonts) {
      for (const ch of 'AaÜüŞşЯ%')
        expect(glyphs.has(ch.codePointAt(0) as number)).toBe(true);
      for (const ch of 'आम्あ人')
        expect(glyphs.has(ch.codePointAt(0) as number)).toBe(false);
    }
    expect(shareImageLanguage('hi')).toBe('en');
    expect(shareImageLanguage('mr')).toBe('en');
    expect(shareImageLanguage('ja')).toBe('en');
    expect(shareImageLanguage('ru')).toBe('ru');
    expect(shareImageLanguage('tr')).toBe('tr');
    expect(shareImageLanguage('pt-BR')).toBe('pt-BR');
  });

  it('puts the percent where each language writes it', () => {
    expect(tIn('en', 'share.quote.day', { percent: 42 })).toBe(
      "42% of your day is gone and it's not coming back",
    );
    expect(tIn('tr', 'share.line.year', { percent: 18 })).toBe(
      'Yılının %18 kadarı geçti',
    );
    expect(tIn('de', 'share.line.life', { percent: 73 })).toBe(
      `73${NB}% deines Lebens sind vorbei`,
    );
    expect(tIn('ru', 'share.quote.month', { percent: 65 })).toBe(
      `65${NB}% вашего месяца прошло, и это не вернуть`,
    );
    for (const { code } of SUPPORTED_LANGUAGES) {
      for (const key of PERCENT_KEYS) {
        const out = tIn(code, key, { percent: 42 });
        expect(out).toContain('42');
        expect(out).not.toContain('{{');
      }
    }
  });
});

// ---- the share screen ----

describe('share snapshot screen', () => {
  it('shows the preview card, labels and watermark in the active language', () => {
    setLanguage('de');
    const tree = render(<ShareSnapshotScreen />);
    const shown = texts(tree);
    expect(shown).toEqual(
      expect.arrayContaining([
        `42${NB}% deines Tages sind vorbei und kommen nicht zurück`,
        'HEUTE',
        'MONAT',
        'JAHR',
        'LEBEN',
        'gemacht mit UNTIL',
        'Bild teilen',
      ]),
    );
    const header = render(
      <>{mockSetOptions.mock.calls.at(-1)?.[0].headerRight()}</>,
    );
    expect(texts(header)).toEqual(['Teilen']);
  });

  it('keeps the image text in English for scripts the font lacks, but translates the controls', () => {
    setLanguage('hi');
    const tree = render(<ShareSnapshotScreen />);
    const shown = texts(tree);
    expect(shown).toEqual(
      expect.arrayContaining([
        "42% of your day is gone and it's not coming back",
        'TODAY',
        'MONTH',
        'built with UNTIL',
        'इमेज साझा करें',
      ]),
    );
    expect(shown.join(' ')).not.toContain('आपके दिन का');
    const header = render(
      <>{mockSetOptions.mock.calls.at(-1)?.[0].headerRight()}</>,
    );
    expect(texts(header)).toEqual(['साझा करें']);
  });

  it('follows a language change without a remount', () => {
    const tree = render(<ShareSnapshotScreen />);
    expect(texts(tree)).toContain('Share image');

    act(() => setLanguage('ru'));
    expect(texts(tree)).toEqual(
      expect.arrayContaining([
        `42${NB}% вашего дня прошло, и это не вернуть`,
        'СЕГОДНЯ',
        'Поделиться изображением',
      ]),
    );

    act(() => setLanguage('ja'));
    const shown = texts(tree);
    expect(shown).toContain('画像を共有');
    expect(shown).toContain("42% of your day is gone and it's not coming back");
  });

  it('switches the quote when another period is picked', async () => {
    setLanguage('tr');
    const tree = render(<ShareSnapshotScreen />);
    await pressText(tree, 'YIL');
    expect(texts(tree)).toEqual(
      expect.arrayContaining(['Yılının %18 kadarı geçti ve geri gelmeyecek']),
    );
  });

  it('says why it cannot share yet, in the active language', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    setLanguage('de');
    const tree = render(<ShareSnapshotScreen />);

    await pressText(tree, 'Bild teilen');
    expect(alert).toHaveBeenLastCalledWith(
      'Teilen nicht möglich',
      'Schnappschuss wird vorbereitet… versuche es gleich noch einmal.',
    );

    mockCanvas.current = {
      makeImageSnapshot: () => ({ encodeToBase64: () => 'x' }),
    };
    await pressText(tree, 'Bild teilen');
    expect(alert).toHaveBeenLastCalledWith(
      'Teilen nicht möglich',
      'Schriften werden geladen… versuche es gleich noch einmal.',
    );
  });

  it('writes the caption in the app language and then offers Premium', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    mockCanvas.current = {
      makeImageSnapshot: () => ({ encodeToBase64: () => 'x' }),
    };
    mockFonts.ready = true;
    setLanguage('es');
    const tree = render(<ShareSnapshotScreen />);

    await pressText(tree, 'Compartir imagen');
    expect(mockShareOpen).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'image/png',
        message: `42${NB}% de tu día se ha ido y no va a volver\n\nhecho con UNTIL · https://example.test/until`,
      }),
    );
    expect(alert).toHaveBeenLastCalledWith(
      'Conserva esta sensación en tu pantalla de inicio',
      expect.any(String),
      [
        expect.objectContaining({ text: 'Quizá más tarde' }),
        expect.objectContaining({ text: 'Ver Premium' }),
      ],
    );
  });

  it('keeps the caption in Hindi even though the image stays English', async () => {
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    mockCanvas.current = {
      makeImageSnapshot: () => ({ encodeToBase64: () => 'x' }),
    };
    mockFonts.ready = true;
    setLanguage('hi');
    const tree = render(<ShareSnapshotScreen />);

    await pressText(tree, 'इमेज साझा करें');
    expect(mockShareOpen).toHaveBeenCalledWith(
      expect.objectContaining({
        message:
          'आपके दिन का 42% बीत चुका है और वह लौटकर नहीं आएगा\n\nUNTIL के साथ बनाया गया · https://example.test/until',
      }),
    );
  });
});

describe('share prompt', () => {
  it('asks in the active language', () => {
    setLanguage('tr');
    const tree = render(<SharePromptModal visible onDismiss={() => {}} />);
    expect(texts(tree)).toEqual([
      'Geri sayımın bugüne ulaştı',
      'Anı paylaş. Gününün, ayının veya yılının ne kadarının kaldığını yakala.',
      'Anlık görüntüyü paylaş',
      'Şimdi değil',
    ]);
    act(() => setLanguage('ja'));
    expect(texts(tree)[0]).toBe('カウントダウンが今日に到達しました');
  });
});

describe('update prompts', () => {
  const decision = (kind: 'optional' | 'required'): UpdateDecision => ({
    kind,
    latestBuild: 40,
    versionName: '1.4',
    notes: ['Fewer crashes'],
    storeUrl: 'https://store.test',
  });

  it('asks for a required update in the active language', () => {
    setLanguage('de');
    const tree = render(
      <UpdateSheet
        decision={decision('required')}
        onUpdate={() => {}}
        onLater={() => {}}
      />,
    );
    expect(texts(tree)).toEqual([
      'Bitte aktualisiere UNTIL',
      'Diese Version wird nicht mehr unterstützt. Aktualisiere, damit deine Widgets und dein Konto weiter funktionieren.',
      'NEU IN DIESER VERSION',
      'Fewer crashes',
      'Jetzt aktualisieren',
    ]);
  });

  it('offers an optional update and lets it be postponed', async () => {
    const onLater = jest.fn();
    setLanguage('ru');
    const tree = render(
      <UpdateSheet
        decision={decision('optional')}
        onUpdate={() => {}}
        onLater={onLater}
      />,
    );
    expect(texts(tree)).toEqual([
      'Новая версия готова',
      'Вышла версия UNTIL 1.4 с последними исправлениями и улучшениями.',
      'ЧТО НОВОГО',
      'Fewer crashes',
      'Обновить сейчас',
      'Не сейчас',
    ]);
    await pressText(tree, 'Не сейчас');
    expect(onLater).toHaveBeenCalledTimes(1);

    act(() => setLanguage('ja'));
    expect(texts(tree)).toEqual([
      '新しいバージョンがあります',
      'UNTIL 1.4が公開されました。最新の修正と改善が含まれています。',
      '新機能',
      'Fewer crashes',
      '今すぐアップデート',
      '今はしない',
    ]);
  });

  it('words the iOS store dialog in the active language', async () => {
    jest.replaceProperty(Platform, 'OS', 'ios');
    setLanguage('fr');
    checkInAppUpdate();
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    expect(mockStartUpdate).toHaveBeenLastCalledWith({
      title: 'Mise à jour disponible',
      message: `Une nouvelle version d’Until est disponible. Voulez-vous la mettre à jour maintenant${NB}?`,
      buttonUpgradeText: 'Mettre à jour',
      buttonCancelText: 'Plus tard',
    });
  });
});

describe('crash screen', () => {
  function Boom(): React.ReactElement {
    throw new Error('render boom');
  }

  it('shows the recovery screen in the active language and follows a language change', () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    setLanguage('fr');
    const tree = render(
      <CrashErrorBoundary>
        <Boom />
      </CrashErrorBoundary>,
    );
    expect(texts(tree)).toEqual([
      'Une erreur est survenue',
      'L’application a rencontré une erreur inattendue. Vous pouvez réessayer.',
      'Réessayer',
    ]);
    act(() => setLanguage('ja'));
    expect(texts(tree)[0]).toBe('問題が発生しました');
  });
});
