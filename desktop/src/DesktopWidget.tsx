import { memo, useCallback, useMemo, useState, type CSSProperties, type MouseEvent } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { buildPanelModel } from '@until/core/time/panelModel';
import { panelProfile } from './localState';
import { useLocalState } from './useLocalState';
import { dayChip } from './periods';
import { useNow } from './useNow';
import { Ember } from './ember/Ember';
import {
  LIFE_COLS,
  dateOverline,
  dayDots,
  fitCell,
  firstWeekday,
  lifeDots,
  lifeEmptyMessage,
  monthCells,
  monthLeadingBlanks,
  monthOverline,
  yearDots,
  type DotState,
} from './widgetData';
import './widgets.css';

/**
 * The phone's widgets on the desktop. Same colours, same dots, same one-number-per-widget rule as
 * ios/UNTILWidgets: Day is a ring with 24 hour dots and Ember in the middle, Month a calendar,
 * Year a dot for every day, Life a dot for every year. Drag a widget by its body.
 */

export type WidgetKind = 'day' | 'month' | 'year' | 'life';
type DaySize = 'small' | 'medium';

const KINDS: WidgetKind[] = ['day', 'month', 'year', 'life'];

function params() {
  const query = new URLSearchParams(window.location.search);
  const kind = query.get('kind') as WidgetKind;
  return {
    kind: KINDS.includes(kind) ? kind : 'day',
    size: (query.get('size') === 'medium' ? 'medium' : 'small') as DaySize,
  };
}

/** Starts dragging the window, unless the press was on a button or on Ember. */
function startDrag(event: MouseEvent) {
  if (event.button !== 0) return;
  if ((event.target as HTMLElement).closest('button, .ember-live')) return;
  try {
    void getCurrentWindow()
      .startDragging()
      .catch(() => {});
  } catch {
    // Outside Tauri (a plain browser) there is no window to drag.
  }
}

const Dots = memo(function Dots(props: {
  states: Array<DotState | 'blank'>;
  cols: number;
  width: number;
  height: number;
  gap: number;
  /** Radius as a share of the cell: 0.5 is a full circle. */
  round?: number;
}) {
  const { states, cols, width, height, gap } = props;
  const cell = fitCell(states.length, cols, width, height, gap);
  const dot = Math.max(2, cell * (props.round ?? 0.78));
  const style = {
    gridTemplateColumns: `repeat(${cols}, ${cell}px)`,
    gap,
    ['--dot' as string]: `${dot}px`,
  } as CSSProperties;
  return (
    <div className="dots" style={style} aria-hidden="true">
      {states.map((state, i) => (
        <span
          key={i}
          className={`dot dot-${state}`}
          style={{ animationDelay: `${Math.min(i * 3, 420)}ms` }}
        />
      ))}
    </div>
  );
});

/** The 365 year dots. Rebuilt only when the day changes, not on every minute tick. */
function YearGrid({ daysPassed }: { daysPassed: number }) {
  const states = useMemo(() => yearDots(daysPassed), [daysPassed]);
  return <Dots states={states} cols={20} width={170} height={118} gap={2.5} round={0.46} />;
}

