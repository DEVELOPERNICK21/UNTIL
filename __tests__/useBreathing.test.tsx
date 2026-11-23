/**
 * The hook that follows one session of breathing, on a fake clock.
 */

import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { useBreathing, type BreathingView } from '../src/features/pause/hooks/useBreathing';
import { cycleMs, sessionMs, type BreathTechniqueId } from '../src/features/pause/domain/breathing';

let latest: BreathingView;
const onComplete = jest.fn();

function Probe({ technique, seconds = 60 }: { technique: BreathTechniqueId; seconds?: number }) {
  latest = useBreathing({ technique, totalMs: sessionMs(technique, seconds), onComplete });
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
    onComplete.mockClear();
  });
  afterEach(() => jest.useRealTimers());

  it('starts breathing in and cannot be skipped yet', () => {
    mount(<Probe technique="extended" />);
    expect(latest.phase).toBe('inhale');
    expect(latest.canContinue).toBe(false);
    expect(latest.progress).toBe(0);
  });

  it('switches phase on time, through a hold', () => {
    mount(<Probe technique="box" />);
    advance(3900);
    expect(latest.phase).toBe('inhale');
    advance(200);
    expect(latest.phase).toBe('hold');
    advance(4000);
    expect(latest.phase).toBe('exhale');
    advance(4000);
    expect(latest.phase).toBe('rest');
  });

  it('counts the seconds left in the current part of the breath, for following 4-7-8', () => {
    mount(<Probe technique="wind" />);
    advance(100);
    expect(latest.secondsLeft).toBe(4);
    advance(1000);
    expect(latest.secondsLeft).toBe(3);
    advance(3000);
    expect(latest.phase).toBe('hold');
    expect(latest.secondsLeft).toBe(7);
  });

  it('follows the double breath in of cyclic sighing', () => {
    mount(<Probe technique="sigh" />);
    advance(2100);
    expect(latest.phase).toBe('top');
    advance(1000);
    expect(latest.phase).toBe('exhale');
  });

  it('allows moving on after one full breath, not before', () => {
    mount(<Probe technique="extended" />);
    advance(cycleMs('extended') - 300);
    expect(latest.canContinue).toBe(false);
    advance(500);
    expect(latest.canContinue).toBe(true);
  });

  it('fills the ring as the session goes', () => {
    mount(<Probe technique="extended" seconds={60} />);
    advance(30000);
    expect(latest.progress).toBeGreaterThan(0.45);
    expect(latest.progress).toBeLessThan(0.55);
  });

  it('calls back once when the session is over, with the seconds practised, and then stops ticking', () => {
    mount(<Probe technique="extended" seconds={60} />);
    advance(59000);
    expect(onComplete).not.toHaveBeenCalled();
    advance(2000);
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith(60);
    advance(120000);
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(jest.getTimerCount()).toBe(0);
  });

  it('reports the seconds practised so far for someone who leaves early', () => {
    mount(<Probe technique="extended" seconds={180} />);
    advance(25000);
    expect(latest.practisedSeconds()).toBe(25);
  });

  it('never reports more than the session length', () => {
    mount(<Probe technique="extended" seconds={60} />);
    jest.setSystemTime(Date.now() + 10 * 60 * 1000);
    expect(latest.practisedSeconds()).toBe(60);
  });

  it('stops its timer when the screen goes away, without calling back', () => {
    const r = mount(<Probe technique="box" />);
    advance(5000);
    act(() => r.unmount());
    expect(jest.getTimerCount()).toBe(0);
    advance(120000);
    expect(onComplete).not.toHaveBeenCalled();
  });
});
