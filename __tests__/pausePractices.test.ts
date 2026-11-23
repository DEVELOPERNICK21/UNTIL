/**
 * The practices Pause offers, which one suits which hour, and the promise that none is locked.
 */

import {
  PRACTICES,
  QUICK_RELIEF,
  QUICK_RELIEF_SECONDS,
  dayPartOf,
  gentlerThan,
  practiceById,
  recommendFor,
} from '../src/features/pause/domain/practices';
import { BREATH_TECHNIQUES } from '../src/features/pause/domain/breathing';

describe('the catalogue', () => {
  it('offers six practices, in order, five of them breathing and one grounding', () => {
    expect(PRACTICES.map(p => p.id)).toEqual(['sigh', 'coherent', 'box', 'extended', 'wind', 'grounding']);
    expect(PRACTICES.filter(p => p.kind === 'breath')).toHaveLength(5);
  });

  it('has a breathing pattern for every breathing practice', () => {
    PRACTICES.filter(p => p.kind === 'breath').forEach(p => {
      expect(BREATH_TECHNIQUES).toHaveProperty(p.id);
    });
  });

  it('is honest about evidence: sighing best, 4-7-8 popular with little research, grounding indirect', () => {
    expect(practiceById('sigh').evidence).toBe('strong');
    expect(practiceById('wind').evidence).toBe('little');
    expect(practiceById('grounding').evidence).toBe('indirect');
  });

  it('keeps every default inside its own list of lengths', () => {
    PRACTICES.forEach(p => {
      expect(p.durations).toContain(p.defaultSeconds);
    });
  });

  it('locks nothing: every practice is available from the first day', () => {
    PRACTICES.forEach(p => {
      expect(p).not.toHaveProperty('locked');
      expect(p).not.toHaveProperty('minLevel');
    });
  });

  it('throws for an unknown practice instead of guessing', () => {
    expect(() => practiceById('nope' as never)).toThrow();
  });
});

describe('the panic button', () => {
  it('is the practice with the best evidence, for one minute', () => {
    expect(QUICK_RELIEF).toBe('sigh');
    expect(practiceById(QUICK_RELIEF).evidence).toBe('strong');
    expect(QUICK_RELIEF_SECONDS).toBe(60);
  });
});

describe('what suits the hour', () => {
  it.each([
    [5, 'coherent'], [8, 'coherent'], [10, 'coherent'],
    [11, 'box'], [14, 'box'], [16, 'box'],
    [17, 'extended'], [19, 'extended'], [20, 'extended'],
    [21, 'wind'], [23, 'wind'], [0, 'wind'], [3, 'wind'], [4, 'wind'],
  ])('at %i o\'clock suggests %s', (hour, expected) => {
    expect(recommendFor(hour)).toBe(expected);
  });

  it('names the part of the day', () => {
    expect(dayPartOf(5)).toBe('morning');
    expect(dayPartOf(11)).toBe('morning');
    expect(dayPartOf(12)).toBe('afternoon');
    expect(dayPartOf(17)).toBe('evening');
    expect(dayPartOf(21)).toBe('evening');
    expect(dayPartOf(22)).toBe('night');
    expect(dayPartOf(4)).toBe('night');
  });

  it('covers every hour of the day', () => {
    for (let h = 0; h < 24; h += 1) {
      expect(PRACTICES.map(p => p.id)).toContain(recommendFor(h));
      expect(['morning', 'afternoon', 'evening', 'night']).toContain(dayPartOf(h));
    }
  });
});

describe('gentlerThan', () => {
  it('moves to slow breathing, and from slow breathing to the long exhale', () => {
    expect(gentlerThan('sigh')).toBe('coherent');
    expect(gentlerThan('box')).toBe('coherent');
    expect(gentlerThan('grounding')).toBe('coherent');
    expect(gentlerThan('coherent')).toBe('extended');
  });
});
