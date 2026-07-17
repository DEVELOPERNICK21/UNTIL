import {
  personalizedEmberTipsForRoute,
  personalizeWeeklyReflectionMessage,
} from '../src/core/onboarding/personalizedInsights';

describe('personalizedInsights', () => {
  it('adds life grid and priority copy to weekly reflections', () => {
    const message = personalizeWeeklyReflectionMessage(
      'Seven days passed whether you noticed or not.',
      { goal: 'focus', valuesPriority: 'focus' },
      { hasBirthDate: true, lifeProgress: 0.32 }
    );

    expect(message).toContain('life grid is 32% complete');
    expect(message).toContain('deep focus');
  });

  it('returns personalized Ember tips from quiz answers', () => {
    const tips = personalizedEmberTipsForRoute(
      'DayDetail',
      { goal: 'calm', timeDrain: 'social' },
      { dayProgress: 0.4 }
    );

    expect(tips.length).toBeGreaterThanOrEqual(2);
    expect(tips[0]?.body).toContain('doomscroll');
    expect(tips.some(tip => tip.body.includes('phone and social'))).toBe(true);
  });
});
