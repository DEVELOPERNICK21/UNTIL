'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LANDING_COPY } from '@/domain';

type Mood = 'dawn' | 'open' | 'mid' | 'late' | 'dusk';

const MOOD_COLOR: Record<
  Mood,
  { hi: string; mid: string; deep: string; glow: string }
> = {
  dawn: {
    hi: '#FDE68A',
    mid: '#F59E0B',
    deep: '#B45309',
    glow: 'rgba(253, 230, 138, 0.45)',
  },
  open: {
    hi: '#FDA4AF',
    mid: '#FB7185',
    deep: '#E11D48',
    glow: 'rgba(251, 113, 133, 0.4)',
  },
  mid: {
    hi: '#FDBA74',
    mid: '#E87C20',
    deep: '#C2410C',
    glow: 'rgba(232, 124, 32, 0.42)',
  },
  late: {
    hi: '#C4B5FD',
    mid: '#8B5CF6',
    deep: '#5B21B6',
    glow: 'rgba(139, 92, 246, 0.4)',
  },
  dusk: {
    hi: '#A5B4FC',
    mid: '#6366F1',
    deep: '#312E81',
    glow: 'rgba(99, 102, 241, 0.4)',
  },
};

function moodFromHour(h: number): Mood {
  if (h >= 5 && h < 8) return 'dawn';
  if (h >= 8 && h < 11) return 'open';
  if (h >= 11 && h < 15) return 'mid';
  if (h >= 15 && h < 19) return 'late';
  return 'dusk';
}

const SIZE = 56;
const LERP = 0.12;
const OFFSET = { x: 28, y: 28 };
const WHISPER_MS = 5000;
const CINEMATIC_SELECTOR = '.landing-cinematic-hero';

