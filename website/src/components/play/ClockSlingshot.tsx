'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ROUTES, SITE_CONFIG } from '@/domain';
import { CLOCK_HOOK_OFFSET, clockFaceRadius, drawWallClock } from './clockArt';

type Vec = { x: number; y: number };
type Phase = 'idle' | 'playing' | 'over';
type FloaterKind = 'hourglass' | 'calendar' | 'phone';

type Crack = { angle: number; dist: number; points: Vec[] };

type Floater = {
  kind: FloaterKind;
  x: number;
  y: number;
  vx: number;
  baseY: number;
  t: number;
  age: number;
};

type Particle = {
  kind: 'spark' | 'shard' | 'text' | 'ring';
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  color: string;
  size: number;
  rot: number;
  vr: number;
  text?: string;
};

type Game = {
  w: number;
  h: number;
  nail: Vec;
  stringLen: number;
  radius: number;
  anchor: Vec;
  swing: number;
  swingV: number;
  spin: number;
  spinV: number;
  pebble: Vec;
  pebbleV: Vec;
  pebbleState: 'rest' | 'drag' | 'flying';
  hitCooldown: number;
  cracks: Crack[];
  clockDownUntil: number;
  time: number;
  phase: Phase;
  timeLeft: number;
  score: number;
  combo: number;
  bestCombo: number;
  hits: number;
  shots: number;
  clocksBroken: number;
  shotHit: boolean;
  level: number;
  floaters: Floater[];
  nextSpawn: number;
  particles: Particle[];
  shake: number;
  badges: Set<string>;
  hudAcc: number;
  ceiling: number;
  punch: number;
  flash: number;
  fever: number;
  slowmo: number;
  countdown: number;
  trail: Vec[];
  bandWobble: number;
  closest: number;
};

type Hud = {
  score: number;
  combo: number;
  timeLeft: number;
  level: number;
  fever: boolean;
};

type Result = {
  score: number;
  best: number;
  newBest: boolean;
  hits: number;
  shots: number;
  bestCombo: number;
  clocksBroken: number;
  badges: number;
};

const ROUND_SECONDS = 60;
const GRAVITY = 900;
const PEBBLE_R = 7;
const FLOATER_R = 22;
const MAX_PULL = 120;
const LAUNCH_POWER = 12;
const CRACK_SPEED = 650;
const CRACKS_TO_SHATTER = 6;
const MAX_LEVEL = 6;
const TAU = Math.PI * 2;
const BEST_KEY = 'until-play-best';
const PENDULUM_G = 2500;
const FEVER_SECONDS = 6;
const COUNTDOWN_SECONDS = 2.4;
const COUNTDOWN_LABELS = ['3', '2', '1', 'Go'];
const TRAIL_LENGTH = 14;

const FLOATER_STYLE: Record<FloaterKind, { ring: string; label: string; labelColor: string }> = {
  hourglass: { ring: 'rgba(34,197,94,', label: '+5s', labelColor: '#4ade80' },
  calendar: { ring: 'rgba(232,124,32,', label: 'bonus', labelColor: '#f5a25a' },
  phone: { ring: 'rgba(239,68,68,', label: '-5s', labelColor: '#f87171' },
};

const FLOATER_EMOJI: Record<FloaterKind, string> = {
  hourglass: '⌛',
  calendar: '📅',
  phone: '📱',
};

const BADGES: Record<string, string> = {
  first_hit: 'First hit',
  first_crack: 'Cracked the glass',
  combo3: 'Combo x3',
  combo5: 'Combo x5. Max.',
  shatter: 'Shattered a clock',
  hourglass: 'Stole 5 seconds back',
  phone: 'Hit a phone. Lost 5 seconds.',
  level4: 'Reached level 4',
  bullseye: 'Bullseye',
  fever: 'Fever mode',
};

const LEVEL_NOTES: Record<number, string> = {
  2: 'The clock starts moving.',
  3: 'More phones.',
  4: 'Faster everything.',
  5: 'The clock is annoyed.',
  6: 'Max level.',
};

const CAPTIONS = [
  "You can't knock time back.",
  'Time did not notice.',
  'Still {time}.',
  '{pct}% of today left. Still.',
  'Nice shot. Same time.',
];

function dayLeftPct(now: Date): number {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const elapsed = now.getTime() - start.getTime();
  return Math.max(0, Math.min(100, Math.round(100 - (elapsed / 86_400_000) * 100)));
}

