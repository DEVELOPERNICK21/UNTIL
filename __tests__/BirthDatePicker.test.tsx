/**
 * The birth-date field. The bug it pins: on iPhone the picker used to close on the first change, so picking a
 * year hid the wheels and the month needed another tap.
 */

import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { Platform, Vibration } from 'react-native';
import { BirthDatePicker } from '../src/features/account/ui/BirthDatePicker';

jest.mock('@shopify/react-native-skia', () => ({ Canvas: () => null, Path: () => null, Skia: {} }));
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(() => Promise.resolve(null)),
    setItem: jest.fn(() => Promise.resolve()),
    removeItem: jest.fn(() => Promise.resolve()),
  },
}));

type PickerProps = {
  value: Date;
  display: string;
  mode: string;
  minimumDate: Date;
  maximumDate: Date;
  onChange: (event: { type: string }, date?: Date) => void;
};
jest.mock('@react-native-community/datetimepicker', () => {
  const { View } = jest.requireActual('react-native');
  const ReactLib = jest.requireActual('react');
  return {
    __esModule: true,
    default: (props: PickerProps) => ReactLib.createElement(View, { testID: 'native-date-picker', ...props }),
  };
});

jest.mock('../src/shared/i18n/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => (params ? `${key}|${params.date}` : key),
    formatDate: (d: Date) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`,
    language: 'en',
  }),
}));

const START = new Date(1995, 0, 1);

function setOs(os: 'ios' | 'android') {
  Object.defineProperty(Platform, 'OS', { configurable: true, get: () => os });
}

function render(onChange = jest.fn(), value = START) {
  let tree!: ReactTestRenderer.ReactTestRenderer;
  act(() => {
    tree = ReactTestRenderer.create(<BirthDatePicker value={value} onChange={onChange} />);
  });
  // The component and the view it renders both carry the props; count the rendered view once.
  const pickers = () =>
    tree.root.findAllByProps({ testID: 'native-date-picker' }).filter(node => typeof node.type === 'string');
  return { tree, onChange, pickers };
}

let vibrate: jest.SpyInstance;
beforeEach(() => {
  vibrate = jest.spyOn(Vibration, 'vibrate').mockImplementation(() => {});
});
afterEach(() => vibrate.mockRestore());

describe('on iPhone', () => {
  beforeEach(() => setOs('ios'));

  it('shows the day, month and year wheels at once, with nothing to tap first', () => {
    const { pickers } = render();
    expect(pickers()).toHaveLength(1);
    expect(pickers()[0].props.display).toBe('spinner');
    expect(pickers()[0].props.mode).toBe('date');
  });

  it('keeps the wheels on screen through year, then month, then day', () => {
    const { pickers, onChange } = render();
    const wheels = () => pickers()[0].props as PickerProps;

    act(() => wheels().onChange({ type: 'set' }, new Date(1988, 0, 1)));
    expect(pickers()).toHaveLength(1);
    act(() => wheels().onChange({ type: 'set' }, new Date(1988, 6, 1)));
    expect(pickers()).toHaveLength(1);
    act(() => wheels().onChange({ type: 'set' }, new Date(1988, 6, 19)));
    expect(pickers()).toHaveLength(1);

    expect(onChange.mock.calls.map(([d]) => (d as Date).getTime())).toEqual([
      new Date(1988, 0, 1).getTime(),
      new Date(1988, 6, 1).getTime(),
      new Date(1988, 6, 19).getTime(),
    ]);
  });

  it('shows the chosen date as it changes', () => {
    const { tree } = render(jest.fn(), new Date(1988, 6, 19));
    const text = JSON.stringify(tree.toJSON());
    expect(text).toContain('1988-7-19');
  });

  it('does not buzz the phone on every tick of a wheel', () => {
    const { pickers } = render();
    act(() => (pickers()[0].props as PickerProps).onChange({ type: 'set' }, new Date(1990, 3, 3)));
    expect(vibrate).not.toHaveBeenCalled();
  });

  it('stops the wheels offering a birth date in the future or before 1900', () => {
    const { pickers } = render();
    const props = pickers()[0].props as PickerProps;
    expect(props.minimumDate.getFullYear()).toBe(1900);
    expect(props.maximumDate.getTime()).toBeLessThanOrEqual(Date.now() + 1000);
  });
});

describe('on Android', () => {
  beforeEach(() => setOs('android'));

  it('opens the system dialog on tap, and not before', () => {
    const { tree, pickers } = render();
    expect(pickers()).toHaveLength(0);
    const button = tree.root.findByProps({ accessibilityRole: 'button' });
    act(() => button.props.onPress());
    expect(pickers()).toHaveLength(1);
  });

  it('closes once the date is confirmed, and reports it', () => {
    const { tree, pickers, onChange } = render();
    act(() => tree.root.findByProps({ accessibilityRole: 'button' }).props.onPress());
    act(() => (pickers()[0].props as PickerProps).onChange({ type: 'set' }, new Date(1990, 4, 5)));
    expect(pickers()).toHaveLength(0);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect((onChange.mock.calls[0][0] as Date).getTime()).toBe(new Date(1990, 4, 5).getTime());
  });

  it('closes without changing anything when cancelled', () => {
    const { tree, pickers, onChange } = render();
    act(() => tree.root.findByProps({ accessibilityRole: 'button' }).props.onPress());
    act(() => (pickers()[0].props as PickerProps).onChange({ type: 'dismissed' }));
    expect(pickers()).toHaveLength(0);
    expect(onChange).not.toHaveBeenCalled();
  });
});
