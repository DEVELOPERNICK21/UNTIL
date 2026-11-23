/**
 * The quiz answers: every one has a label and a picture, and picking one is unambiguous.
 */

import {
  getCadenceOptions,
  getDrainOptions,
  getGoalOptions,
  getReadinessOptions,
  getValuesOptions,
} from '../src/features/onboarding/ui/quizContent';

const SETS = {
  goal: getGoalOptions,
  drain: getDrainOptions,
  values: getValuesOptions,
  cadence: getCadenceOptions,
  readiness: getReadinessOptions,
};

describe.each(Object.entries(SETS))('%s answers', (_name, get) => {
  const options = get();

  it('has at least two answers to choose between', () => {
    expect(options.length).toBeGreaterThanOrEqual(2);
  });

  it('gives every answer a label and a small picture', () => {
    for (const option of options) {
      expect(option.label.trim().length).toBeGreaterThan(0);
      expect(option.emoji?.trim().length ?? 0).toBeGreaterThan(0);
    }
  });

  it('never repeats a value, so a tap means one thing', () => {
    const values = options.map(option => option.value);
    expect(new Set(values).size).toBe(values.length);
  });

  it('does not use the same picture twice in one question', () => {
    const pictures = options.map(option => option.emoji);
    expect(new Set(pictures).size).toBe(pictures.length);
  });
});
