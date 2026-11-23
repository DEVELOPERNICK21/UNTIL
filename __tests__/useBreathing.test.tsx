/**
 * The hook that follows a round of breathing, on a fake clock.
 */

import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { useBreathing } from '../src/features/pause/hooks/useBreathing';
import { BREATH_PACES, ROUND_MS, breathLengthMs } from '../src/features/pause/domain/breathing';
import type { BreathPaceName } from '../src/features/pause/domain/breathing';

type Snapshot = ReturnType<typeof useBreathing>;

let latest: Snapshot;
const onDone = jest.fn();

function Probe({ pace, trackProgress }: { pace: BreathPaceName; trackProgress?: boolean }) {
  latest = useBreathing({ pace, onRoundComplete: onDone, trackProgress });
  return null;
}

const advance = (ms: number) => act(() => void jest.advanceTimersByTime(ms));

function mount(element: React.ReactElement): ReactTestRenderer.ReactTestRenderer {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  act(() => {
    renderer = ReactTestRenderer.create(element);
  });
  return renderer;
}

describe('useBreathing', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    onDone.mockClear();
  });
  afterEach(() => jest.useRealTimers());

  it('starts breathing in, and cannot be skipped yet', () => {
    mount(<Probe pace="steady" />);
    expect(latest.phase).toBe('inhale');
    expect(latest.canContinue).toBe(false);
  });

  it('switches to breathing out when the in-breath is over', () => {
    mount(<Probe pace="steady" />);
    advance(BREATH_PACES.steady.inhaleMs - 200);
    expect(latest.phase).toBe('inhale');
    advance(400);
    expect(latest.phase).toBe('exhale');
    advance(BREATH_PACES.steady.exhaleMs);
    expect(latest.phase).toBe('inhale');
  });

  it('allows moving on after one full breath, not before', () => {
    mount(<Probe pace="steady" />);
    advance(breathLengthMs(BREATH_PACES.steady) - 300);
    expect(latest.canContinue).toBe(false);
    advance(500);
    expect(latest.canContinue).toBe(true);
  });

  it('uses the slower rhythm when asked', () => {
    mount(<Probe pace="slow" />);
    advance(BREATH_PACES.steady.inhaleMs + 200);
    expect(latest.phase).toBe('inhale');
    advance(BREATH_PACES.slow.inhaleMs);
    expect(latest.phase).toBe('exhale');
  });

  it('calls back once when the round is over, and then stops ticking', () => {
    mount(<Probe pace="steady" />);
    advance(ROUND_MS - 500);
    expect(onDone).not.toHaveBeenCalled();
    advance(1000);
    expect(onDone).toHaveBeenCalledTimes(1);
    advance(ROUND_MS * 2);
    expect(onDone).toHaveBeenCalledTimes(1);
    expect(jest.getTimerCount()).toBe(0);
  });

  it('tracks progress through the phase only when asked', () => {
    mount(<Probe pace="steady" trackProgress />);
    advance(BREATH_PACES.steady.inhaleMs / 2);
    expect(latest.phaseProgress).toBeGreaterThan(0.4);
    expect(latest.phaseProgress).toBeLessThan(0.6);

    mount(<Probe pace="steady" />);
    advance(BREATH_PACES.steady.inhaleMs / 2);
    expect(latest.phaseProgress).toBe(0);
  });

  it('stops its timer when the screen goes away, without calling back', () => {
    const r = mount(<Probe pace="steady" />);
    advance(5000);
    act(() => r.unmount());
    expect(jest.getTimerCount()).toBe(0);
    advance(ROUND_MS);
    expect(onDone).not.toHaveBeenCalled();
  });
});
