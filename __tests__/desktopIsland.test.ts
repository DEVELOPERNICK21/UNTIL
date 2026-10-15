import { buildPanelModel } from '../src/shared/time/panelModel';
import { buildPeriods } from '../desktop/src/periods';
import {
  ISLAND_MODES,
  MODE_ACCENT,
  MODE_CHIP,
  loadMode,
  saveMode,
  stickerFor,
  summaryFor,
} from '../desktop/src/islandModes';
import {
  IDLE_TIMER,
  formatTimer,
  hourFraction,
  loadTimer,
  resetTimer,
  saveTimer,
  timerMs,
  timerStatus,
  toggleTimer,
} from '../desktop/src/timer';

const NOON = new Date(2026, 9, 15, 12, 0, 0);
const periods = buildPeriods(
  buildPanelModel({ signedIn: true, birthDate: '1990-05-01', deathAge: 80 }, NOON),
  { signedIn: true },
);
const lockedPeriods = buildPeriods(
  buildPanelModel({ signedIn: true, birthDate: null, deathAge: 80 }, NOON),
  { signedIn: true },
);

function memoryStorage(initial: Record<string, string> = {}) {
  const data = { ...initial };
  return {
    getItem: (k: string) => data[k] ?? null,
    setItem: (k: string, v: string) => {
      data[k] = v;
    },
  };
}

describe('the hour timer', () => {
  it('starts, counts, pauses and keeps what it counted', () => {
    const t0 = 1_000_000;
    const running = toggleTimer(IDLE_TIMER, t0);
    expect(running.running).toBe(true);
    expect(timerMs(running, t0 + 90_000)).toBe(90_000);
    const paused = toggleTimer(running, t0 + 90_000);
    expect(paused.running).toBe(false);
    expect(timerMs(paused, t0 + 999_999)).toBe(90_000);
    const again = toggleTimer(paused, t0 + 200_000);
    expect(timerMs(again, t0 + 230_000)).toBe(120_000);
  });

  it('resets to nothing', () => {
    expect(resetTimer()).toEqual(IDLE_TIMER);
  });

  it('reads out like the phone: M:SS under an hour, H:MM:SS after', () => {
    expect(formatTimer(0)).toBe('0:00');
    expect(formatTimer(65_000)).toBe('1:05');
    expect(formatTimer(3_725_000)).toBe('1:02:05');
  });

  it('knows how far through the hour it is', () => {
    expect(hourFraction(1_800_000)).toBeCloseTo(0.5);
    expect(hourFraction(3_600_000)).toBe(0);
    expect(hourFraction(5_400_000)).toBeCloseTo(0.5);
  });

  it('says whether it is ready, running or paused', () => {
    expect(timerStatus(IDLE_TIMER)).toBe('ready');
    expect(timerStatus({ running: true, startMs: 5, elapsedMs: 0 })).toBe('running');
    expect(timerStatus({ running: false, startMs: 0, elapsedMs: 4000 })).toBe('paused');
  });

  it('is saved and loaded, and a broken save gives a fresh timer', () => {
    const storage = memoryStorage();
    const running = toggleTimer(IDLE_TIMER, 42);
    saveTimer(running, storage);
    expect(loadTimer(storage)).toEqual(running);
    expect(loadTimer(memoryStorage({ 'until.desktop.hourTimer': 'oops' }))).toEqual(IDLE_TIMER);
    expect(loadTimer(memoryStorage({ 'until.desktop.hourTimer': '{"running":"yes"}' }))).toEqual(IDLE_TIMER);
  });
});

describe('island modes', () => {
  it('has the same views as the phone island that the desktop can show', () => {
    expect(ISLAND_MODES).toEqual(['day', 'month', 'year', 'life', 'timer']);
    ISLAND_MODES.forEach(mode => expect(MODE_CHIP[mode]).toBeTruthy());
    expect(Object.keys(MODE_ACCENT)).toEqual(['month', 'year', 'life', 'timer']);
  });

  it('remembers the chosen view and falls back to Today', () => {
    const storage = memoryStorage();
    expect(loadMode(storage)).toBe('day');
    saveMode('year', storage);
    expect(loadMode(storage)).toBe('year');
    expect(loadMode(memoryStorage({ 'until.desktop.islandMode': 'tasks' }))).toBe('day');
  });

  it('picks a sticker by how far through you are', () => {
    expect(stickerFor('day', 0.02)).toBe('🌙');
    expect(stickerFor('day', 0.4)).toBe('🌞');
    expect(stickerFor('day', 0.5)).toBe('🌤️');
    expect(stickerFor('day', 0.99)).toBe('🌌');
    expect(stickerFor('month', 1)).toBe('🌕');
    expect(stickerFor('year', 0.3)).toBe('🌱');
    expect(stickerFor('life', 0.5)).toBe('🧑');
    expect(stickerFor('timer', null, IDLE_TIMER, 0)).toBe('🌱');
    expect(stickerFor('timer', null, { running: false, startMs: 0, elapsedMs: 70 * 60_000 }, 0)).toBe('🏆');
  });
});

describe('summaryFor', () => {
  const timer = IDLE_TIMER;

  it('says the time left today with a Today bar', () => {
    const s = summaryFor('day', periods, timer, 0);
    expect(s.label).toBe('left today');
    expect(s.bar).toBe('Today');
    expect(s.percent).toBe('50%');
    expect(s.progress).toBeCloseTo(0.5, 2);
  });

  it('says the days left in the month and the year', () => {
    expect(summaryFor('month', periods, timer, 0)).toMatchObject({ label: 'left this month', bar: 'Month' });
    expect(summaryFor('month', periods, timer, 0).value).toMatch(/^\d+d$/);
    expect(summaryFor('year', periods, timer, 0)).toMatchObject({ label: 'left this year', bar: 'Year' });
  });

  it('says the years left of a life', () => {
    const s = summaryFor('life', periods, timer, 0);
    expect(s.value).toMatch(/^\d+\.\d yrs$/);
    expect(s.label).toBe('left in your life');
  });

  it('asks to sign in when life is locked, instead of showing a made-up number', () => {
    const s = summaryFor('life', lockedPeriods, timer, 0);
    expect(s.value).toBe('Sign in');
    expect(s.progress).toBeNull();
    expect(s.percent).toBe('');
  });

  it('shows the timer, its state and the share of the hour', () => {
    const t0 = 10_000_000;
    const running = toggleTimer(IDLE_TIMER, t0);
    const s = summaryFor('timer', periods, running, t0 + 15 * 60_000);
    expect(s.value).toBe('15:00');
    expect(s.label).toBe('running');
    expect(s.bar).toBe('Hour');
    expect(s.percent).toBe('25%');
  });

  it('never uses a dash in what it says', () => {
    ISLAND_MODES.forEach(mode => {
      const s = summaryFor(mode, periods, timer, 0);
      [s.value, s.label, s.bar, s.percent].forEach(text => expect(text).not.toMatch(/[—–]/));
    });
  });
});