function formatTime(now: Date): string {
  return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatClock(seconds: number): string {
  const s = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function clockCenter(g: Game): Vec {
  const len = g.stringLen + g.radius;
  return {
    x: g.nail.x + Math.sin(g.swing) * len,
    y: g.nail.y + Math.cos(g.swing) * len,
  };
}

function swingLimit(g: Game): number {
  const room = g.w / 2 - g.radius - 12;
  return Math.asin(Math.max(0.05, Math.min(0.9, room / (g.stringLen + g.radius))));
}

function drawSlingshot(
  ctx: CanvasRenderingContext2D,
  a: Vec,
  pouch: Vec,
  stretch: number,
  drawPebble: () => void,
) {
  const prongL = { x: a.x - 30, y: a.y - 38 };
  const prongR = { x: a.x + 30, y: a.y - 38 };
  const fork = { x: a.x, y: a.y + 10 };
  const bottom = { x: a.x, y: a.y + 80 };

  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(a.x, bottom.y + 6, 34, 6, 0, 0, TAU);
  ctx.fill();

  const bandWidth = 5.5 - 3 * Math.min(1, stretch);
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#5a1a12';
  ctx.lineWidth = bandWidth;
  ctx.beginPath();
  ctx.moveTo(prongL.x, prongL.y);
  ctx.lineTo(pouch.x, pouch.y);
  ctx.stroke();

  const path = () => {
    ctx.beginPath();
    ctx.moveTo(bottom.x, bottom.y);
    ctx.lineTo(fork.x, fork.y);
    ctx.quadraticCurveTo(a.x - 6, a.y - 6, prongL.x, prongL.y);
    ctx.moveTo(fork.x, fork.y);
    ctx.quadraticCurveTo(a.x + 6, a.y - 6, prongR.x, prongR.y);
  };
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#2b1a0d';
  ctx.lineWidth = 15;
  path();
  ctx.stroke();
  const wood = ctx.createLinearGradient(a.x - 30, 0, a.x + 30, 0);
  wood.addColorStop(0, '#6e4522');
  wood.addColorStop(0.5, '#a8743f');
  wood.addColorStop(1, '#6e4522');
  ctx.strokeStyle = wood;
  ctx.lineWidth = 11;
  path();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,230,190,0.25)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(a.x - 2, bottom.y - 4);
  ctx.lineTo(a.x - 2, fork.y + 4);
  ctx.stroke();

  ctx.strokeStyle = '#3b2414';
  ctx.lineWidth = 3;
  for (let y = a.y + 36; y < a.y + 70; y += 6) {
    ctx.beginPath();
    ctx.moveTo(a.x - 7, y + 3);
    ctx.lineTo(a.x + 7, y - 2);
    ctx.stroke();
  }
  for (const tip of [prongL, prongR]) {
    ctx.fillStyle = '#3b2414';
    ctx.beginPath();
    ctx.arc(tip.x, tip.y, 6.5, 0, TAU);
    ctx.fill();
  }

  const angle = Math.atan2(pouch.y - a.y + 38, pouch.x - a.x);
  ctx.save();
  ctx.translate(pouch.x, pouch.y);
  ctx.rotate(angle);
  ctx.fillStyle = '#4a2c17';
  ctx.beginPath();
  ctx.ellipse(0, 0, 9, 13, 0, 0, TAU);
  ctx.fill();
  ctx.restore();

  drawPebble();

  ctx.strokeStyle = '#7a2417';
  ctx.lineWidth = bandWidth;
  ctx.beginPath();
  ctx.moveTo(prongR.x, prongR.y);
  ctx.lineTo(pouch.x, pouch.y);
  ctx.stroke();
}

function drawPebble(ctx: CanvasRenderingContext2D, p: Vec, glow: string | null) {
  ctx.save();
  if (glow) {
    ctx.shadowColor = glow;
    ctx.shadowBlur = 18;
  }
  const stone = ctx.createRadialGradient(p.x - 2.5, p.y - 2.5, 1, p.x, p.y, PEBBLE_R);
  stone.addColorStop(0, '#d9d6d0');
  stone.addColorStop(0.6, '#8d8a85');
  stone.addColorStop(1, '#4d4b48');
  ctx.fillStyle = stone;
  ctx.beginPath();
  ctx.arc(p.x, p.y, PEBBLE_R, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function makeCrack(angle: number, dist: number): Crack {
  const points: Vec[] = [];
  const branches = 3 + Math.floor(Math.random() * 3);
  for (let b = 0; b < branches; b++) {
    const dir = Math.random() * TAU;
    let x = 0;
    let y = 0;
    points.push({ x: NaN, y: NaN });
    const segs = 3 + Math.floor(Math.random() * 3);
    for (let s = 0; s < segs; s++) {
      x += Math.cos(dir + (Math.random() - 0.5) * 0.9) * (6 + Math.random() * 9);
      y += Math.sin(dir + (Math.random() - 0.5) * 0.9) * (6 + Math.random() * 9);
      points.push({ x, y });
    }
  }
  return { angle, dist, points };
}

function readBest(): number {
  try {
    return Number(window.localStorage.getItem(BEST_KEY)) || 0;
  } catch {
    return 0;
  }
}

function writeBest(score: number) {
  try {
    window.localStorage.setItem(BEST_KEY, String(score));
  } catch {
    // Private mode or storage disabled: best score just isn't kept.
  }
}

/** Tiny synthesized sound effects. No audio files, nothing loaded from the network. */
function createSound() {
  let ctx: AudioContext | null = null;
  const audio = () => {
    if (!ctx) {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!Ctor) return null;
      ctx = new Ctor();
    }
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  };
  const tone = (
    freq: number,
    dur: number,
    type: OscillatorType,
    gain: number,
    slideTo?: number
  ) => {
    const a = audio();
    if (!a) return;
    const osc = a.createOscillator();
    const g = a.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, a.currentTime);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, a.currentTime + dur);
    g.gain.setValueAtTime(gain, a.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + dur);
    osc.connect(g).connect(a.destination);
    osc.start();
    osc.stop(a.currentTime + dur);
  };
  const noise = (dur: number, gain: number) => {
    const a = audio();
    if (!a) return;
    const buf = a.createBuffer(1, Math.floor(a.sampleRate * dur), a.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    }
    const src = a.createBufferSource();
    const g = a.createGain();
    g.gain.value = gain;
    src.buffer = buf;
    src.connect(g).connect(a.destination);
    src.start();
  };
  return {
    unlock: () => void audio(),
    launch: () => tone(220, 0.12, 'triangle', 0.08, 520),
    hit: () => tone(880, 0.08, 'square', 0.05),
    crack: () => {
      tone(1400, 0.05, 'square', 0.04);
      noise(0.08, 0.06);
    },
    shatter: () => {
      noise(0.45, 0.18);
      tone(1800, 0.3, 'sawtooth', 0.03, 300);
    },
    bonus: () => {
      tone(660, 0.08, 'sine', 0.08);
      setTimeout(() => tone(990, 0.12, 'sine', 0.08), 70);
    },
    bad: () => tone(300, 0.25, 'sawtooth', 0.06, 110),
    level: () => {
      tone(523, 0.1, 'triangle', 0.07);
      setTimeout(() => tone(659, 0.1, 'triangle', 0.07), 90);
      setTimeout(() => tone(784, 0.16, 'triangle', 0.07), 180);
    },
    end: () => tone(440, 0.6, 'sine', 0.08, 110),
  };
}

