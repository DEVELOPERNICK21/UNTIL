/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { Text } from 'react-native';
import { CrashErrorBoundary } from '../src/components/CrashErrorBoundary';

const mockRecordCrashError = jest.fn();
const mockLogCrashBreadcrumb = jest.fn();

jest.mock('../src/services/analytics', () => ({
  recordCrashError: (...args: unknown[]) => mockRecordCrashError(...args),
  logCrashBreadcrumb: (...args: unknown[]) => mockLogCrashBreadcrumb(...args),
}));

function Boom(): React.ReactElement {
  throw new Error('render boom');
}

describe('CrashErrorBoundary', () => {
  beforeEach(() => {
    mockRecordCrashError.mockClear();
    mockLogCrashBreadcrumb.mockClear();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('reports render errors and shows a recovery UI', async () => {
    let tree: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      tree = ReactTestRenderer.create(
        <CrashErrorBoundary>
          <Boom />
        </CrashErrorBoundary>
      );
    });

    expect(mockRecordCrashError).toHaveBeenCalledTimes(1);
    expect(mockRecordCrashError.mock.calls[0][0]).toEqual(
      expect.objectContaining({ message: 'render boom' })
    );
    expect(mockRecordCrashError.mock.calls[0][1]).toBe('CrashErrorBoundary');

    const texts = tree!
      .root.findAllByType(Text)
      .map(node => node.props.children)
      .flat();
    expect(texts).toEqual(
      expect.arrayContaining([
        'Something went wrong',
        'The app hit an unexpected error. You can try again.',
        'Try again',
      ])
    );
  });

  it('resets and re-renders children after Try again', async () => {
    let shouldThrow = true;
    function Flaky(): React.ReactElement {
      if (shouldThrow) throw new Error('flaky');
      return <Text>recovered</Text>;
    }

    let tree: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      tree = ReactTestRenderer.create(
        <CrashErrorBoundary>
          <Flaky />
        </CrashErrorBoundary>
      );
    });

    shouldThrow = false;
    const button = tree!.root.findByProps({ accessibilityLabel: 'Try again' });
    await ReactTestRenderer.act(() => {
      button.props.onPress();
    });

    expect(
      tree!.root.findAllByType(Text).some(n => n.props.children === 'recovered')
    ).toBe(true);
  });
});
