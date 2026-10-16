import { useCallback, useEffect, useState, type CSSProperties, type MouseEvent } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { buildPanelModel } from '@until/shared/time/panelModel';
import { getProgressColor } from '@until/shared/theme/progressColor';
import { timeOfDayLabel } from '@until/shared/theme/emotionalCopy';
import { panelProfile } from './localState';
import { useLocalState } from './useLocalState';
import { buildPeriods, type PeriodKey } from './periods';
import {
  ISLAND_MODES,
  MODE_ACCENT,
  MODE_CHIP,
  MODE_LABEL,
  MODE_STORAGE_KEY,
  isIslandMode,
  loadMode,
  saveMode,
  stickerFor,
  summaryFor,
  type IslandMode,
} from './islandModes';
import {
  TIMER_STORAGE_KEY,
  formatTimer,
  hourFraction,
  loadTimer,
  resetTimer,
  saveTimer,
  timerMs,
  timerStatus,
  toggleTimer,
} from './timer';
import { useNow } from './useNow';
import { Ember } from './ember/Ember';
import { Dial } from './Dial';
import { Digits } from './Digits';
import './notch.css';

/**
 * The Mac notch island, in the style of the iPhone's Dynamic Island. Folded, it is a compact
 * capsule: Ember and a number either side of the notch and a bar underneath, for whichever view
 * you picked. When the pointer rests on it the Rust side tells this page to open, and the card
 * grows out of the notch with that view and a row of stickers to switch between Today, Month,
 * Year, Life and the hour timer. The view you pick is remembered.
 */

const DEFAULT_NOTCH = { width: 221, height: 38 };
const DATE_FORMAT: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short' };
const PERIODS: PeriodKey[] = ['day', 'month', 'year', 'life'];

const HEADING: Record<IslandMode, string> = {
  day: '',
  month: 'This month',
  year: 'This year',
  life: 'Your life',
  timer: 'Hour timer',
};

const inTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

/** Open it in a plain browser to look at it: `?view=notch&nw=221&nh=38&open=1&mode=month`. */
function previewParams() {
  const query = new URLSearchParams(window.location.search);
  const mode = query.get('mode');
  return {
    width: Number(query.get('nw')) || DEFAULT_NOTCH.width,
    height: Number(query.get('nh')) || DEFAULT_NOTCH.height,
    open: query.get('open') === '1',
    compact: query.get('compact') !== '0',
    mode: !inTauri && isIslandMode(mode) ? mode : null,
  };
}

function PlayIcon({ running }: { running: boolean }) {
  return running ? (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
      <rect x="3.5" y="3" width="3.2" height="10" rx="1" fill="currentColor" />
      <rect x="9.3" y="3" width="3.2" height="10" rx="1" fill="currentColor" />
    </svg>
  ) : (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
      <path d="M4.5 2.8v10.4a.6.6 0 0 0 .9.5l8.2-5.2a.6.6 0 0 0 0-1L5.4 2.3a.6.6 0 0 0-.9.5z" fill="currentColor" />
    </svg>
  );
}

function ResetIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
      <path
        d="M3 8a5 5 0 1 0 1.6-3.7M3 2.5v3h3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function NotchIsland() {
  const preview = previewParams();
  const now = useNow();
  const [notch, setNotch] = useState({ width: preview.width, height: preview.height });
  const [open, setOpen] = useState(preview.open);
  const [compact, setCompact] = useState(preview.compact);
  const [opens, setOpens] = useState(0);
  const [mode, setMode] = useState<IslandMode>(() => preview.mode ?? loadMode());
  const [timer, setTimer] = useState(loadTimer);

  useEffect(() => {
    if (!inTauri) return;
    const stops: Array<() => void> = [];
    void invoke<{ width: number; height: number; compact: boolean } | null>('notch_info')
      .then(info => {
        if (!info) return;
        setNotch({ width: info.width, height: info.height });
        setCompact(info.compact);
      })
      .catch(() => {});
    void listen<boolean>('notch://state', event => setOpen(event.payload)).then(stop => {
      stops.push(stop);
    });
    void listen<boolean>('notch://compact', event => setCompact(event.payload)).then(stop => {
      stops.push(stop);
    });
    return () => stops.forEach(stop => stop());
  }, []);

  // Tells the app this page has run (the release self-test waits for it).
  useEffect(() => {
    if (inTauri) void invoke('page_ready').catch(() => {});
  }, []);

  // Another window changed the view or the timer.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === MODE_STORAGE_KEY) setMode(loadMode());
      if (event.key === TIMER_STORAGE_KEY) setTimer(loadTimer());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => {
    if (open) setOpens(n => n + 1);
  }, [open]);

  const choose = useCallback((next: IslandMode) => {
    setMode(next);
    saveMode(next);
  }, []);

  const toggle = useCallback(() => {
    setTimer(current => {
      const next = toggleTimer(current, Date.now());
      saveTimer(next);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    const next = resetTimer();
    setTimer(next);
    saveTimer(next);
  }, []);

  const openPanel = useCallback(() => {
    void invoke('notch_open_panel').catch(() => {});
  }, []);

  const local = useLocalState();
  const profile = panelProfile(local);
  const model = buildPanelModel(profile, now);
  const periods = buildPeriods(model, { signedIn: profile.signedIn });
  const nowMs = now.getTime();
  const elapsed = timerMs(timer, nowMs);
  const fraction = hourFraction(elapsed);
  const summary = summaryFor(mode, periods, timer, nowMs);

  const dayColor = getProgressColor(model.day.progress);
  const accent = mode === 'day' ? dayColor : MODE_ACCENT[mode];
  const current = mode === 'timer' ? null : periods[mode];
  const share = mode === 'timer' ? null : (current?.progress ?? null);
  const sticker = stickerFor(mode, share, timer, nowMs);

  const dialProgress = mode === 'timer' ? fraction : (current?.progress ?? null);
  const dialTicks =
    mode === 'timer'
      ? { count: 12, passed: Math.floor(fraction * 12) }
      : (current?.ticks ?? null);
  const dialPercent = mode === 'timer' ? `${Math.floor(fraction * 100)}` : (current?.passedPct ?? null);

  const stop = (event: MouseEvent) => event.stopPropagation();

  const style = {
    '--nw': `${notch.width}px`,
    '--nh': `${notch.height}px`,
    '--accent': accent,
  } as CSSProperties;

  return (
    <div className="notch-root" style={style}>
      <div
        className="island"
        // In a plain browser there is no pointer watcher, so hover stands in for it.
        onMouseEnter={inTauri ? undefined : () => setOpen(true)}
        onMouseLeave={inTauri ? undefined : () => setOpen(false)}
        data-open={open ? 'on' : 'off'}
        data-compact={compact ? 'on' : 'off'}
        data-mode={mode}
        role="button"
        tabIndex={open ? 0 : -1}
        aria-label="Open the UNTIL panel"
        onClick={openPanel}
        onKeyDown={event => {
          if (event.key === 'Enter') openPanel();
        }}
      >
        <div className="island-clip">
          <div className="island-glow" aria-hidden="true" />

          <div className="island-line" aria-hidden="true">
            <i style={{ width: `${(summary.progress ?? 0) * 100}%`, background: accent }} />
          </div>

          {/* Folded and compact: Ember on the left of the notch, the number on the right. */}
          <div className="ember-ear" onClick={stop}>
            <Ember progress={model.day.progress} size={38} title="Ember" interactive={open} />
          </div>
          <div className="compact" aria-hidden={open}>
            <span className="compact-value" key={mode === 'timer' ? 'timer' : summary.value}>
              {summary.value}
            </span>
            <span className="compact-label">{summary.label}</span>
          </div>
          <div className="compact-bar" aria-hidden={open}>
            <span className="cb-label">
              <span className="cb-sticker" key={sticker}>
                {sticker}
              </span>
              {summary.bar}
            </span>
            <span className="cb-track">
              <i style={{ width: `${(summary.progress ?? 0) * 100}%` }} />
              {summary.progress == null ? null : <b style={{ left: `${summary.progress * 100}%` }} />}
            </span>
            <span className="cb-pct">{summary.percent}</span>
          </div>

          <div className="island-content" key={opens}>
            <div className="ear ear-right">
              <span>{now.toLocaleDateString(undefined, DATE_FORMAT)}</span>
            </div>

            <div className="island-body" key={mode}>
              <div className="island-dial">
                <Dial progress={dialProgress} color={accent} ticks={dialTicks} size={112}>
                  {dialPercent == null ? (
                    <span className="pct-label">Sign in</span>
                  ) : (
                    <>
                      <span className="pct">
                        {dialPercent}
                        <small>%</small>
                      </span>
                      <span className="pct-label">{mode === 'timer' ? 'of the hour' : 'passed'}</span>
                    </>
                  )}
                </Dial>
              </div>

              <div className="island-info">
                <span className="island-eyebrow">
                  <span className="island-sticker">{sticker}</span>
                  {mode === 'day' ? timeOfDayLabel(now) : HEADING[mode]}
                </span>

                {mode === 'timer' ? (
                  <>
                    <div className="island-hero timer-hero" key={timer.running ? 'on' : 'off'}>
                      {formatTimer(elapsed)}
                    </div>
                    <span className="island-caption">{timerStatus(timer)}</span>
                    <div className="timer-buttons" onClick={stop}>
                      <button
                        type="button"
                        className="round round-main"
                        onClick={toggle}
                        aria-label={timer.running ? 'Pause timer' : 'Start timer'}
                        title={timer.running ? 'Pause' : 'Start'}
                      >
                        <PlayIcon running={timer.running} />
                      </button>
                      <button
                        type="button"
                        className="round"
                        onClick={reset}
                        disabled={elapsed === 0}
                        aria-label="Reset timer"
                        title="Reset"
                      >
                        <ResetIcon />
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="island-hero">
                      <Digits parts={current?.left.parts ?? []} />
                    </div>
                    <span className="island-caption">{current?.left.caption}</span>
                    <div className="island-rows">
                      {PERIODS.filter(key => key !== mode).map(key => {
                        const row = periods[key];
                        const color = row.progress == null ? undefined : getProgressColor(row.progress);
                        return (
                          <div className={`irow${row.locked ? ' irow-locked' : ''}`} key={key}>
                            <span className="irow-label">{row.label}</span>
                            <span className="irow-bar" aria-hidden="true">
                              <i style={{ width: `${(row.progress ?? 0) * 100}%`, background: color }} />
                            </span>
                            <span className="irow-value">{row.locked ? 'Sign in' : row.chip}</span>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="island-chips" role="tablist" aria-label="View" onClick={stop}>
              <span
                className="island-glide"
                aria-hidden="true"
                style={{ transform: `translateX(${ISLAND_MODES.indexOf(mode) * 100}%)` }}
              />
              {ISLAND_MODES.map(key => (
                <button
                  type="button"
                  role="tab"
                  key={key}
                  aria-selected={key === mode}
                  className={`ichip${key === mode ? ' ichip-on' : ''}`}
                  onClick={() => choose(key)}
                  title={MODE_LABEL[key]}
                >
                  <span className="ichip-emoji">{MODE_CHIP[key]}</span>
                  <span className="ichip-label">{MODE_LABEL[key]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
