/**
 * Finishing a Pause session tells the Breathe widget, the island's Calm view and the Android overlay,
 * and a widget that cannot be reached never breaks finishing a session.
 */

import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

const mockSync = jest.fn();
const mockRecord = jest.fn();
const mockEmpty = { days: {}, totalSeconds: 0, sessions: 0, tried: [], earned: [] };

jest.mock('@react-navigation/native', () => ({
  useFocusEffect: (effect: () => void) => {
    const { useEffect } = jest.requireActual('react');
    useEffect(effect, [effect]);
  },
}));
jest.mock('../src/app/di', () => ({
  getPauseProgressUseCase: { execute: () => mockEmpty },
  recordPauseSessionUseCase: { execute: (...args: unknown[]) => mockRecord(...args) },
}));
jest.mock('../src/shared/platform/widgetSync', () => ({
  widgetSync: { syncPauseGlance: () => mockSync() },
}));

import { usePauseProgress } from '../src/features/pause/hooks/usePauseProgress';

function record(seconds: number): unknown {
  let api: ReturnType<typeof usePauseProgress> | undefined;
  function Probe() {
    api = usePauseProgress();
    return null;
  }
  act(() => {
    TestRenderer.create(<Probe />);
  });
  let result: unknown;
  act(() => {
    result = api!.record('sigh', seconds);
  });
  return result;
}

beforeEach(() => {
  mockSync.mockReset();
  mockRecord.mockReset();
  mockRecord.mockReturnValue({ progress: mockEmpty, addedSeconds: 60 });
});

describe('usePauseProgress.record', () => {
  it('records the session, then refreshes the widgets once', () => {
    record(60);
    expect(mockRecord).toHaveBeenCalledTimes(1);
    expect(mockSync).toHaveBeenCalledTimes(1);
  });

  it('still returns the result when the widgets cannot be reached', () => {
    mockSync.mockImplementation(() => {
      throw new Error('widget sync used before the composition root registered it');
    });
    expect(record(60)).toEqual({ progress: mockEmpty, addedSeconds: 60 });
  });
});
