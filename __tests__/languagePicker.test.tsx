import React from 'react';
import { Text as NativeText } from 'react-native';
import ReactTestRenderer, { act } from 'react-test-renderer';

import { LanguagePickerModal } from '../src/features/settings/ui/LanguagePickerModal';
import { SUPPORTED_LANGUAGES } from '../src/shared/i18n/languages';
import { setLanguage } from '../src/shared/i18n/translate';
import { useTranslation } from '../src/shared/i18n/useTranslation';

jest.mock('../src/shared/theme', () => ({
  Spacing: { 1: 4, 2: 8, 3: 12, 4: 16, 5: 20 },
  Radius: { sm: 4, md: 8, lg: 12 },
  useTheme: () => ({
    textPrimary: '#fff',
    textSecondary: '#ccc',
    percent: '#f60',
    divider: '#333',
    glassBorder: '#444',
    backgroundAlt: '#111',
  }),
}));

jest.mock('../src/shared/ui', () => {
  const { Text: Native } = require('react-native');
  return { Text: Native };
});

const mounted: ReactTestRenderer.ReactTestRenderer[] = [];

function mount(element: React.ReactElement) {
  let tree!: ReactTestRenderer.ReactTestRenderer;
  act(() => {
    tree = ReactTestRenderer.create(element);
  });
  mounted.push(tree);
  return tree;
}

// Unmount first so the reset below does not update a tree that is still subscribed.
afterEach(() => {
  act(() => mounted.splice(0).forEach(tree => tree.unmount()));
  setLanguage('en');
});

function textOf(node: ReactTestRenderer.ReactTestInstance): string {
  return node
    .findAllByType(NativeText)
    .map(text => [text.props.children].flat().join(''))
    .join('|');
}

function radios(tree: ReactTestRenderer.ReactTestRenderer) {
  // The Pressable of each row (the element the list gives a key), so `onPress` is available.
  return tree.root.findAll(
    node =>
      typeof node.type !== 'string' &&
      node.props.accessibilityRole === 'radio' &&
      (node as unknown as { _fiber: { key: string | null } })._fiber.key !==
        null,
  );
}

describe('LanguagePickerModal', () => {
  function render(preference: 'system' | 'ja', onSelect = jest.fn()) {
    const tree = mount(
      <LanguagePickerModal
        visible
        preference={preference}
        deviceLanguage="hi"
        onSelect={onSelect}
        onClose={jest.fn()}
      />,
    );
    return { tree, onSelect };
  }

  it('lists "match phone language" and every language in its own script', () => {
    const { tree } = render('system');
    const rows = radios(tree);
    expect(rows).toHaveLength(SUPPORTED_LANGUAGES.length + 1);
    expect(textOf(rows[0])).toContain('Match phone language');
    expect(textOf(rows[0])).toContain('हिन्दी');
    const names = rows.slice(1).map(row => textOf(row));
    expect(names).toEqual(SUPPORTED_LANGUAGES.map(l => l.nativeName));
  });

  it('marks the current choice as selected', () => {
    const { tree } = render('ja');
    const selected = radios(tree)
      .filter(row => row.props.accessibilityState?.selected)
      .map(row => textOf(row));
    expect(selected).toEqual(['日本語|✓']);
  });

  it('reports the chosen preference', () => {
    const { tree, onSelect } = render('system');
    const marathi = radios(tree).find(row => textOf(row).includes('मराठी'))!;
    act(() => marathi.props.onPress());
    expect(onSelect).toHaveBeenCalledWith('mr');
    act(() => radios(tree)[0].props.onPress());
    expect(onSelect).toHaveBeenLastCalledWith('system');
  });
});

describe('useTranslation', () => {
  function Probe() {
    const { t, language } = useTranslation();
    return <NativeText>{`${language}:${t('nav.settings')}`}</NativeText>;
  }

  it('re-renders a component when the language changes', () => {
    const tree = mount(<Probe />);
    expect(textOf(tree.root)).toBe('en:Settings');
    act(() => setLanguage('hi'));
    expect(textOf(tree.root)).toBe('hi:सेटिंग्स');
    act(() => setLanguage('ru'));
    expect(textOf(tree.root)).toBe('ru:Настройки');
  });
});
