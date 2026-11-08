/**
 * The words around the free-plan limits (the upgrade prompt, the counter card, the paywall's
 * "your numbers" card) follow the person's language, not just English.
 */

import React from 'react';
import { Alert, Text as NativeText } from 'react-native';
import ReactTestRenderer, { act } from 'react-test-renderer';

import { CounterCard } from '../src/features/counters/ui/CounterCard';
import { useLimitUpgradePrompt } from '../src/features/premium/hooks/useLimitUpgradePrompt';
import { buildYourNumbers } from '../src/features/premium/domain/yourNumbers';
import { setLanguage } from '../src/shared/i18n/translate';

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}));

jest.mock('../src/shared/analytics/analytics', () => ({
  logAnalyticsEvent: jest.fn(() => Promise.resolve()),
}));

jest.mock('../src/shared/ui', () => {
  const { Text: Native, View } = require('react-native');
  const Box = ({ children }: { children?: React.ReactNode }) => (
    <View>{children}</View>
  );
  return { Text: Native, Card: Box };
});

jest.mock('../src/shared/theme', () => ({
  Spacing: { 1: 4, 2: 8, 3: 12 },
  Radius: { md: 8 },
  Colors: { divider: '#333', textPrimary: '#fff', textSecondary: '#ccc' },
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

afterEach(() => {
  act(() => {
    mounted.splice(0).forEach(tree => tree.unmount());
  });
  setLanguage('en');
  mockNavigate.mockClear();
});

function PromptHarness({ feature }: { feature: 'deadlines' | 'counters' }) {
  const prompt = useLimitUpgradePrompt(feature);
  return <NativeText onPress={prompt}>open</NativeText>;
}

describe('free-plan upgrade prompt', () => {
  it('explains Premium in the active language and opens it on request', () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    setLanguage('es');
    const tree = render(<PromptHarness feature="deadlines" />);
    act(() => tree.root.findByType(NativeText).props.onPress());

    expect(alert).toHaveBeenCalledWith(
      'Más fechas límite con Premium',
      'El plan gratuito guarda una fecha límite. Premium admite hasta 20, y tu widget siempre muestra la más cercana.',
      [
        expect.objectContaining({ text: 'Ahora no', style: 'cancel' }),
        expect.objectContaining({ text: 'Ver Premium' }),
      ],
    );
    const buttons = alert.mock.calls[0][2] as { onPress?: () => void }[];
    buttons[1].onPress?.();
    expect(mockNavigate).toHaveBeenCalledWith('Premium');
    alert.mockRestore();
  });

  it('words the counters prompt separately', () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    setLanguage('ja');
    const tree = render(<PromptHarness feature="counters" />);
    act(() => tree.root.findByType(NativeText).props.onPress());
    expect(alert.mock.calls[0][0]).toBe('プレミアムでカウンターを増やせます');
    expect(alert.mock.calls[0][1]).toContain('最大20件');
    alert.mockRestore();
  });
});

describe('counter card', () => {
  const counter = { id: 'k1', title: 'Wasser', count: 1234, createdAt: 0 };
  const noop = () => {};

  function texts(tree: ReactTestRenderer.ReactTestRenderer): string[] {
    return tree.root
      .findAllByType(NativeText)
      .map(node => React.Children.toArray(node.props.children).join(''));
  }

  it('shows every label in the active language', () => {
    setLanguage('de');
    const tree = render(
      <CounterCard
        counter={counter}
        onWidget={false}
        many
        onStep={noop}
        onReset={noop}
        onRemove={noop}
        onShowOnWidget={noop}
      />,
    );
    expect(texts(tree)).toEqual([
      'Wasser',
      'Stand: 1.234',
      'Im Widget zeigen',
      'Entfernen',
      '−1',
      '+1',
      'Zurücksetzen',
    ]);
    const labels = tree.root
      .findAll(node => typeof node.props.accessibilityLabel === 'string')
      .map(node => node.props.accessibilityLabel);
    expect(labels).toEqual(
      expect.arrayContaining([
        'Wasser im Widget zeigen',
        'Eins abziehen',
        'Eins addieren',
        'Auf null zurücksetzen',
      ]),
    );
  });

  it('says which counter the widget uses, and follows a language change', () => {
    setLanguage('ru');
    const tree = render(
      <CounterCard
        counter={counter}
        onWidget
        many
        onStep={noop}
        onReset={noop}
        onRemove={noop}
        onShowOnWidget={noop}
      />,
    );
    expect(texts(tree)).toContain('Показан на вашем виджете');
    act(() => setLanguage('fr'));
    expect(texts(tree)).toContain('Affiché sur votre widget');
  });
});

describe('paywall "your numbers" rows', () => {
  const progress = { day: 0.634, month: 0.91, life: 0.314 };

  it('names the rows and widgets in the active language', () => {
    setLanguage('fr');
    const rows = buildYourNumbers(progress, true, 'octobre');
    expect(rows.map(r => [r.label, r.widget])).toEqual([
      ['Aujourd’hui', 'Widget du jour'],
      ['octobre', 'Widget du mois'],
      ['Votre vie', 'Widget de la vie'],
    ]);
  });
});