export function ClockSlingshot() {
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Game | null>(null);
  const reducedMotionRef = useRef(false);
  const soundRef = useRef<ReturnType<typeof createSound> | null>(null);
  const soundOnRef = useRef(false);

  const [now, setNow] = useState<Date | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [hud, setHud] = useState<Hud>({
    score: 0,
    combo: 0,
    timeLeft: ROUND_SECONDS,
    level: 1,
    fever: false,
  });
  const [best, setBest] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const [toasts, setToasts] = useState<{ id: number; text: string; sub?: string }[]>([]);
  const [caption, setCaption] = useState<string | null>(null);
  const [soundOn, setSoundOn] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [canFullscreen, setCanFullscreen] = useState(false);
  const [shareNote, setShareNote] = useState<string | null>(null);

  const toastId = useRef(0);
  const captionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const captionIndex = useRef(0);

  useEffect(() => {
    setNow(new Date());
    setBest(readBest());
    setCanFullscreen(Boolean(document.fullscreenEnabled));
    const id = setInterval(() => setNow(new Date()), 1000);
    const onFs = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFs);
    return () => {
      clearInterval(id);
      document.removeEventListener('fullscreenchange', onFs);
    };
  }, []);

  const play = useCallback((name: keyof ReturnType<typeof createSound>) => {
    if (!soundOnRef.current) return;
    soundRef.current?.[name]();
  }, []);

  const toast = useCallback((text: string, sub?: string) => {
    const id = ++toastId.current;
    setToasts(t => [...t.slice(-2), { id, text, sub }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 2200);
  }, []);

  const award = useCallback(
    (g: Game, id: string) => {
      if (g.badges.has(id)) return;
      g.badges.add(id);
      toast(BADGES[id] ?? id, 'Badge');
    },
    [toast]
  );

  const showCaption = useCallback(() => {
    const d = new Date();
    const text = CAPTIONS[captionIndex.current % CAPTIONS.length]
      .replace('{time}', formatTime(d))
      .replace('{pct}', String(dayLeftPct(d)));
    captionIndex.current += 1;
    setCaption(text);
    if (captionTimer.current) clearTimeout(captionTimer.current);
    captionTimer.current = setTimeout(() => setCaption(null), 2200);
  }, []);

  const layout = useCallback(() => {
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!stage || !canvas) return;
    const w = stage.clientWidth;
    const h = stage.clientHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    canvas.getContext('2d')?.setTransform(dpr, 0, 0, dpr, 0, 0);

    const radius = Math.max(52, Math.min(w * 0.13, h * 0.12, 110));
    const anchor = { x: w / 2, y: h - Math.max(150, h * 0.2) };
    const prev = gameRef.current;
    const base: Game = prev ?? {
      w,
      h,
      nail: { x: 0, y: 0 },
      stringLen: 0,
      radius,
      anchor,
      swing: 0,
      swingV: 0,
      spin: 0,
      spinV: 0,
      pebble: { ...anchor },
      pebbleV: { x: 0, y: 0 },
      pebbleState: 'rest',
      hitCooldown: 0,
      cracks: [],
      clockDownUntil: 0,
      time: 0,
      phase: 'idle',
      timeLeft: ROUND_SECONDS,
      score: 0,
      combo: 0,
      bestCombo: 0,
      hits: 0,
      shots: 0,
      clocksBroken: 0,
      shotHit: false,
      level: 1,
      floaters: [],
      nextSpawn: 0,
      particles: [],
      shake: 0,
      badges: new Set(),
      hudAcc: 0,
      ceiling: 0,
      punch: 0,
      flash: 0,
      fever: 0,
      slowmo: 0,
      countdown: 0,
      trail: [],
      bandWobble: 0,
      closest: Infinity,
    };
    base.w = w;
    base.h = h;
    base.radius = radius;
    base.ceiling = Math.max(90, h * 0.12);
    const centerY = base.ceiling + Math.min(80, h * 0.08) + radius;
    // Pivot sits above the screen so the string's start point is never visible.
    base.nail = { x: w / 2, y: -40 };
    base.stringLen = centerY - base.nail.y - radius;
    base.anchor = anchor;
    if (base.pebbleState !== 'flying') {
      base.pebble = { ...anchor };
      base.pebbleState = 'rest';
    }
    gameRef.current = base;
  }, []);

  const startGame = useCallback(() => {
    const g = gameRef.current;
    if (!g) return;
    soundRef.current ??= createSound();
    if (soundOnRef.current) soundRef.current.unlock();
    Object.assign(g, {
      phase: 'playing' as Phase,
      timeLeft: ROUND_SECONDS,
      score: 0,
      combo: 0,
      bestCombo: 0,
      hits: 0,
      shots: 0,
      clocksBroken: 0,
      shotHit: false,
      level: 1,
      floaters: [],
      particles: [],
      cracks: [],
      clockDownUntil: 0,
      nextSpawn: g.time + 1.2,
      badges: new Set<string>(),
      swing: 0,
      swingV: 0,
      spin: 0,
      spinV: 0,
      pebbleState: 'rest' as const,
      pebble: { ...g.anchor },
      pebbleV: { x: 0, y: 0 },
      punch: 0,
      flash: 0,
      fever: 0,
      slowmo: 0,
      countdown: COUNTDOWN_SECONDS,
      trail: [],
      bandWobble: 0,
    });
    setHud({ score: 0, combo: 0, timeLeft: ROUND_SECONDS, level: 1, fever: false });
    setResult(null);
    setShareNote(null);
    setPhase('playing');
    canvasRef.current?.focus();
  }, []);

  const endGame = useCallback(
    (g: Game) => {
      g.phase = 'over';
      const prevBest = readBest();
      const newBest = g.score > prevBest;
      if (newBest) writeBest(g.score);
      const bestNow = Math.max(prevBest, g.score);
      setBest(bestNow);
      setResult({
        score: g.score,
        best: bestNow,
        newBest,
        hits: g.hits,
        shots: g.shots,
        bestCombo: g.bestCombo,
        clocksBroken: g.clocksBroken,
        badges: g.badges.size,
      });
      setPhase('over');
      play('end');
    },
    [play]
  );

  const launch = useCallback(
    (v: Vec) => {
      const g = gameRef.current;
      if (!g) return;
      g.pebbleV = v;
      g.pebbleState = 'flying';
      g.shotHit = false;
      g.shots += 1;
      g.bandWobble = 1;
      g.closest = Infinity;
      g.trail = [];
      play('launch');
    },
    [play]
  );

  const autoShot = useCallback(() => {
    const g = gameRef.current;
    if (!g || g.pebbleState !== 'rest' || g.phase !== 'playing' || g.countdown > 0) return;
    const target = clockCenter(g);
    const dx = target.x - g.anchor.x + (Math.random() - 0.5) * g.radius;
    const dy = target.y - g.anchor.y;
    const speed = 1250;
    const dist = Math.hypot(dx, dy);
    const t = dist / speed;
    launch({ x: (dx / dist) * speed, y: (dy / dist) * speed - 0.5 * GRAVITY * t });
  }, [launch]);

  useEffect(() => {
    reducedMotionRef.current = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    layout();
    const ro = new ResizeObserver(layout);
    if (stageRef.current) ro.observe(stageRef.current);

    const css = getComputedStyle(document.documentElement);
    const color = (name: string, fallback: string) =>
      css.getPropertyValue(name).trim() || fallback;
    const C = {
      text: color('--text', '#ededed'),
      muted: color('--text-secondary', '#9a9a9a'),
      divider: color('--divider', '#2a2a2a'),
      face: color('--card-lighter', '#1a1a1a'),
      accent: color('--accent', '#e87c20'),
      green: color('--green', '#22c55e'),
      red: color('--red', '#ef4444'),
    };

    const addText = (g: Game, x: number, y: number, text: string, col: string, size = 20) => {
      g.particles.push({
        kind: 'text', x, y, vx: 0, vy: -70, life: 1, max: 1, color: col,
        size, rot: 0, vr: 0, text,
      });
    };

    const ring = (g: Game, x: number, y: number, col: string, size: number) => {
      g.particles.push({
        kind: 'ring', x, y, vx: 0, vy: 0, life: 0.45, max: 0.45, color: col,
        size, rot: 0, vr: 0,
      });
    };

    const burst = (g: Game, x: number, y: number, n: number, col: string, kind: 'spark' | 'shard') => {
      if (reducedMotionRef.current) n = Math.ceil(n / 4);
      for (let i = 0; i < n; i++) {
        const a = Math.random() * TAU;
        const s = (kind === 'shard' ? 150 : 90) + Math.random() * (kind === 'shard' ? 380 : 260);
        const life = 0.5 + Math.random() * (kind === 'shard' ? 0.9 : 0.4);
        g.particles.push({
          kind, x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 80, life, max: life,
          color: col, size: kind === 'shard' ? 4 + Math.random() * 7 : 2 + Math.random() * 2,
          rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 12,
        });
      }
    };

    const registerHit = (g: Game) => {
      g.combo += 1;
      g.shotHit = true;
      g.bestCombo = Math.max(g.bestCombo, g.combo);
      if (g.combo >= 3) award(g, 'combo3');
      if (g.combo >= 5) award(g, 'combo5');
      if (g.combo % 5 === 0 && g.fever <= 0) {
        g.fever = FEVER_SECONDS;
        toast('Fever', `Double points for ${FEVER_SECONDS} seconds`);
        award(g, 'fever');
        play('level');
      }
      return Math.min(5, g.combo) * (g.fever > 0 ? 2 : 1);
    };

    const spawnFloater = (g: Game) => {
      const r = Math.random();
      const phoneChance = Math.min(0.55, 0.28 + 0.06 * (g.level - 1));
      const kind: FloaterKind =
        r < phoneChance ? 'phone' : r < phoneChance + 0.22 ? 'hourglass' : 'calendar';
      const fromLeft = Math.random() < 0.5;
      const top = g.ceiling + 20;
      const bottom = Math.max(top + 40, g.anchor.y - 170);
      const y = top + Math.random() * (bottom - top);
      const speed = (90 + Math.random() * 80) * (1 + 0.14 * (g.level - 1));
      g.floaters.push({
        kind,
        x: fromLeft ? -FLOATER_R : g.w + FLOATER_R,
        y,
        baseY: y,
        vx: fromLeft ? speed : -speed,
        t: Math.random() * TAU,
        age: 0,
      });
    };

    const shatter = (g: Game, mult: number) => {
      const c = clockCenter(g);
      burst(g, c.x, c.y, 46, C.text, 'shard');
      burst(g, c.x, c.y, 20, C.accent, 'spark');
      const pts = 500 * mult;
      g.score += pts;
      addText(g, c.x, c.y - 20, `SHATTERED +${pts}`, C.accent, 28);
      ring(g, c.x, c.y, C.accent, g.radius * 2.2);
      g.cracks = [];
      g.clocksBroken += 1;
      g.clockDownUntil = g.time + 1.1;
      g.shake = Math.max(g.shake, 16);
      if (!reducedMotionRef.current) g.slowmo = 0.6;
      award(g, 'shatter');
      play('shatter');
    };

    let raf = 0;
    let last = performance.now();

    const step = (dt: number) => {
      const g = gameRef.current;
      if (!g) return;
      const reduced = reducedMotionRef.current;
      g.time += dt;
      const clockUp = g.time >= g.clockDownUntil;
      if (!clockUp && g.clockDownUntil - g.time < 0.02) {
        g.swing = reduced ? 0 : 0.5;
        g.swingV = 0;
      }

      const omega2 = Math.max(4, Math.min(22, PENDULUM_G / (g.stringLen + g.radius)));
      const drive =
        g.phase === 'playing' && g.level >= 2 ? (3 * Math.min(4, g.level - 1) * omega2) / 22 : 0;
      g.swingV +=
        (-omega2 * Math.sin(g.swing) - 1.5 * g.swingV + drive * Math.cos(g.time * 1.3)) * dt;
      g.swing += g.swingV * dt;
      const limit = swingLimit(g);
      if (Math.abs(g.swing) > limit) {
        g.swing = Math.sign(g.swing) * limit;
        g.swingV *= -0.35;
      }

      if (Math.abs(g.spinV) > 2.5) {
        g.spinV *= Math.exp(-1.1 * dt);
      } else {
        const target = Math.round(g.spin / TAU) * TAU;
        g.spinV += (-(g.spin - target) * 14 - g.spinV * 5) * dt;
      }
      g.spin += g.spinV * dt;
      if (reduced) {
        g.swing = 0;
        g.swingV = 0;
        g.spin = 0;
        g.spinV = 0;
      }

      g.hitCooldown = Math.max(0, g.hitCooldown - dt);
      g.shake = Math.max(0, g.shake - 40 * dt);
      g.punch *= Math.exp(-10 * dt);
      g.flash = Math.max(0, g.flash - dt * 3);
      g.bandWobble *= Math.exp(-7 * dt);
      if (g.fever > 0) {
        g.fever -= dt;
        if (g.fever <= 0) g.fever = 0;
      }

      if (g.phase === 'playing' && g.countdown > 0) {
        const before = Math.floor((COUNTDOWN_SECONDS - g.countdown) / 0.6);
        g.countdown = Math.max(0, g.countdown - dt);
        const after = Math.floor((COUNTDOWN_SECONDS - g.countdown) / 0.6);
        if (after !== before) play(after >= 3 ? 'launch' : 'hit');
      } else if (g.phase === 'playing') {
        g.timeLeft -= dt;
        if (g.time >= g.nextSpawn) {
          spawnFloater(g);
          g.nextSpawn = g.time + Math.max(0.9, 2.6 - 0.25 * (g.level - 1)) * (0.6 + Math.random() * 0.8);
        }
        if (g.timeLeft <= 0) {
          g.timeLeft = 0;
          endGame(g);
        }
      }

      for (const f of g.floaters) {
        f.t += dt;
        f.age += dt;
        f.x += f.vx * dt;
        f.y = f.baseY + Math.sin(f.t * 2.2) * 14;
      }
      g.floaters = g.floaters.filter(f => f.x > -60 && f.x < g.w + 60);

      if (g.pebbleState === 'flying') {
        g.pebbleV.y += GRAVITY * dt;
        g.pebble.x += g.pebbleV.x * dt;
        g.pebble.y += g.pebbleV.y * dt;
        g.trail.push({ ...g.pebble });
        if (g.trail.length > TRAIL_LENGTH) g.trail.shift();
        const scoring = g.phase === 'playing';

        for (let i = g.floaters.length - 1; i >= 0; i--) {
          const f = g.floaters[i];
          if (Math.hypot(g.pebble.x - f.x, g.pebble.y - f.y) > FLOATER_R + PEBBLE_R) continue;
          g.floaters.splice(i, 1);
          ring(g, f.x, f.y, f.kind === 'phone' ? C.red : f.kind === 'hourglass' ? C.green : C.accent, FLOATER_R * 2.4);
          if (!scoring) continue;
          if (f.kind === 'phone') {
            g.timeLeft = Math.max(0, g.timeLeft - 5);
            g.combo = 0;
            g.shake = Math.max(g.shake, 10);
            burst(g, f.x, f.y, 14, C.red, 'spark');
            addText(g, f.x, f.y, '-5s', C.red);
            award(g, 'phone');
            play('bad');
          } else {
            const mult = registerHit(g);
            const base = f.kind === 'hourglass' ? 200 : 150;
            g.score += base * mult;
            burst(g, f.x, f.y, 16, f.kind === 'hourglass' ? C.green : C.accent, 'spark');
            if (f.kind === 'hourglass') {
              g.timeLeft += 5;
              addText(g, f.x, f.y, `+5s  +${base * mult}`, C.green);
              award(g, 'hourglass');
            } else {
              addText(g, f.x, f.y, `+${base * mult}`, C.accent);
            }
            play('bonus');
          }
        }

        const c = clockCenter(g);
        const dx = g.pebble.x - c.x;
        const dy = g.pebble.y - c.y;
        const dist = Math.hypot(dx, dy);
        if (clockUp && !g.shotHit) g.closest = Math.min(g.closest, dist - g.radius - PEBBLE_R);
        if (clockUp && dist < g.radius + PEBBLE_R && g.hitCooldown === 0) {
          const nx = dx / dist;
          const ny = dy / dist;
          const vx = g.pebbleV.x;
          const vy = g.pebbleV.y;
          const speed = Math.hypot(vx, vy);

          const armX = c.x - g.nail.x;
          const armY = c.y - g.nail.y;
          const arm = g.stringLen + g.radius;
          g.swingV += ((armX * vy - armY * vx) / (arm * arm)) * -0.35;
          g.swingV = Math.max(-6, Math.min(6, g.swingV));
          g.spinV += (Math.sign(dx * vy - dy * vx) || 1) * (4 + speed / 120);

          const dot = vx * nx + vy * ny;
          g.pebbleV.x = (vx - 2 * dot * nx) * 0.55;
          g.pebbleV.y = (vy - 2 * dot * ny) * 0.55;
          g.pebble.x = c.x + nx * (g.radius + PEBBLE_R + 1);
          g.pebble.y = c.y + ny * (g.radius + PEBBLE_R + 1);
          g.hitCooldown = 0.25;
          g.shake = Math.max(g.shake, 5 + speed / 200);
          g.punch = 0.07;
          g.flash = 0.45;
          burst(g, g.pebble.x, g.pebble.y, 12, C.accent, 'spark');
          ring(g, g.pebble.x, g.pebble.y, '#ffffff', 40);

          if (scoring) {
            const mult = registerHit(g);
            g.hits += 1;
            award(g, 'first_hit');
            let pts = 100 * mult;
            const hard = speed > CRACK_SPEED;
            if (hard) {
              pts += 50 * mult;
              const local = Math.atan2(dy, dx) + g.swing;
              g.cracks.push(makeCrack(local, clockFaceRadius(g.radius) * 0.8));
              award(g, 'first_crack');
            }
            // Distance from the clock center to the pebble's line of travel.
            const aim = speed > 0 ? Math.abs(dx * vy - dy * vx) / speed : g.radius;
            const bullseye = aim < g.radius * 0.3;
            if (bullseye) {
              pts += 100 * mult;
              g.flash = 0.9;
              addText(g, c.x, c.y - g.radius - 24, 'BULLSEYE', '#ffffff', 24);
              award(g, 'bullseye');
            }
            g.score += pts;
            addText(
              g,
              g.pebble.x,
              g.pebble.y - 10,
              mult > 1 ? `+${pts}  x${mult}` : `+${pts}`,
              g.fever > 0 ? '#ffd166' : hard ? C.text : C.accent
            );
            if (g.cracks.length >= CRACKS_TO_SHATTER) {
              shatter(g, mult);
            } else {
              play(hard ? 'crack' : 'hit');
            }
            const newLevel = Math.min(MAX_LEVEL, 1 + Math.floor(g.hits / 6));
            if (newLevel > g.level) {
              g.level = newLevel;
              toast(`Level ${newLevel}`, LEVEL_NOTES[newLevel]);
              if (newLevel >= 4) award(g, 'level4');
              play('level');
            }
            if (g.hits % 3 === 1) showCaption();
          } else {
            play('hit');
          }
        }

        const out =
          g.pebble.y > g.h + 40 || g.pebble.x < -40 || g.pebble.x > g.w + 40 || g.pebble.y < -60;
        if (out) {
          if (g.phase === 'playing' && !g.shotHit && g.closest < 28) {
            const c2 = clockCenter(g);
            addText(g, c2.x, c2.y + g.radius + 26, 'Close!', C.muted, 18);
          }
          if (g.phase === 'playing' && !g.shotHit && g.combo > 0) {
            g.combo = 0;
            addText(g, g.anchor.x, g.anchor.y - 60, 'combo lost', C.muted);
          }
          g.pebbleState = 'rest';
          g.pebble = { ...g.anchor };
          g.pebbleV = { x: 0, y: 0 };
        }
      }

      for (const p of g.particles) {
        p.life -= dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rot += p.vr * dt;
        if (p.kind === 'spark' || p.kind === 'shard') p.vy += GRAVITY * 0.6 * dt;
      }
      g.particles = g.particles.filter(p => p.life > 0);
      if (g.pebbleState !== 'flying' && g.trail.length) g.trail.shift();

      g.hudAcc += dt;
      if (g.hudAcc > 0.1) {
        g.hudAcc = 0;
        setHud({
          score: g.score,
          combo: g.combo,
          timeLeft: g.timeLeft,
          level: g.level,
          fever: g.fever > 0,
        });
      }
    };

    const draw = () => {
      const g = gameRef.current;
      const ctx = canvasRef.current?.getContext('2d');
      if (!g || !ctx) return;
      const reduced = reducedMotionRef.current;
      ctx.clearRect(0, 0, g.w, g.h);

      const clockUp = g.time >= g.clockDownUntil;
      const c = clockCenter(g);
      const a = g.anchor;

      const spot = ctx.createRadialGradient(c.x, c.y, g.radius * 0.5, c.x, c.y, g.radius * 4);
      spot.addColorStop(0, 'rgba(255,236,210,0.07)');
      spot.addColorStop(1, 'rgba(255,236,210,0)');
      ctx.fillStyle = spot;
      ctx.fillRect(0, 0, g.w, g.h);
      const floorTop = a.y + 70;
      const floor = ctx.createLinearGradient(0, floorTop, 0, g.h);
      floor.addColorStop(0, 'rgba(255,255,255,0.035)');
      floor.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = floor;
      ctx.fillRect(0, floorTop, g.w, g.h - floorTop);
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, floorTop + 20);
      ctx.lineTo(g.w, floorTop + 20);
      ctx.stroke();

      if (g.fever > 0) {
        const pulse = 0.5 + 0.5 * Math.sin(g.time * 8);
        const edge = ctx.createRadialGradient(
          g.w / 2, g.h / 2, Math.min(g.w, g.h) * 0.35,
          g.w / 2, g.h / 2, Math.max(g.w, g.h) * 0.75,
        );
        edge.addColorStop(0, 'rgba(232,124,32,0)');
        edge.addColorStop(1, `rgba(232,124,32,${0.12 + 0.1 * pulse})`);
        ctx.fillStyle = edge;
        ctx.fillRect(0, 0, g.w, g.h);
      }

      ctx.save();
      if (g.shake > 0 && !reduced) {
        ctx.translate((Math.random() - 0.5) * g.shake, (Math.random() - 0.5) * g.shake);
      }

      if (clockUp) {
        const tilt = -g.swing;
        const scale = 1 + g.punch;
        const hook = (g.radius + CLOCK_HOOK_OFFSET) * scale;
        ctx.strokeStyle = 'rgba(210,210,210,0.6)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(g.nail.x, g.nail.y);
        ctx.lineTo(c.x + Math.sin(tilt) * hook, c.y - Math.cos(tilt) * hook);
        ctx.stroke();

        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.rotate(tilt);
        ctx.scale(scale, scale);
        drawWallClock(ctx, {
          radius: g.radius,
          spin: g.spin,
          spinV: g.spinV,
          accent: C.accent,
          now: new Date(),
          flash: g.flash,
          motionBlur: !reduced,
        });

        if (g.cracks.length) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(0, 0, clockFaceRadius(g.radius), 0, TAU);
          ctx.clip();
          for (const [stroke, offset, width] of [
            ['rgba(255,255,255,0.75)', 0.8, 1.4],
            ['rgba(30,30,32,0.7)', 0, 1],
          ] as const) {
            ctx.strokeStyle = stroke;
            ctx.lineWidth = width;
            for (const crack of g.cracks) {
              const ox = Math.cos(crack.angle) * crack.dist + offset;
              const oy = Math.sin(crack.angle) * crack.dist + offset;
              ctx.beginPath();
              for (const p of crack.points) {
                if (Number.isNaN(p.x)) ctx.moveTo(ox, oy);
                else ctx.lineTo(ox + p.x, oy + p.y);
              }
              ctx.stroke();
            }
          }
          ctx.restore();
        }
        ctx.restore();
      }

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (const f of g.floaters) {
        const style = FLOATER_STYLE[f.kind];
        const grow = Math.min(1, f.age * 4);
        const s = reduced ? 1 : grow < 1 ? grow * (1.25 - 0.25 * grow) : 1;
        const pulse = 0.5 + 0.5 * Math.sin(f.t * 5);
        const buzz = f.kind === 'phone' && !reduced && Math.sin(f.t * 3) > 0.6 ? Math.sin(f.t * 70) * 2 : 0;
        ctx.save();
        ctx.translate(f.x + buzz, f.y);
        ctx.scale(s, s);

        const glow = ctx.createRadialGradient(0, 0, FLOATER_R * 0.4, 0, 0, FLOATER_R + 12);
        glow.addColorStop(0, `${style.ring}${0.22 + 0.12 * pulse})`);
        glow.addColorStop(1, `${style.ring}0)`);
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(0, 0, FLOATER_R + 12, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = `${style.ring}${0.55 + 0.3 * pulse})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, FLOATER_R + 3, 0, TAU);
        ctx.stroke();

        ctx.rotate(reduced ? 0 : Math.sin(f.t * 2.4) * 0.22);
        ctx.shadowColor = 'rgba(0,0,0,0.55)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 6;
        ctx.font = `${FLOATER_R * 1.5}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
        ctx.fillText(FLOATER_EMOJI[f.kind], 0, 2);
        ctx.restore();

        ctx.fillStyle = style.labelColor;
        ctx.font = '700 11px system-ui, -apple-system, sans-serif';
        ctx.fillText(style.label, f.x + buzz, f.y + FLOATER_R + 16);
      }

      if (g.pebbleState === 'drag') {
        const pull = Math.min(1, Math.hypot(g.pebble.x - a.x, g.pebble.y - a.y) / MAX_PULL);
        let px = g.pebble.x;
        let py = g.pebble.y;
        let vx = (a.x - g.pebble.x) * LAUNCH_POWER;
        let vy = (a.y - g.pebble.y) * LAUNCH_POWER;
        for (let i = 0; i < 30; i++) {
          const dtp = 0.03;
          vy += GRAVITY * dtp;
          px += vx * dtp;
          py += vy * dtp;
          if (i % 2 === 0) {
            ctx.globalAlpha = 0.6 * (1 - i / 30);
            ctx.fillStyle = g.fever > 0 ? '#ffd166' : C.text;
            ctx.beginPath();
            ctx.arc(px, py, 3 - i * 0.06, 0, TAU);
            ctx.fill();
          }
        }
        ctx.globalAlpha = 1;

        const hue = 120 - pull * 120;
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(a.x, a.y - 10, 58, 0, TAU);
        ctx.stroke();
        ctx.strokeStyle = `hsl(${hue}, 85%, 55%)`;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(a.x, a.y - 10, 58, -Math.PI / 2, -Math.PI / 2 + pull * TAU);
        ctx.stroke();
        ctx.fillStyle = `hsl(${hue}, 85%, 65%)`;
        ctx.font = '700 12px system-ui, -apple-system, sans-serif';
        ctx.fillText(`${Math.round(pull * 100)}%`, a.x + 78, a.y - 10);
      }

      if (g.trail.length > 1) {
        const hot = g.fever > 0;
        for (let i = 0; i < g.trail.length; i++) {
          const p = g.trail[i];
          const k = i / g.trail.length;
          ctx.globalAlpha = k * (hot ? 0.8 : 0.35);
          ctx.fillStyle = hot ? (i % 2 ? '#ffd166' : '#e87c20') : '#d9d6d0';
          ctx.beginPath();
          ctx.arc(p.x, p.y, PEBBLE_R * (0.3 + 0.7 * k), 0, TAU);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }

      const flying = g.pebbleState === 'flying';
      const wobble = reduced ? 0 : Math.sin(g.time * 55) * 16 * g.bandWobble;
      const pouch = flying ? { x: a.x, y: a.y - 26 + wobble } : g.pebble;
      const stretch = flying ? 0 : Math.hypot(g.pebble.x - a.x, g.pebble.y - a.y) / MAX_PULL;
      const glow = g.fever > 0 ? '#ffb347' : null;
      drawSlingshot(ctx, a, pouch, stretch, () => {
        if (!flying) drawPebble(ctx, g.pebble, glow);
      });
      if (flying) drawPebble(ctx, g.pebble, glow);

      for (const p of g.particles) {
        const k = Math.max(0, p.life / p.max);
        ctx.globalAlpha = k;
        if (p.kind === 'text') {
          const pop = 1 + Math.max(0, (k - 0.8) * 2.5);
          ctx.font = `800 ${Math.round(p.size * pop)}px system-ui, -apple-system, sans-serif`;
          ctx.lineWidth = 4;
          ctx.strokeStyle = 'rgba(0,0,0,0.55)';
          ctx.strokeText(p.text ?? '', p.x, p.y);
          ctx.fillStyle = p.color;
          ctx.fillText(p.text ?? '', p.x, p.y);
        } else if (p.kind === 'ring') {
          ctx.strokeStyle = p.color;
          ctx.lineWidth = 3 * k;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * (1 - k * 0.7), 0, TAU);
          ctx.stroke();
        } else if (p.kind === 'shard') {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.fillStyle = 'rgba(220,235,255,0.25)';
          ctx.strokeStyle = 'rgba(255,255,255,0.8)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(-p.size, 0);
          ctx.lineTo(0, -p.size * 0.6);
          ctx.lineTo(p.size * 0.8, p.size * 0.4);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        } else {
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, TAU);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
      ctx.restore();

      if (g.phase === 'playing' && g.countdown > 0) {
        const elapsed = COUNTDOWN_SECONDS - g.countdown;
        const idx = Math.min(COUNTDOWN_LABELS.length - 1, Math.floor(elapsed / 0.6));
        const frac = (elapsed % 0.6) / 0.6;
        const size = Math.min(g.w, g.h) * 0.22 * (reduced ? 1 : 1.5 - 0.5 * Math.min(1, frac * 3));
        ctx.globalAlpha = 1 - frac * 0.8;
        ctx.font = `900 ${Math.round(size)}px system-ui, -apple-system, sans-serif`;
        ctx.lineWidth = 8;
        ctx.strokeStyle = 'rgba(0,0,0,0.5)';
        ctx.strokeText(COUNTDOWN_LABELS[idx], g.w / 2, g.h * 0.55);
        ctx.fillStyle = idx === COUNTDOWN_LABELS.length - 1 ? C.accent : '#ffffff';
        ctx.fillText(COUNTDOWN_LABELS[idx], g.w / 2, g.h * 0.55);
        ctx.globalAlpha = 1;
      }
    };

    const loop = (t: number) => {
      const real = Math.min(0.033, (t - last) / 1000);
      last = t;
      const g = gameRef.current;
      let dt = real;
      if (g && g.slowmo > 0) {
        g.slowmo -= real;
        dt = real * 0.35;
      }
      step(dt);
      draw();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      if (captionTimer.current) clearTimeout(captionTimer.current);
    };
  }, [layout, award, endGame, play, showCaption, toast]);

  const pointerPos = (e: React.PointerEvent<HTMLCanvasElement>): Vec => {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const g = gameRef.current;
    if (!g || g.pebbleState !== 'rest' || g.phase !== 'playing' || g.countdown > 0) return;
    const p = pointerPos(e);
    if (Math.hypot(p.x - g.anchor.x, p.y - g.anchor.y) > 60) return;
    g.pebbleState = 'drag';
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Capture is best effort; dragging still works without it.
    }
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const g = gameRef.current;
    if (!g || g.pebbleState !== 'drag') return;
    const p = pointerPos(e);
    let dx = p.x - g.anchor.x;
    let dy = p.y - g.anchor.y;
    const len = Math.hypot(dx, dy);
    if (len > MAX_PULL) {
      dx = (dx / len) * MAX_PULL;
      dy = (dy / len) * MAX_PULL;
    }
    g.pebble = {
      x: g.anchor.x + dx,
      y: Math.min(g.anchor.y + dy, g.h - PEBBLE_R - 6),
    };
  };

  const onPointerUp = () => {
    const g = gameRef.current;
    if (!g || g.pebbleState !== 'drag') return;
    const dx = g.anchor.x - g.pebble.x;
    const dy = g.anchor.y - g.pebble.y;
    if (Math.hypot(dx, dy) < 12) {
      g.pebbleState = 'rest';
      g.pebble = { ...g.anchor };
      return;
    }
    launch({ x: dx * LAUNCH_POWER, y: dy * LAUNCH_POWER });
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLCanvasElement>) => {
    if (e.key !== ' ' && e.key !== 'Enter') return;
    e.preventDefault();
    if (gameRef.current?.phase === 'playing') autoShot();
    else startGame();
  };

  const toggleSound = () => {
    const next = !soundOnRef.current;
    soundOnRef.current = next;
    setSoundOn(next);
    if (next) {
      soundRef.current ??= createSound();
      soundRef.current.unlock();
      soundRef.current.hit();
    }
  };

  const toggleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen?.();
  };

  const share = async () => {
    if (!result) return;
    const url = `${window.location.origin}/play`;
    const text = `I scored ${result.score} knocking a clock around for 60 seconds. It still says ${formatTime(new Date())}.`;
    try {
      if (navigator.share) {
        await navigator.share({ text, url });
        return;
      }
      await navigator.clipboard.writeText(`${text} ${url}`);
      setShareNote('Copied. Paste it anywhere.');
    } catch {
      setShareNote(null);
    }
  };

  const pct = now ? dayLeftPct(now) : null;
  const urgent = phase === 'playing' && hud.timeLeft <= 10;
  const mult = Math.min(5, hud.combo);

  return (
    <div ref={stageRef} className={`play-full${hud.fever && phase === 'playing' ? ' is-fever' : ''}`}>
      <canvas
        ref={canvasRef}
        tabIndex={0}
        role="img"
        aria-label="Slingshot game. A wall clock shows the real time. Press Space to start and to fire."
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onKeyDown}
        className="play-canvas"
      />

      <div className="play-hud play-hud-left">
        <Link href={ROUTES.home} className="play-home">
          ← UNTIL
        </Link>
        <span className="play-hud-meta">
          {now ? formatTime(now) : '—'}
          {pct !== null ? ` · ${pct}% of today left` : ''}
        </span>
      </div>

      {phase === 'playing' ? (
        <div className={`play-hud play-hud-center${urgent ? ' is-urgent' : ''}`}>
          <span className="play-timer">{formatClock(hud.timeLeft)}</span>
          <span className="play-level">Level {hud.level}</span>
        </div>
      ) : null}

      <div className="play-hud play-hud-right">
        {phase === 'playing' ? (
          <div className="play-score">
            <span className="play-score-value">{hud.score.toLocaleString()}</span>
            {mult > 1 ? <span key={mult} className="play-combo">x{mult}</span> : null}
            {hud.fever ? <span className="play-fever">Fever x2</span> : null}
          </div>
        ) : best > 0 ? (
          <span className="play-hud-meta">Best {best.toLocaleString()}</span>
        ) : null}
        <button
          type="button"
          className="play-icon-btn"
          onClick={toggleSound}
          aria-pressed={soundOn}
          aria-label={soundOn ? 'Sound on' : 'Sound off'}
        >
          {soundOn ? '🔊' : '🔈'}
        </button>
        {canFullscreen ? (
          <button
            type="button"
            className="play-icon-btn"
            onClick={toggleFullscreen}
            aria-label={fullscreen ? 'Exit full screen' : 'Full screen'}
          >
            {fullscreen ? '⤡' : '⤢'}
          </button>
        ) : null}
      </div>

      <div className="play-toasts" aria-live="polite">
        {toasts.map(t => (
          <div key={t.id} className="play-toast">
            {t.sub ? <span className="play-toast-sub">{t.sub}</span> : null}
            <span>{t.text}</span>
          </div>
        ))}
      </div>

      {caption && phase === 'playing' ? (
        <p className="play-caption" aria-live="polite">
          {caption}
        </p>
      ) : null}

      {phase === 'playing' ? (
        <p className="play-hint">
          pull back and let go · ⌛ +5s · 📅 points · 📱 costs 5s · space to fire
        </p>
      ) : null}

      {phase === 'idle' ? (
        <div className="play-overlay">
          <div className="play-card">
            <h1 className="play-title">Knock time back.</h1>
            <p className="play-sub">
              You have 60 seconds. Hit the clock with the slingshot.
            </p>
            <ul className="play-rules">
              <li>Hit the clock for points. Keep hitting for a combo up to x5.</li>
              <li>Every 5 hits in a row starts Fever: double points for 6 seconds.</li>
              <li>Hit the middle for a bullseye. Hit hard to crack the glass. Six cracks shatters it.</li>
              <li>⌛ gives you 5 more seconds. 📅 gives bonus points.</li>
              <li>📱 costs you 5 seconds and your combo. Like real life.</li>
            </ul>
            <button type="button" className="landing-primary-cta" onClick={startGame}>
              Start the clock
            </button>
            {best > 0 ? <p className="play-best">Your best: {best.toLocaleString()}</p> : null}
          </div>
        </div>
      ) : null}

      {phase === 'over' && result ? (
        <div className="play-overlay">
          <div className="play-card">
            <p className="play-eyebrow">{result.newBest ? 'New best' : "Time's up"}</p>
            <p className="play-final">{result.score.toLocaleString()}</p>
            <div className="play-stats">
              <span><strong>{result.hits}</strong> hits</span>
              <span><strong>{result.shots ? Math.round((result.hits / result.shots) * 100) : 0}%</strong> accuracy</span>
              <span><strong>x{Math.min(5, result.bestCombo)}</strong> best combo</span>
              <span><strong>{result.clocksBroken}</strong> clocks broken</span>
              <span><strong>{result.badges}/{Object.keys(BADGES).length}</strong> badges</span>
              <span><strong>{result.best.toLocaleString()}</strong> best</span>
            </div>
            <p className="play-sub">
              60 seconds gone. The clock still says {now ? formatTime(now) : 'the same thing'}.
              UNTIL shows how much of today is left, right on your home screen.
            </p>
            <div className="play-actions">
              <button type="button" className="landing-primary-cta" onClick={startGame}>
                Play again
              </button>
              <button type="button" className="play-secondary" onClick={() => void share()}>
                Share score
              </button>
            </div>
            {shareNote ? <p className="play-best">{shareNote}</p> : null}
            <a
              href={SITE_CONFIG.playStoreUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="play-get"
            >
              Get UNTIL on Google Play
            </a>
          </div>
        </div>
      ) : null}
    </div>
  );
}
