import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';

import { UpdateSheet } from '../src/features/app-update/ui/UpdateSheet';
import type { UpdateDecision } from '../src/features/app-update/domain/updatePolicy';

jest.mock('../src/shared/theme', () => ({
  Spacing: { 1: 4, 2: 8, 3: 12, 4: 16 },
  Radius: { md: 8, lg: 12 },
  Weight: { semibold: 'semibold' },
  getFontFamilyForWeight: () => 'System',
  useTheme: () => ({
    cardBaseAlpha: '#111',
    divider: '#333',
    percent: '#f60',
    textPrimary: '#fff',
    textSecondary: '#ccc',
    textMuted: '#999',
  }),
}));
jest.mock('../src/shared/ui', () => {
  const ReactModule = require('react');
  const { Text: NativeText } = require('react-native');
  return {
    Text: ({ children }: { children?: React.ReactNode }) =>
      ReactModule.createElement(NativeText, null, children),
  };
});
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 20, left: 0, right: 0 }),
}));
jest.mock('../src/assets/images', () => ({ appLogoIcon: 1 }));

const PLAY = 'https://play.google.com/store/apps/details?id=app.until.time';
const decision = (
  kind: 'optional' | 'required',
  over: Partial<Extract<UpdateDecision, { notes: string[] }>> = {},
): UpdateDecision => ({
  kind,
  latestBuild: 40,
  versionName: '1.4',
  notes: ['Fewer crashes', 'Widgets refresh on the minute'],
  storeUrl: PLAY,
  ...over,
});

function render(d: UpdateDecision) {
  const onUpdate = jest.fn();
  const onLater = jest.fn();
  let tree!: ReactTestRenderer.ReactTestRenderer;
  act(() => {
    tree = ReactTestRenderer.create(
      <UpdateSheet decision={d} onUpdate={onUpdate} onLater={onLater} />,
    );
  });
  const texts = () =>
    tree.root
      .findAll(n => (n.type as unknown) === 'Text')
      .map(n => n.children.map(c => (typeof c === 'string' ? c : '')).join(''));
  const button = (label: string) =>
    tree.root.findAll(
      n =>
        n.props.accessibilityLabel === label &&
        typeof n.props.onPress === 'function',
    )[0];
  return { tree, texts, button, onUpdate, onLater };
}

describe('UpdateSheet', () => {
  it('renders nothing when there is no update', () => {
    const { tree } = render({ kind: 'none' });
    expect(tree.toJSON()).toBeNull();
  });

  it('says what is new and offers both choices for an optional update', () => {
    const { texts, button, onUpdate, onLater } = render(decision('optional'));
    const out = texts().join('\n');

    expect(out).toContain('A new version is ready');
    expect(out).toContain('UNTIL 1.4 is out');
    expect(out).toContain('Fewer crashes');
    expect(out).toContain('Widgets refresh on the minute');

    act(() => button('Update now').props.onPress());
    act(() => button('Not now').props.onPress());
    expect(onUpdate).toHaveBeenCalledTimes(1);
    expect(onLater).toHaveBeenCalledTimes(1);
  });

  it('leaves out the notes section when there are no notes, and copes with no version name', () => {
    const { texts } = render(
      decision('optional', { notes: [], versionName: null }),
    );
    const out = texts().join('\n');
    expect(out).not.toContain("WHAT'S NEW");
    expect(out).toContain('A new version of UNTIL is out');
  });

  it('gives a required update no way out but the store', () => {
    const { texts, button, tree } = render(decision('required'));
    expect(texts().join('\n')).toContain('Please update UNTIL');
    expect(button('Not now')).toBeUndefined();

    const modal = tree.root.findAll(
      n => n.props.visible === true && 'onRequestClose' in n.props,
    )[0];
    expect(modal.props.onRequestClose).toBeUndefined();
  });

  it('lets the system back button put off an optional update', () => {
    const { tree, onLater } = render(decision('optional'));
    const modal = tree.root.findAll(
      n => n.props.visible === true && 'onRequestClose' in n.props,
    )[0];
    act(() => modal.props.onRequestClose());
    expect(onLater).toHaveBeenCalledTimes(1);
  });
});
