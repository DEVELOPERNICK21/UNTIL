/**
 * How someone moves through a Pause. In particular: "still tight" gets one slower round, then moves
 * on, and no step can be skipped into by the wrong action.
 */

import {
  MAX_ROUNDS,
  WEIGHTS,
  initialPauseState,
  pauseReducer,
  type PauseAction,
  type PauseState,
} from '../src/features/pause/domain/pauseFlow';

const run = (actions: PauseAction[], from: PauseState = initialPauseState): PauseState =>
  actions.reduce(pauseReducer, from);

describe('pauseReducer', () => {
  it('starts breathing at the steady pace, in round 1', () => {
    expect(initialPauseState).toEqual({
      step: 'breathe',
      round: 1,
      pace: 'steady',
      weight: null,
      stillTight: false,
      focus: null,
    });
  });

  it('goes from breathing to the check-in', () => {
    expect(run([{ type: 'breathDone' }]).step).toBe('checkIn');
  });

  it.each(['calmer', 'same'] as const)('moves on to "what feels heavy" after "%s"', feeling => {
    const s = run([{ type: 'breathDone' }, { type: 'feeling', feeling }]);
    expect(s.step).toBe('weight');
    expect(s.stillTight).toBe(false);
  });

  it('gives "still tight" one more, slower, round', () => {
    const s = run([{ type: 'breathDone' }, { type: 'feeling', feeling: 'tight' }]);
    expect(s).toMatchObject({ step: 'breathe', round: 2, pace: 'slow', stillTight: false });
  });

  it('does not loop: still tight after the last round moves on and remembers it', () => {
    expect(MAX_ROUNDS).toBe(2);
    const s = run([
      { type: 'breathDone' },
      { type: 'feeling', feeling: 'tight' },
      { type: 'breathDone' },
      { type: 'feeling', feeling: 'tight' },
    ]);
    expect(s).toMatchObject({ step: 'weight', round: 2, stillTight: true });
  });

  it('forgets "still tight" when the second round helped', () => {
    const s = run([
      { type: 'breathDone' },
      { type: 'feeling', feeling: 'tight' },
      { type: 'breathDone' },
      { type: 'feeling', feeling: 'calmer' },
    ]);
    expect(s.stillTight).toBe(false);
  });

  it.each(WEIGHTS)('opens the path for "%s"', weight => {
    const s = run([
      { type: 'breathDone' },
      { type: 'feeling', feeling: 'same' },
      { type: 'weight', weight },
    ]);
    expect(s).toMatchObject({ step: 'path', weight });
  });

  it('skipping the question goes straight to the close', () => {
    const s = run([
      { type: 'breathDone' },
      { type: 'feeling', feeling: 'same' },
      { type: 'weight', weight: null },
    ]);
    expect(s).toMatchObject({ step: 'close', weight: null });
  });

  it('ends after the path', () => {
    const s = run([
      { type: 'breathDone' },
      { type: 'feeling', feeling: 'calmer' },
      { type: 'weight', weight: 'load' },
      { type: 'pathDone' },
    ]);
    expect(s.step).toBe('close');
  });

  it('carries the one thing chosen to the close, and trims it', () => {
    const toPath = [
      { type: 'breathDone' },
      { type: 'feeling', feeling: 'calmer' },
      { type: 'weight', weight: 'load' },
    ] as PauseAction[];
    expect(run([...toPath, { type: 'pathDone', focus: '  Book the dentist ' }]).focus).toBe(
      'Book the dentist',
    );
    expect(run([...toPath, { type: 'pathDone' }]).focus).toBeNull();
    expect(run([...toPath, { type: 'pathDone', focus: '   ' }]).focus).toBeNull();
  });

  it('ignores an action that does not belong to the current step', () => {
    expect(run([{ type: 'feeling', feeling: 'calmer' }])).toBe(initialPauseState);
    expect(run([{ type: 'weight', weight: 'load' }])).toBe(initialPauseState);
    expect(run([{ type: 'pathDone' }])).toBe(initialPauseState);

    const atCheckIn = run([{ type: 'breathDone' }]);
    expect(pauseReducer(atCheckIn, { type: 'breathDone' })).toBe(atCheckIn);
  });

  it('keeps the same state object for an ignored action, so nothing re-renders', () => {
    const atClose = run([
      { type: 'breathDone' },
      { type: 'feeling', feeling: 'calmer' },
      { type: 'weight', weight: null },
    ]);
    expect(pauseReducer(atClose, { type: 'pathDone' })).toBe(atClose);
    expect(pauseReducer(atClose, { type: 'breathDone' })).toBe(atClose);
  });
});
