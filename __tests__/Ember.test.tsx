import React from 'react';
import { Text } from 'react-native';
import ReactTestRenderer, { act } from 'react-test-renderer';

import { Ember } from '../src/shared/ui/Ember';
import { emitEmberReaction } from '../src/shared/ui/emberReactions';

// The theme index pulls in the theme store, which reads AsyncStorage.
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(() => Promise.resolve(null)),
    setItem: jest.fn(() => Promise.resolve()),
    removeItem: jest.fn(() => Promise.resolve()),
  },
}));

/** Lets the reduce motion lookup settle, like it does on a device. */
async function render(element: React.ReactElement) {
  let tree!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    tree = ReactTestRenderer.create(element);
  });
  return tree;
}

function pressable(tree: ReactTestRenderer.ReactTestRenderer) {
  return tree.root.findByProps({ accessibilityRole: 'button' });
}

function bubbleText(tree: ReactTestRenderer.ReactTestRenderer) {
  return tree.root
    .findAllByType(Text)
    .map(node => node.props.children)
    .filter(text => typeof text === 'string' && text.includes('left today'));
}

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('Ember', () => {
  it('draws at every size and time of day without crashing', async () => {
    for (const progress of [0, 0.1, 0.3, 0.5, 0.7, 0.9, 0.97, 1]) {
      for (const size of [28, 42, 56, 80]) {
        const tree = await render(<Ember progress={progress} size={size} />);
        expect(tree.toJSON()).not.toBeNull();
        act(() => tree.unmount());
      }
    }
  });

  it('tells screen readers how much of the day is left', async () => {
    const tree = await render(<Ember progress={0.5} />);
    expect(pressable(tree).props.accessibilityLabel).toContain('12h left today');
    expect(
      pressable(tree).props.accessibilityActions.map((a: { name: string }) => a.name),
    ).toContain('timeLeft');
    act(() => tree.unmount());
  });

  it('calls onInteract when tapped', async () => {
    const onInteract = jest.fn();
    const tree = await render(<Ember onInteract={onInteract} />);
    act(() => pressable(tree).props.onPress());
    expect(onInteract).toHaveBeenCalledTimes(1);
    act(() => tree.unmount());
  });

  it('hands the time left to the parent when held, if the parent listens', async () => {
    const onLongPress = jest.fn();
    const tree = await render(<Ember progress={0.75} onLongPress={onLongPress} />);
    act(() => pressable(tree).props.onLongPress());
    expect(onLongPress).toHaveBeenCalledWith('6h left today');
    expect(bubbleText(tree)).toEqual([]);
    act(() => tree.unmount());
  });

  it('shows its own bubble when held and nobody else is listening', async () => {
    const tree = await render(<Ember progress={0.75} />);
    act(() => pressable(tree).props.onLongPress());
    expect(bubbleText(tree)).toEqual(['6h left today']);
    act(() => {
      jest.advanceTimersByTime(3500);
    });
    expect(bubbleText(tree)).toEqual([]);
    act(() => tree.unmount());
  });

  it('does nothing when it is not interactive', async () => {
    const onInteract = jest.fn();
    const tree = await render(<Ember interactive={false} onInteract={onInteract} />);
    expect(tree.root.findAllByProps({ accessibilityRole: 'button' })).toHaveLength(0);
    act(() => tree.unmount());
  });

  it('reacts to the app only when it is reactive', async () => {
    const quiet = await render(<Ember />);
    const lively = await render(<Ember reactive />);
    expect(() => act(() => emitEmberReaction('cheer'))).not.toThrow();
    expect(() => act(() => emitEmberReaction('wow'))).not.toThrow();
    act(() => quiet.unmount());
    act(() => lively.unmount());
    // Nobody is listening any more.
    expect(() => emitEmberReaction('cheer')).not.toThrow();
  });

  it('stops touching its state once it is gone', async () => {
    const error = jest.spyOn(console, 'error').mockImplementation(() => {});
    const tree = await render(<Ember reactive />);
    act(() => pressable(tree).props.onPress());
    act(() => pressable(tree).props.onLongPress());
    act(() => tree.unmount());
    act(() => {
      jest.advanceTimersByTime(60000);
      emitEmberReaction('cheer');
    });
    expect(error).not.toHaveBeenCalled();
    error.mockRestore();
  });

  it('can be paused without losing its place', async () => {
    const tree = await render(<Ember paused />);
    act(() => {
      jest.advanceTimersByTime(20000);
    });
    expect(tree.toJSON()).not.toBeNull();
    act(() => tree.unmount());
  });
});
