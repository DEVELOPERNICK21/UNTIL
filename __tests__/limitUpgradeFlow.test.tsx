/**
 * Free plan, second deadline or counter: tapping Add explains Premium and adds nothing. Premium
 * adds it. What the person typed is never thrown away.
 */

import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { TextInput, TouchableOpacity } from 'react-native';

import { CountdownsScreen } from '../src/features/countdowns/ui/CountdownsScreen';
import { CustomCountersScreen } from '../src/features/counters/ui/CustomCountersScreen';

jest.mock('@react-navigation/native', () => ({
  useFocusEffect: jest.fn(),
  useNavigation: () => ({ navigate: jest.fn() }),
}));
jest.mock('@react-native-community/datetimepicker', () => () => null);
jest.mock('../src/shared/theme', () => ({
  Spacing: { 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24 },
  Radius: { sm: 4, md: 8, lg: 12 },
  Typography: { label: 16 },
  Colors: { divider: '#333', textPrimary: '#fff', textSecondary: '#ccc' },
}));
jest.mock('../src/shared/ui', () => {
  const ReactModule = require('react');
  const { View, Text: NativeText } = require('react-native');
  return {
    Text: ({ children }: { children?: React.ReactNode }) =>
      ReactModule.createElement(NativeText, null, children),
    ScreenGradient: ({ children }: { children?: React.ReactNode }) =>
      ReactModule.createElement(View, null, children),
    Card: ({ children }: { children?: React.ReactNode }) =>
      ReactModule.createElement(View, null, children),
  };
});
jest.mock('../src/shared/platform/useWidgetSyncActions', () => ({
  useWidgetSyncActions: () => ({ syncCountdowns: jest.fn(), syncCustomCounters: jest.fn() }),
}));

const mockPrompt = jest.fn();
jest.mock('../src/features/premium', () => ({
  useLimitUpgradePrompt: () => mockPrompt,
}));

const mockAddCountdown = jest.fn(() => true);
const mockAddCounter = jest.fn(() => true);
let mockPlan = { hasPremium: false, atLimit: true, limit: 1, count: 1 };

jest.mock('../src/features/countdowns/hooks/useCountdowns', () => ({
  useCountdowns: () => ({
    countdowns: Array.from({ length: mockPlan.count }, (_, i) => ({
      id: `c${i}`,
      title: `Deadline ${i}`,
      date: '2099-01-01',
      daysUntil: 100,
      daysLabel: '100 days',
    })),
    atLimit: mockPlan.atLimit,
    limit: mockPlan.limit,
    hasPremium: mockPlan.hasPremium,
    refresh: jest.fn(),
    addCountdown: mockAddCountdown,
    removeCountdown: jest.fn(),
  }),
}));
jest.mock('../src/features/counters/hooks/useCustomCounters', () => ({
  useCustomCounters: () => ({
    counters: Array.from({ length: mockPlan.count }, (_, i) => ({
      id: `k${i}`,
      title: `Counter ${i}`,
      count: 2,
    })),
    atLimit: mockPlan.atLimit,
    limit: mockPlan.limit,
    hasPremium: mockPlan.hasPremium,
    refresh: jest.fn(),
    addCounter: mockAddCounter,
    removeCounter: jest.fn(),
    incrementCounter: jest.fn(),
    decrementCounter: jest.fn(),
    resetCounter: jest.fn(),
    showOnWidget: jest.fn(),
  }),
}));

function render(element: React.ReactElement) {
  let tree!: ReactTestRenderer.ReactTestRenderer;
  act(() => {
    tree = ReactTestRenderer.create(element);
  });
  return tree;
}

function textOf(node: ReactTestRenderer.ReactTestInstance): string {
  // The first match: the stubbed Text and the native text under it both carry the same string.
  const match = node.findAll(n => typeof n.props.children === 'string')[0];
  return match ? (match.props.children as string) : '';
}

function typeAndPressAdd(tree: ReactTestRenderer.ReactTestRenderer, text: string) {
  act(() => {
    tree.root.findByType(TextInput).props.onChangeText(text);
  });
  const add = tree.root
    .findAllByType(TouchableOpacity)
    .find(n => /^Add( with Premium)?$/.test(textOf(n)));
  expect(add).toBeDefined();
  expect(add!.props.disabled).toBe(false);
  act(() => {
    add!.props.onPress();
  });
}

beforeEach(() => {
  mockPrompt.mockClear();
  mockAddCountdown.mockClear();
  mockAddCounter.mockClear();
});

describe.each([
  ['deadline', () => <CountdownsScreen />, () => mockAddCountdown],
  ['counter', () => <CustomCountersScreen />, () => mockAddCounter],
])('adding a second %s', (_name, screen, adder) => {
  it('explains Premium and adds nothing on the free plan', () => {
    mockPlan = { hasPremium: false, atLimit: true, limit: 1, count: 1 };
    const tree = render(screen());
    typeAndPressAdd(tree, 'Second');
    expect(mockPrompt).toHaveBeenCalledTimes(1);
    expect(adder()).not.toHaveBeenCalled();
    // The text is still there, so coming back from the Premium screen loses nothing.
    expect(tree.root.findByType(TextInput).props.value).toBe('Second');
  });

  it('adds it on Premium', () => {
    mockPlan = { hasPremium: true, atLimit: false, limit: 20, count: 1 };
    const tree = render(screen());
    typeAndPressAdd(tree, 'Second');
    expect(adder()).toHaveBeenCalledTimes(1);
    expect(mockPrompt).not.toHaveBeenCalled();
    expect(tree.root.findByType(TextInput).props.value).toBe('');
  });

  it('keeps the first one free: no prompt for the first add', () => {
    mockPlan = { hasPremium: false, atLimit: false, limit: 1, count: 0 };
    const tree = render(screen());
    typeAndPressAdd(tree, 'First');
    expect(adder()).toHaveBeenCalledTimes(1);
    expect(mockPrompt).not.toHaveBeenCalled();
  });
});