function DayRing({ progress, size }: { progress: number; size: number }) {
  const stroke = 10 * (size / 108);
  const radius = size / 2 - stroke * 0.9;
  const center = size / 2;
  const pad = 16;
  const length = 2 * Math.PI * radius;
  const share = Math.min(0.9999, Math.max(0, progress));
  const { states } = dayDots(progress);
  const knob = (-90 + share * 360) * (Math.PI / 180);
  return (
    <div className="day-ring" style={{ width: size, height: size }}>
      <svg
        width={size + pad * 2}
        height={size + pad * 2}
        viewBox={`${-pad} ${-pad} ${size + pad * 2} ${size + pad * 2}`}
        aria-hidden="true"
      >
        <circle className="ring-track" cx={center} cy={center} r={radius} strokeWidth={stroke} fill="none" />
        <circle
          className="ring-arc"
          cx={center}
          cy={center}
          r={radius}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${length * share} ${length}`}
          transform={`rotate(-90 ${center} ${center})`}
        />
        {states.map((state, i) => {
          const angle = (-90 + (i * 360) / states.length) * (Math.PI / 180);
          const r = radius + stroke * 1.4;
          return (
            <circle
              key={i}
              className={`hour hour-${state}`}
              cx={center + r * Math.cos(angle)}
              cy={center + r * Math.sin(angle)}
              r={state === 'current' ? 3.2 : 2.4}
            />
          );
        })}
        {share > 0 ? (
          <circle
            className="ring-knob"
            cx={center + radius * Math.cos(knob)}
            cy={center + radius * Math.sin(knob)}
            r={4.5}
          />
        ) : null}
      </svg>
      <div className="day-ember">
        <Ember progress={progress} size={Math.round(radius * 1.55)} ring={false} />
      </div>
    </div>
  );
}

function Hero(props: { value: string; unit?: string; size: number }) {
  return (
    <div className="w-hero" style={{ fontSize: props.size }}>
      <span key={props.value} className="w-hero-value">
        {props.value}
      </span>
      {props.unit ? <span className="w-hero-unit">{props.unit}</span> : null}
    </div>
  );
}

export function DesktopWidget() {
  const initial = params();
  const { kind } = initial;
  const now = useNow('minute');
  const [size, setSize] = useState<DaySize>(initial.size);

  const local = useLocalState();
  const profile = panelProfile(local);
  const model = buildPanelModel(profile, now);
  const weekStart = useMemo(() => firstWeekday(), []);
  const deathAge = profile.deathAge ?? 80;
  const lifeInfo = useMemo(
    () => (model.life ? lifeDots(model.life, deathAge) : null),
    // Only the numbers matter, not the object: it is rebuilt on every tick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [model.life?.passedDays, model.life?.leftDays, model.life?.totalLifeDays, deathAge],
  );

  const toggleSize = useCallback(() => {
    const next: DaySize = size === 'small' ? 'medium' : 'small';
    setSize(next);
    void invoke('widget_set_size', { kind, size: next }).catch(() => {});
  }, [kind, size]);

  const close = useCallback(() => {
    void invoke('widget_close', { kind }).catch(() => {});
  }, [kind]);

  const openPanel = useCallback(() => {
    void invoke('widget_open_panel').catch(() => {});
  }, []);

  // Today, this month and this year need no account, like the phone's widgets. Only Life needs a
  // birth date, which comes from the account.
  let body;
  if (kind === 'day') {
    const left = dayChip(model.day.leftStr);
    body =
      size === 'small' ? (
        <div className="day-small">
          <DayRing progress={model.day.progress} size={104} />
          <span className="w-left">{left} left</span>
        </div>
      ) : (
        <div className="day-medium">
          <DayRing progress={model.day.progress} size={112} />
          <div className="w-text">
            <span className="w-overline">{dateOverline(now)}</span>
            <Hero value={left} size={36} />
            <span className="w-caption">left today</span>
          </div>
        </div>
      );
  } else if (kind === 'month') {
    const daysInMonth = model.month.passedDays + model.month.leftDays;
    const cells = monthCells(daysInMonth, model.month.passedDays, monthLeadingBlanks(now, weekStart));
    const left = model.month.leftDays;
    body = (
      <div className="split">
        <div className="w-text">
          <span className="w-overline">{monthOverline(now)}</span>
          <div className="w-spacer" />
          <Hero value={String(left)} size={52} />
          <span className="w-caption">{left === 1 ? 'day left' : 'days left'}</span>
          <div className="w-spacer" />
        </div>
        <div className="grid-box month-box">
          <Dots states={cells} cols={7} width={132} height={104} gap={5} round={0.5} />
        </div>
      </div>
    );
  } else if (kind === 'year') {
    const left = model.year.leftDays;
    body = (
      <div className="split">
        <div className="w-text">
          <span className="w-overline">{now.getFullYear()}</span>
          <div className="w-spacer" />
          <Hero value={String(left)} size={48} />
          <span className="w-caption">{left === 1 ? 'day left' : 'days left'}</span>
          <div className="w-spacer" />
        </div>
        <div className="grid-box year-box">
          <YearGrid daysPassed={model.year.passedDays} />
        </div>
      </div>
    );
  } else if (lifeInfo) {
    const life = lifeInfo;
    body = (
      <div className="split">
        <div className="w-text life-text">
          <span className="w-overline">Your life</span>
          <div className="w-spacer" />
          <Hero value={life.leftYears} size={42} />
          <span className="w-caption">years left of {life.plan}</span>
          <div className="w-spacer" />
        </div>
        <div className="grid-box life-box">
          <Dots states={life.states} cols={LIFE_COLS} width={150} height={118} gap={4} round={0.46} />
        </div>
      </div>
    );
  } else {
    body = (
      <div className="w-empty">
        <Ember progress={model.day.progress} size={64} ring={false} />
        <p>{lifeEmptyMessage(profile.signedIn)}</p>
      </div>
    );
  }

  return (
    <div className={`widget widget-${kind} widget-${kind === 'day' ? size : 'medium'}`} onMouseDown={startDrag}>
      <div className="w-controls">
        <button type="button" onClick={openPanel} title="Open UNTIL" aria-label="Open UNTIL">
          <svg viewBox="0 0 16 16" width="11" height="11" aria-hidden="true">
            <path d="M6 3H3v10h10v-3M9 3h4v4M13 3L7.5 8.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        {kind === 'day' ? (
          <button
            type="button"
            onClick={toggleSize}
            title={size === 'small' ? 'Make it wider' : 'Make it smaller'}
            aria-label="Change size"
          >
            <svg viewBox="0 0 16 16" width="11" height="11" aria-hidden="true">
              <rect x="2.5" y="4.5" width={size === 'small' ? 11 : 6} height="7" rx="1.6" fill="none" stroke="currentColor" strokeWidth="1.6" />
            </svg>
          </button>
        ) : null}
        <button type="button" onClick={close} title="Close widget" aria-label="Close widget">
          <svg viewBox="0 0 16 16" width="11" height="11" aria-hidden="true">
            <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      {body}
    </div>
  );
}
