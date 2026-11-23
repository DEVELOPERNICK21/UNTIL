/**
 * How someone moves through one Pause session. In particular: "still tight" gets one gentler round, then
 * moves on, and no step can be reached by the wrong action.
 */

import {
  MAX_ROUNDS,
  WEIGHTS,
  initialPauseState,
  pauseReducer,
  type PauseAction,
  type PauseState,
} from '../src/features/pause/domain/pauseFlow';

const fresh = (): PauseState => initialPauseState('box', true);
const run = (actions: PauseAction[], from: PauseState = fresh()): PauseState => actions.reduce(pauseReducer, from);
const done = (seconds = 60): PauseAction => ({ type: 'practiceDone', seconds });

describe('starting', () => {
  it('opens on "ready" for a chosen practice, with its own default length', () => {
    expect(initialPauseState('wind', false)).toMatchObject({ step: 'ready', practice: 'wind', seconds: 180, round: 1 });
  });

  it('opens straight on the practice for the panic button', () => {
    expect(initialPauseState('sigh', true)).toMatchObject({ step: 'breathe', practice: 'sigh', seconds: 60 });
  });

  it('starts with nothing practised, no weight, no focus, not tight', () => {
    expect(fresh()).toMatchObject({ practiceSeconds: 0, weight: null, focus: null, stillTight: false });
  });

  it('"start" picks the length and begins, only from "ready"', () => {
    const s = pauseReducer(initialPauseState('coherent', false), { type: 'start', seconds: 300 });
    expect(s).toMatchObject({ step: 'breathe', seconds: 300 });
    const already = fresh();
    expect(pauseReducer(already, { type: 'start', seconds: 300 })).toBe(already);
  });
});

describe('practising and checking in', () => {
  it('counts the seconds practised and moves to the check-in', () => {
    const s = run([done(95)]);
    expect(s.step).toBe('checkIn');
    expect(s.practiceSeconds).toBe(95);
  });

  it('never counts negative time', () => {
    expect(run([done(-30)]).practiceSeconds).toBe(0);
  });

  it.each(['calmer', 'same'] as const)('moves on to "what feels heavy" after "%s"', feeling => {
    const s = run([done(), { type: 'feeling', feeling }]);
    expect(s.step).toBe('weight');
    expect(s.stillTight).toBe(false);
  });

  it('gives "still tight" one more round, with a gentler pattern, and adds up the time', () => {
    const s = run([done(60), { type: 'feeling', feeling: 'tight' }]);
    expect(s).toMatchObject({ step: 'breathe', round: 2, practice: 'coherent', stillTight: false });
    expect(run([done(60), { type: 'feeling', feeling: 'tight' }, done(60)]).practiceSeconds).toBe(120);
  });

  it('from slow breathing the gentler round is the long exhale', () => {
    const s = run([done(), { type: 'feeling', feeling: 'tight' }], initialPauseState('coherent', true));
    expect(s.practice).toBe('extended');
  });

  it('keeps a gentler round between one and three minutes', () => {
    const long = pauseReducer(initialPauseState('box', true), { type: 'practiceDone', seconds: 300 });
    const long2 = { ...long, seconds: 300 };
    expect(pauseReducer(long2, { type: 'feeling', feeling: 'tight' }).seconds).toBe(180);
    const short = { ...long, seconds: 20 };
    expect(pauseReducer(short, { type: 'feeling', feeling: 'tight' }).seconds).toBe(60);
  });

  it('does not loop: still tight twice moves on and remembers it', () => {
    expect(MAX_ROUNDS).toBe(2);
    const s = run([
      done(), { type: 'feeling', feeling: 'tight' },
      done(), { type: 'feeling', feeling: 'tight' },
    ]);
    expect(s).toMatchObject({ step: 'weight', round: 2, stillTight: true });
  });

  it('forgets "still tight" when the second round helped', () => {
    const s = run([
      done(), { type: 'feeling', feeling: 'tight' },
      done(), { type: 'feeling', feeling: 'calmer' },
    ]);
    expect(s.stillTight).toBe(false);
  });
});

describe('what feels heavy, and the path', () => {
  const toWeight = (): PauseAction[] => [done(), { type: 'feeling', feeling: 'same' }];

  it.each(WEIGHTS)('opens the path for "%s"', weight => {
    expect(run([...toWeight(), { type: 'weight', weight }])).toMatchObject({ step: 'path', weight });
  });

  it('skipping the question goes straight to the close', () => {
    expect(run([...toWeight(), { type: 'weight', weight: null }])).toMatchObject({ step: 'close', weight: null });
  });

  it('carries the one thing chosen to the close, trimmed, and treats blank as none', () => {
    const toPath = [...toWeight(), { type: 'weight', weight: 'load' }] as PauseAction[];
    expect(run([...toPath, { type: 'pathDone', focus: '  Book the dentist ' }]).focus).toBe('Book the dentist');
    expect(run([...toPath, { type: 'pathDone' }]).focus).toBeNull();
    expect(run([...toPath, { type: 'pathDone', focus: '   ' }]).focus).toBeNull();
  });
});

describe('wrong actions', () => {
  it('are ignored, and keep the same state object so nothing re-renders', () => {
    const start = fresh();
    expect(pauseReducer(start, { type: 'feeling', feeling: 'calmer' })).toBe(start);
    expect(pauseReducer(start, { type: 'weight', weight: 'load' })).toBe(start);
    expect(pauseReducer(start, { type: 'pathDone' })).toBe(start);

    const atCheckIn = run([done()]);
    expect(pauseReducer(atCheckIn, done())).toBe(atCheckIn);

    const atClose = run([done(), { type: 'feeling', feeling: 'calmer' }, { type: 'weight', weight: null }]);
    expect(pauseReducer(atClose, { type: 'pathDone' })).toBe(atClose);
    expect(pauseReducer(atClose, done())).toBe(atClose);
  });
});
