import { memo, useCallback, useEffect, useId, useRef, useState, type CSSProperties } from 'react';
import { progressBand, type ProgressBand } from '@until/shared/theme/emotionalCopy';
import './ember.css';

/**
 * Ember on the desktop: the same living time stone as the phone. A gem in a brass eye, rune
 * rings turning in opposite directions, and a ring around it that is the day. Drawn in SVG and
 * animated with CSS, so it costs next to nothing while the panel is hidden.
 */

const MOOD: Record<ProgressBand, { hi: string; mid: string; deep: string }> = {
  dawn: { hi: '#FDE68A', mid: '#F59E0B', deep: '#B45309' },
  open: { hi: '#FDA4AF', mid: '#FB7185', deep: '#E11D48' },
  mid: { hi: '#FDBA74', mid: '#E87C20', deep: '#C2410C' },
  late: { hi: '#C4B5FD', mid: '#8B5CF6', deep: '#5B21B6' },
  dusk: { hi: '#A5B4FC', mid: '#6366F1', deep: '#312E81' },
};

const BRASS = { hi: '#F8DC8E', mid: '#D9A441', deep: '#7A5314' };
/** The app's colour for time that has already gone. */
const PASSED = '#BB86FC';

const DAY_R = 47;
const DAY_LEN = 2 * Math.PI * DAY_R;
const RUNE_R = 39;
const DASH_R = 34;
const DASH_PERIOD = (2 * Math.PI * DASH_R) / 36;
const RUNE_SLOTS = 12;
const BURST = 8;

type Face = 'idle' | 'happy' | 'wow' | 'wink';

/** One rune. Three shapes repeat, so the ring looks the same every 90 degrees. */
function runePath(kind: number): string {
  if (kind === 0) return 'M50 6 L52.6 10.2 L50 14.4 L47.4 10.2 Z';
  if (kind === 1) return 'M50 5.6 L53.4 13.4 L46.6 13.4 Z';
  return 'M49.2 5.8 H50.8 V9 H49.2 Z M49.2 11.4 H50.8 V14.4 H49.2 Z';
}

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

export interface EmberProps {
  /** Day progress, 0 to 1. Sets the gem colour, the day ring and how sleepy it is. */
  progress: number;
  /** Width and height in pixels. */
  size?: number;
  /** Tap it and it smiles; move the pointer near it and it watches. */
  interactive?: boolean;
  /** Raise this number to make Ember react, e.g. when the period changes. */
  pulse?: number;
  /** Show the day ring. Off when something else around Ember already draws it. */
  ring?: boolean;
  title?: string;
}

