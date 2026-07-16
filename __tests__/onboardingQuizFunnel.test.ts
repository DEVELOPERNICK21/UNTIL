import {
  buildResultCards,
  getFunnelEncouragement,
  getFunnelProgress,
  getReclaimHours,
  nextFunnelStep,
  ONBOARDING_PROGRESS_STEPS,
  prevFunnelStep,
} from '../src/core/onboarding';

describe('onboarding quiz funnel', () => {
  it('maps drain to reclaim hours', () => {
    expect(getReclaimHours('social')).toBe(21);
    expect(getReclaimHours('work')).toBe(18);
    expect(getReclaimHours('busywork')).toBe(15);
    expect(getReclaimHours('priorities')).toBe(12);
    expect(getReclaimHours('unsure')).toBe(14);
    expect(getReclaimHours(undefined)).toBe(14);
  });

  it('builds personalized result cards', () => {
    const cards = buildResultCards({
      goal: 'people',
      timeDrain: 'social',
      valuesPriority: 'people',
      cadence: 'both',
      readiness: 'ready',
    });
    expect(cards).toHaveLength(3);
    expect(cards[0]?.text).toContain('21 hrs/week');
    expect(cards[1]?.text).toContain('time with people');
    expect(cards[2]?.text).toBe('Daily awareness check-ins enabled');
  });

  it('uses widgets cadence copy', () => {
    const cards = buildResultCards({
      timeDrain: 'work',
      valuesPriority: 'focus',
      cadence: 'widgets',
    });
    expect(cards[2]?.text).toBe('Home screen widgets prioritized');
  });

  it('advances and rewinds steps', () => {
    expect(nextFunnelStep('brand')).toBe('day_demo');
    expect(nextFunnelStep('day_demo')).toBe('widgets_demo');
    expect(nextFunnelStep('widgets_demo')).toBe('q_goal');
    expect(nextFunnelStep('results')).toBe('paywall');
    expect(nextFunnelStep('paywall')).toBeNull();
    expect(prevFunnelStep('q_goal')).toBe('widgets_demo');
    expect(prevFunnelStep('day_demo')).toBe('brand');
    expect(prevFunnelStep('brand')).toBeNull();
  });

  it('applies goal-gradient progress (head start + late ramp)', () => {
    expect(getFunnelProgress('brand')).toBe(0);
    expect(getFunnelProgress('paywall')).toBe(0);
    expect(getFunnelProgress('day_demo')).toBeCloseTo(0.18, 2);
    expect(getFunnelProgress('widgets_demo')).toBeCloseTo(0.28, 2);
    expect(getFunnelProgress('q_goal')).toBeCloseTo(0.35, 2);
    expect(getFunnelProgress('q_drain')).toBeCloseTo(0.42, 2);
    expect(getFunnelProgress('interstitial')).toBeCloseTo(0.48, 2);
    expect(getFunnelProgress('identity')).toBeCloseTo(0.55, 2);
    expect(getFunnelProgress('life_weeks')).toBeCloseTo(0.68, 2);
    expect(getFunnelProgress('q_values')).toBeCloseTo(0.75, 2);
    expect(getFunnelProgress('q_cadence')).toBeCloseTo(0.82, 2);
    expect(getFunnelProgress('q_readiness')).toBeCloseTo(0.88, 2);
    expect(getFunnelProgress('loader')).toBeCloseTo(0.95, 2);
    expect(getFunnelProgress('results')).toBe(1);
  });

  it('progress is monotone across progress steps', () => {
    let prev = -1;
    for (const step of ONBOARDING_PROGRESS_STEPS) {
      const p = getFunnelProgress(step);
      expect(p).toBeGreaterThan(prev);
      prev = p;
    }
  });

  it('maps encouragement by stage', () => {
    expect(getFunnelEncouragement('brand')).toBeNull();
    expect(getFunnelEncouragement('paywall')).toBeNull();
    expect(getFunnelEncouragement('day_demo')).toBe("You're underway");
    expect(getFunnelEncouragement('widgets_demo')).toBe("You're underway");
    expect(getFunnelEncouragement('q_goal')).toBe("You're underway");
    expect(getFunnelEncouragement('q_drain')).toBe("You're underway");
    expect(getFunnelEncouragement('interstitial')).toBe(
      'Your time map is forming'
    );
    expect(getFunnelEncouragement('identity')).toBe('Your time map is forming');
    expect(getFunnelEncouragement('life_weeks')).toBe(
      'Your time map is forming'
    );
    expect(getFunnelEncouragement('q_values')).toBe('Almost ready');
    expect(getFunnelEncouragement('q_cadence')).toBe('Almost ready');
    expect(getFunnelEncouragement('q_readiness')).toBe('Almost ready');
    expect(getFunnelEncouragement('loader')).toBe('Your plan is ready');
    expect(getFunnelEncouragement('results')).toBe('Your plan is ready');
  });
});
