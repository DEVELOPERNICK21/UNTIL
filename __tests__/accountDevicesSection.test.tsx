import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';

import { AccountDevicesSection } from '../src/features/account/ui/AccountDevicesSection';
import { MAX_ACTIVE_DEVICES } from '../src/features/account/domain/deviceLimit';
import { MS_PER_DAY, MS_PER_HOUR } from '../src/shared/time/constants';
import type { AccountDevice } from '../src/shared/types';

jest.mock('../src/shared/theme', () => ({
  Spacing: { 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24 },
  Radius: { sm: 4, md: 8, lg: 12 },
  useTheme: () => ({
    textPrimary: '#fff',
    textSecondary: '#ccc',
    textMuted: '#999',
    percent: '#f60',
    divider: '#333',
    glassBorder: '#444',
    glassHighlight: '#222',
  }),
}));

jest.mock('../src/shared/ui', () => {
  const ReactModule = require('react');
  const { View, Text: NativeText } = require('react-native');
  return {
    Text: ({ children }: { children?: React.ReactNode }) =>
      ReactModule.createElement(NativeText, null, children),
    GlassCard: ({ children }: { children?: React.ReactNode }) =>
      ReactModule.createElement(View, null, children),
  };
});

jest.mock('react-native-svg', () => {
  const ReactModule = require('react');
  const { View } = require('react-native');
  const stub = () => ReactModule.createElement(View);
  return { __esModule: true, default: stub, Path: stub, Rect: stub };
});

const NOW = 500 * MS_PER_DAY;

function device(id: string, extra: Partial<AccountDevice> = {}): AccountDevice {
  return {
    id,
    platform: 'ios',
    label: null,
    lastSeenAt: NOW - MS_PER_HOUR * 2,
    createdAt: 1,
    active: true,
    ...extra,
  };
}

function render(
  props: Partial<React.ComponentProps<typeof AccountDevicesSection>> = {},
) {
  const onRemove = jest.fn();
  const all = {
    devices: [
      device('me', { label: 'iPhone 15', appVersion: '1.3.2' }),
      device('mac', {
        label: 'Nick’s MacBook',
        platform: 'macos',
        lastSeenAt: NOW - 3 * MS_PER_DAY,
      }),
    ],
    currentDeviceId: 'me',
    loading: false,
    removingId: null,
    now: NOW,
    onRemove,
    ...props,
  };
  let tree!: ReactTestRenderer.ReactTestRenderer;
  act(() => {
    tree = ReactTestRenderer.create(<AccountDevicesSection {...all} />);
  });
  /** Visible text, one entry per Text node (accessibility labels are not text). */
  const texts = () =>
    tree.root
      .findAll(n => (n.type as unknown) === 'Text')
      .map(n => n.children.map(c => (typeof c === 'string' ? c : '')).join(''));
  return { tree, onRemove, all, text: () => texts().join('\n') };
}

describe('AccountDevicesSection', () => {
  it('shows each device, which one is this, and how many slots are used', () => {
    const { text } = render();
    const out = text();

    expect(out).toContain('iPhone 15');
    expect(out).toContain('This device');
    expect(out).toContain('Nick’s MacBook');
    expect(out).toContain('iOS · UNTIL 1.3.2 · Active now');
    expect(out).toContain('macOS · Active 3 days ago');
    expect(out).toContain(`2 of ${MAX_ACTIVE_DEVICES} in use`);
  });

  it('lets you remove another device but not the one you are holding', () => {
    const { tree, onRemove, all } = render();
    const removeButtons = tree.root.findAll(
      n =>
        n.props.accessibilityRole === 'button' &&
        typeof n.props.onPress === 'function',
    );

    expect(new Set(removeButtons.map(b => b.props.accessibilityLabel))).toEqual(
      new Set(['Remove Nick’s MacBook']),
    );
    act(() => removeButtons[0].props.onPress());
    expect(onRemove).toHaveBeenCalledWith(all.devices[1]);
  });

  it('shows a spinner instead of Remove while a device is being removed', () => {
    const { text } = render({ removingId: 'mac' });
    expect(text()).not.toContain('Remove');
  });

  it('says so when there are no devices', () => {
    expect(render({ devices: [], currentDeviceId: null }).text()).toContain(
      'No devices yet.',
    );
  });

  it('explains the two rules people cannot guess', () => {
    const out = render().text();
    expect(out).toContain('One Mac or Windows PC at a time');
    expect(out).toContain('stops using a slot');
  });
});