const EmberBody = memo(function EmberBody({
  progress,
  size = 56,
  interactive = true,
  pulse = 0,
  ring = true,
  title,
}: EmberProps) {
  const reduced = prefersReducedMotion();
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const p = Math.min(1, Math.max(0, progress));
  const mood = progressBand(p);
  const colors = MOOD[mood];
  const sleepy = p >= 0.93;
  const left = 1 - p;

  const root = useRef<HTMLDivElement>(null);
  const [awake, setAwake] = useState(reduced);
  const [swept, setSwept] = useState(reduced);
  const [override, setOverride] = useState<Face | null>(null);
  const [hopKey, setHopKey] = useState(0);
  const [burstKey, setBurstKey] = useState(0);
  const faceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const face: Face = override ?? 'idle';

  const show = useCallback((next: Face, ms: number) => {
    setOverride(next);
    if (faceTimer.current) clearTimeout(faceTimer.current);
    faceTimer.current = setTimeout(() => setOverride(null), ms);
  }, []);

  // Wake up when it appears: the lids lift and the day ring draws itself.
  useEffect(() => {
    if (reduced) return;
    const wake = setTimeout(() => setAwake(true), 240);
    const sweep = setTimeout(() => setSwept(true), 120);
    return () => {
      clearTimeout(wake);
      clearTimeout(sweep);
    };
  }, [reduced]);

  useEffect(() => () => {
    if (faceTimer.current) clearTimeout(faceTimer.current);
  }, []);

  // Something changed elsewhere in the panel. A small hop and a surprised look.
  const lastPulse = useRef(pulse);
  useEffect(() => {
    if (pulse === lastPulse.current) return;
    lastPulse.current = pulse;
    show('wow', 700);
    if (!reduced) setHopKey(k => k + 1);
  }, [pulse, reduced, show]);

  // The eyes follow the pointer anywhere over the window. CSS variables, so no re-render.
  useEffect(() => {
    if (!interactive || reduced) return;
    const el = root.current;
    if (!el) return;
    let frame = 0;
    const move = (event: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const box = el.getBoundingClientRect();
        const dx = (event.clientX - (box.left + box.width / 2)) / 160;
        const dy = (event.clientY - (box.top + box.height / 2)) / 160;
        el.style.setProperty('--lx', String(Math.max(-1, Math.min(1, dx))));
        el.style.setProperty('--ly', String(Math.max(-1, Math.min(1, dy))));
      });
    };
    const leave = () => {
      el.style.setProperty('--lx', '0');
      el.style.setProperty('--ly', '0');
    };
    window.addEventListener('pointermove', move, { passive: true });
    document.addEventListener('pointerleave', leave);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('pointermove', move);
      document.removeEventListener('pointerleave', leave);
    };
  }, [interactive, reduced]);

  const poke = useCallback(() => {
    if (!interactive) return;
    show('happy', 1200);
    if (!reduced) {
      setHopKey(k => k + 1);
      setBurstKey(k => k + 1);
    }
  }, [interactive, reduced, show]);

  const lid = awake ? (sleepy ? 0.42 : 0) : 1;
  const lidScale = 0.07 + 0.93 * lid;
  const lidOpacity = Math.min(1, lid / 0.25);
  const sweepLeft = swept ? left : 1;
  const sweepPassed = swept ? p : 0;
  const nowAngle = swept ? p * 360 : 0;
  const happy = face === 'happy' || face === 'wink' || face === 'wow';

  const bodyId = `${uid}-body`;
  const brassId = `${uid}-brass`;
  const brassUpId = `${uid}-brass-up`;
  const auraId = `${uid}-aura`;

  return (
    <div
      ref={root}
      className={`ember${interactive ? ' ember-live' : ''}`}
      style={{ width: size, height: size }}
      onClick={poke}
      role={interactive ? 'button' : 'img'}
      aria-label={title ?? 'Ember, your time companion'}
      tabIndex={interactive ? 0 : -1}
      onKeyDown={event => {
        if (interactive && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault();
          poke();
        }
      }}
    >
      <div className="ember-hop" key={hopKey} data-hop={hopKey > 0 ? 'on' : 'off'}>
        <div className="ember-float">
          <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
            <defs>
              <radialGradient id={auraId} cx="50%" cy="50%" r="50%">
                <stop offset="0" stopColor={colors.mid} stopOpacity={0.5 * (0.55 + 0.45 * left)} />
                <stop offset="0.55" stopColor={colors.mid} stopOpacity={0.16 * (0.55 + 0.45 * left)} />
                <stop offset="1" stopColor={colors.mid} stopOpacity="0" />
              </radialGradient>
              <radialGradient id={bodyId} cx="35%" cy="28%" r="72%">
                <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.95" />
                <stop offset="0.32" stopColor={colors.hi} />
                <stop offset="0.72" stopColor={colors.mid} />
                <stop offset="1" stopColor={colors.deep} />
              </radialGradient>
              <linearGradient id={brassId} x1="0" y1="1" x2="0" y2="0">
                <stop offset="0" stopColor={BRASS.hi} />
                <stop offset="0.55" stopColor={BRASS.mid} />
                <stop offset="1" stopColor={BRASS.deep} />
              </linearGradient>
              <linearGradient id={brassUpId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor={BRASS.hi} />
                <stop offset="0.55" stopColor={BRASS.mid} />
                <stop offset="1" stopColor={BRASS.deep} />
              </linearGradient>
            </defs>

            <circle className="ember-aura" cx="50" cy="50" r="50" fill={`url(#${auraId})`} />

            <g className="ember-runes">
              <circle cx="50" cy="50" r={RUNE_R} fill="none" stroke={BRASS.mid} strokeOpacity="0.35" strokeWidth="0.7" />
              {Array.from({ length: RUNE_SLOTS }, (_, k) => (
                <g key={k} transform={`rotate(${k * (360 / RUNE_SLOTS)} 50 50)`}>
                  <path d={runePath(k % 3)} fill={BRASS.mid} fillOpacity="0.95" />
                </g>
              ))}
            </g>
            <g className="ember-dashes">
              <circle
                cx="50"
                cy="50"
                r={DASH_R}
                fill="none"
                stroke={BRASS.mid}
                strokeOpacity="0.75"
                strokeWidth="1.1"
                strokeDasharray={`${DASH_PERIOD * 0.62} ${DASH_PERIOD * 0.38}`}
              />
            </g>

            {ring ? (
              <g className="ember-day">
                <circle cx="50" cy="50" r={DAY_R} fill="none" stroke="currentColor" strokeOpacity="0.12" strokeWidth="3.2" />
                <circle
                  className="ember-arc"
                  cx="50"
                  cy="50"
                  r={DAY_R}
                  fill="none"
                  stroke={PASSED}
                  strokeOpacity="0.65"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  strokeDasharray={`${DAY_LEN * sweepPassed} ${DAY_LEN}`}
                  transform="rotate(-90 50 50)"
                />
                <circle
                  className="ember-arc"
                  cx="50"
                  cy="50"
                  r={DAY_R}
                  fill="none"
                  stroke={colors.hi}
                  strokeWidth="3.6"
                  strokeLinecap="round"
                  strokeDasharray={`${Math.max(0, DAY_LEN * sweepLeft)} ${DAY_LEN}`}
                  strokeDashoffset={-DAY_LEN * sweepPassed}
                  transform="rotate(-90 50 50)"
                />
                <g className="ember-now" style={{ transform: `rotate(${nowAngle}deg)` }}>
                  <circle cx="50" cy={50 - DAY_R} r="3.3" fill="#FFFFFF" stroke={BRASS.mid} strokeWidth="1.2" />
                </g>
              </g>
            ) : null}

            <circle cx="50" cy="50" r="25" fill={`url(#${bodyId})`} />
            {[0, 60, 120, 180, 240, 300].map(angle => (
              <line
                key={angle}
                x1="50"
                y1="36"
                x2="50"
                y2="26"
                stroke="#FFFFFF"
                strokeOpacity="0.13"
                strokeWidth="0.9"
                transform={`rotate(${angle} 50 50)`}
              />
            ))}
            <path
              d="M50 36 L62.4 43 L62.4 57 L50 64 L37.6 57 L37.6 43 Z"
              fill="none"
              stroke="#FFFFFF"
              strokeOpacity="0.14"
              strokeWidth="0.9"
            />
            <ellipse cx="41" cy="40" rx="9.5" ry="6" fill="#FFFFFF" fillOpacity="0.38" />

            {happy ? (
              <>
                <circle cx="36.5" cy="56" r="3.6" fill="#FF8FA3" fillOpacity="0.4" />
                <circle cx="63.5" cy="56" r="3.6" fill="#FF8FA3" fillOpacity="0.4" />
              </>
            ) : null}

            <g className="ember-look">
              <g className="ember-eyes">
                {[35.4, 64.6].map((cx, i) => (
                  <g key={cx} className={face === 'wink' && i === 1 ? 'ember-eye ember-wink' : 'ember-eye'}>
                    <circle className="ember-halo" cx={cx} cy="43" r="7.6" fill={colors.hi} />
                    <ellipse cx={cx} cy="43" rx="5.4" ry="6.3" fill="#FFF8E7" />
                    <circle className="ember-pupil" cx={cx} cy="43" r="3.1" fill="#1A1208" />
                  </g>
                ))}
              </g>
              {face === 'wow' ? (
                <ellipse cx="50" cy="60.5" rx="2.7" ry="3.3" fill="#7C2D12" fillOpacity="0.7" stroke="#FFFFFF" strokeOpacity="0.85" strokeWidth="1.3" />
              ) : (
                <path
                  d={
                    face === 'happy' || face === 'wink'
                      ? 'M40 57.5 Q50 67 60 57.5'
                      : sleepy
                        ? 'M45.5 59.5 H54.5'
                        : 'M42.5 58.5 Q50 63 57.5 58.5'
                  }
                  fill="none"
                  stroke="#FFFFFF"
                  strokeOpacity="0.9"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              )}
            </g>

            <path
              className="ember-lid"
              d="M14.5 50 Q50 -6.8 85.5 50 Z"
              fill={`url(#${brassUpId})`}
              stroke={BRASS.hi}
              strokeWidth="1.3"
              strokeLinejoin="round"
              style={{ transform: `scaleY(${lidScale})`, transformOrigin: '50px 21.6px', opacity: lidOpacity }}
            />
            <path
              className="ember-lid"
              d="M14.5 50 Q50 106.8 85.5 50 Z"
              fill={`url(#${brassId})`}
              stroke={BRASS.hi}
              strokeWidth="1.3"
              strokeLinejoin="round"
              style={{ transform: `scaleY(${lidScale})`, transformOrigin: '50px 78.4px', opacity: lidOpacity }}
            />
            <path
              d="M14.5 50 Q50 -6.8 85.5 50 Q50 106.8 14.5 50 Z"
              fill="none"
              stroke={BRASS.mid}
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
            <circle cx="14.5" cy="50" r="1.8" fill={BRASS.mid} />
            <circle cx="85.5" cy="50" r="1.8" fill={BRASS.mid} />
          </svg>
        </div>
      </div>

      {burstKey > 0 ? (
        <div className="ember-burst" key={burstKey} aria-hidden="true">
          {Array.from({ length: BURST }, (_, i) => {
            const angle = (i / BURST) * Math.PI * 2 + (i % 2) * 0.2;
            const reach = size * 0.62;
            return (
              <i
                key={i}
                style={
                  {
                    '--dx': `${Math.cos(angle) * reach}px`,
                    '--dy': `${Math.sin(angle) * reach}px`,
                    background: i % 3 === 0 ? '#FFFFFF' : i % 3 === 1 ? BRASS.hi : colors.mid,
                  } as CSSProperties
                }
              />
            );
          })}
        </div>
      ) : null}
    </div>
  );
});

/** The ring only moves a hair a minute, so round to the minute: the panel and island tick every second, and this keeps Ember from being redrawn each time. */
export function minuteProgress(progress: number): number {
  return Math.round(Math.min(1, Math.max(0, progress)) * 1440) / 1440;
}

export function Ember(props: EmberProps) {
  return <EmberBody {...props} progress={minuteProgress(props.progress)} />;
}