export function EmberCompanion() {
  const { ariaLabel, whispers } = LANDING_COPY.emberCompanion;
  const [active, setActive] = useState(false);
  const [whisper, setWhisper] = useState<string | null>(null);
  const [bounce, setBounce] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [coarsePointer, setCoarsePointer] = useState(false);
  const mood = useMemo(() => moodFromHour(new Date().getHours()), []);
  const colors = MOOD_COLOR[mood];

  const rootRef = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: 0, y: 0 });
  const target = useRef({ x: 0, y: 0 });
  const raf = useRef<number | null>(null);
  const visibleOk = useRef(true);
  const whisperTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const whisperIndex = useRef(0);

  const parkOnly = reduceMotion || coarsePointer;

  const clearWhisperTimer = useCallback(() => {
    if (whisperTimer.current) clearTimeout(whisperTimer.current);
    whisperTimer.current = null;
  }, []);

  const clearBounceTimer = useCallback(() => {
    if (bounceTimer.current) clearTimeout(bounceTimer.current);
    bounceTimer.current = null;
  }, []);

  useEffect(() => {
    const mqMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const mqPointer = window.matchMedia('(pointer: coarse)');
    const sync = () => {
      setReduceMotion(mqMotion.matches);
      setCoarsePointer(mqPointer.matches);
    };
    sync();
    mqMotion.addEventListener('change', sync);
    mqPointer.addEventListener('change', sync);
    return () => {
      mqMotion.removeEventListener('change', sync);
      mqPointer.removeEventListener('change', sync);
    };
  }, []);

  useEffect(() => {
    const el = document.querySelector(CINEMATIC_SELECTOR);
    if (!el) {
      setActive(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        setActive(!(entry.isIntersecting && entry.intersectionRatio > 0.15));
      },
      { threshold: [0, 0.15, 0.5, 1] },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    pos.current = {
      x: window.innerWidth - 96,
      y: window.innerHeight - 120,
    };
    target.current = { ...pos.current };
  }, []);

  const tick = useCallback(() => {
    if (!visibleOk.current || parkOnly) {
      raf.current = null;
      return;
    }
    const p = pos.current;
    const t = target.current;
    p.x += (t.x - p.x) * LERP;
    p.y += (t.y - p.y) * LERP;
    const node = rootRef.current;
    if (node) {
      node.style.transform = `translate3d(${p.x}px, ${p.y}px, 0)`;
    }
    raf.current = requestAnimationFrame(tick);
  }, [parkOnly]);

  useEffect(() => {
    if (!active || parkOnly) {
      if (raf.current != null) cancelAnimationFrame(raf.current);
      raf.current = null;
      if (parkOnly && rootRef.current) {
        rootRef.current.style.transform = '';
      }
      return;
    }
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current != null) cancelAnimationFrame(raf.current);
    };
  }, [active, parkOnly, tick]);

  useEffect(() => {
    if (!active || parkOnly) return;

    const onMove = (e: PointerEvent) => {
      target.current = {
        x: e.clientX + OFFSET.x,
        y: e.clientY + OFFSET.y,
      };
    };
    const onVis = () => {
      visibleOk.current = document.visibilityState === 'visible';
      if (visibleOk.current && raf.current == null && active && !parkOnly) {
        raf.current = requestAnimationFrame(tick);
      }
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [active, parkOnly, tick]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setWhisper(null);
        clearWhisperTimer();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [clearWhisperTimer]);

  useEffect(() => {
    return () => {
      clearWhisperTimer();
      clearBounceTimer();
    };
  }, [clearWhisperTimer, clearBounceTimer]);

  const onActivate = () => {
    if (whisper) {
      setWhisper(null);
      clearWhisperTimer();
      return;
    }
    const line = whispers[whisperIndex.current % whispers.length];
    whisperIndex.current += 1;
    setWhisper(line);
    setBounce(true);
    clearBounceTimer();
    bounceTimer.current = setTimeout(() => setBounce(false), 420);
    clearWhisperTimer();
    whisperTimer.current = setTimeout(() => setWhisper(null), WHISPER_MS);
  };

  const parkedClass = parkOnly ? ' ember-companion--parked' : '';
  const hiddenClass = !active ? ' ember-companion--hidden' : '';

  return (
    <div
      className={`ember-companion${parkedClass}${hiddenClass}${
        bounce && !parkOnly ? ' ember-companion--bounce' : ''
      }`}
      ref={rootRef}
      aria-hidden={!active}
      style={
        parkOnly
          ? undefined
          : {
              transform: `translate3d(${pos.current.x}px, ${pos.current.y}px, 0)`,
            }
      }
    >
      {whisper ? (
        <div className="ember-companion-whisper" role="status" aria-live="polite">
          {whisper}
        </div>
      ) : null}
      <button
        type="button"
        className="ember-companion-btn"
        aria-label={ariaLabel}
        onClick={onActivate}
        disabled={!active}
        tabIndex={active ? 0 : -1}
      >
        <svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          aria-hidden
        >
          <defs>
            <radialGradient id="ember-web-fill" cx="35%" cy="30%" r="70%">
              <stop offset="0%" stopColor={colors.hi} />
              <stop offset="55%" stopColor={colors.mid} />
              <stop offset="100%" stopColor={colors.deep} />
            </radialGradient>
          </defs>
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={SIZE / 2 - 2}
            fill={colors.glow}
            opacity={0.55}
          />
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={SIZE / 2 - 6}
            fill="url(#ember-web-fill)"
          />
          <circle cx={SIZE * 0.36} cy={SIZE * 0.4} r={3.2} fill="#1a1020" />
          <circle cx={SIZE * 0.64} cy={SIZE * 0.4} r={3.2} fill="#1a1020" />
          <path
            d={`M ${SIZE * 0.38} ${SIZE * 0.58} Q ${SIZE * 0.5} ${SIZE * 0.7} ${SIZE * 0.62} ${SIZE * 0.58}`}
            fill="none"
            stroke="#1a1020"
            strokeWidth={2.2}
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  );
}
