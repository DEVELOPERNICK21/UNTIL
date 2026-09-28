'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { LANDING_COPY, ROUTES } from '@/domain';
import { CLOCK_HOOK_OFFSET, drawWallClock } from './clockArt';

const TAU = Math.PI * 2;
const MAX_WIDTH = 560;
const TOP_PAD = 26;
const BOTTOM_PAD = 26;
const PENDULUM_G = 2500;
const COMBO_WINDOW = 0.7;
const MAX_COMBO = 5;
const BEST_KEY = 'until-hero-best-spin';
const MILESTONES = [10, 25, 50, 100];

type Vec = { x: number; y: number };
type Spark = { x: number; y: number; vx: number; vy: number; life: number; color: string; size: number };
type Mode = 'idle' | 'spinning' | 'result';

type Toy = {
  w: number;
  h: number;
  lift: number;
  radius: number;
  swing: number;
  swingV: number;
  twist: number;
  twistV: number;
  spin: number;
  spinV: number;
  punch: number;
  combo: number;
  lastKnock: number;
  time: number;
  session: boolean;
  turns: number;
  milestone: number;
  sparks: Spark[];
};

type Hud = { mode: Mode; turns: number; combo: number; best: number; newBest: boolean; time: string; note: string };

function formatTime(now: Date): string {
  return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function readBest(): number {
  try {
    return Number(window.localStorage.getItem(BEST_KEY)) || 0;
  } catch {
    return 0;
  }
}

function writeBest(value: number) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    /* storage can be blocked */
  }
}

function pivot(t: Toy): Vec {
  return { x: t.w / 2, y: 0 };
}

function stringLength(t: Toy): number {
  return t.lift + TOP_PAD + t.radius;
}

function clockCenter(t: Toy): Vec {
  const p = pivot(t);
  const len = stringLength(t);
  return { x: p.x + Math.sin(t.swing) * len, y: p.y + Math.cos(t.swing) * len };
}

function swingLimit(t: Toy): number {
  const room = t.w / 2 - t.radius - 12;
  return Math.asin(Math.max(0.02, Math.min(0.9, room / stringLength(t))));
}

export function HeroClockToy() {
  const { hero } = LANDING_COPY;
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const toyRef = useRef<Toy>({
    w: MAX_WIDTH, h: 300, lift: 120, radius: 70,
    swing: 0.05, swingV: 0, twist: 0, twistV: 0, spin: 0, spinV: 0, punch: 0,
    combo: 0, lastKnock: -10, time: 0, session: false, turns: 0, milestone: 0, sparks: [],
  });
  const wakeRef = useRef<() => void>(() => {});
  const reducedRef = useRef(false);
  const [hud, setHud] = useState<Hud>({
    mode: 'idle', turns: 0, combo: 0, best: 0, newBest: false, time: '', note: '',
  });
  const [size, setSize] = useState({ w: MAX_WIDTH, h: 300, lift: 120 });

  useEffect(() => {
    setHud(h => ({ ...h, best: readBest() }));
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!root || !canvas || !ctx) return;

    reducedRef.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const css = getComputedStyle(document.documentElement);
    const accent = css.getPropertyValue('--accent').trim() || '#e87c20';

    const layout = () => {
      const t = toyRef.current;
      const parent = root.parentElement;
      let parentWidth = MAX_WIDTH;
      if (parent) {
        const pcs = getComputedStyle(parent);
        parentWidth =
          parent.clientWidth - parseFloat(pcs.paddingLeft) - parseFloat(pcs.paddingRight);
      }
      t.w = Math.max(240, Math.min(MAX_WIDTH, parentWidth));
      t.radius = Math.round(Math.max(56, Math.min(76, t.w * 0.14)));
      const hero = root.closest('.cinematic-hero-root');
      const flowTop = root.getBoundingClientRect().top;
      // The string must run past the top edge of the hero so its start point is never visible.
      t.lift = hero ? Math.max(80, Math.round(flowTop - hero.getBoundingClientRect().top + 40)) : 240;
      t.h = t.lift + TOP_PAD + t.radius * 2 + BOTTOM_PAD;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(t.w * dpr);
      canvas.height = Math.round(t.h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      setSize({ w: t.w, h: t.h, lift: t.lift });
      draw();
    };

    const draw = () => {
      const t = toyRef.current;
      const R = t.radius;
      const c = clockCenter(t);
      const tilt = -(t.swing + t.twist);
      const p = pivot(t);
      ctx.clearRect(0, 0, t.w, t.h);

      const hook = (R + CLOCK_HOOK_OFFSET) * (1 + t.punch);
      const loop = {
        x: c.x + Math.sin(tilt) * hook,
        y: c.y - Math.cos(tilt) * hook,
      };
      ctx.strokeStyle = 'rgba(210,210,210,0.6)';
      ctx.lineWidth = 1.25;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(loop.x, loop.y);
      ctx.stroke();

      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.rotate(tilt);
      const scale = 1 + t.punch;
      ctx.scale(scale, scale);
      drawWallClock(ctx, {
        radius: R,
        spin: t.spin,
        spinV: t.spinV,
        accent,
        now: new Date(),
        motionBlur: !reducedRef.current,
      });
      ctx.restore();

      for (const s of t.sparks) {
        ctx.globalAlpha = Math.max(0, s.life / 0.6);
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, TAU);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    let hudAcc = 0;
    const pushHud = (t: Toy) => {
      setHud(h => {
        if (t.session) {
          const turns = Math.floor(t.turns);
          const combo = t.time - t.lastKnock < COMBO_WINDOW ? t.combo : 0;
          if (h.mode === 'spinning' && h.turns === turns && h.combo === combo) return h;
          return { ...h, mode: 'spinning', turns, combo };
        }
        return h;
      });
    };

    const endSession = (t: Toy) => {
      t.session = false;
      const turns = Math.floor(t.turns);
      const best = readBest();
      const newBest = turns > best;
      if (newBest) writeBest(turns);
      setHud({
        mode: 'result', turns, combo: 0, best: Math.max(best, turns), newBest,
        time: formatTime(new Date()), note: '',
      });
    };

    const step = (dt: number) => {
      const t = toyRef.current;
      t.time += dt;
      const len = stringLength(t);
      const omega2 = Math.max(3, Math.min(14, PENDULUM_G / len));
      const limit = swingLimit(t);

      let swingA = -omega2 * Math.sin(t.swing) - 0.9 * t.swingV;
      const over = Math.abs(t.swing) - limit * 0.8;
      if (over > 0) swingA -= Math.sign(t.swing) * over * 260 + t.swingV * 4;
      t.swingV += swingA * dt;
      t.swing += t.swingV * dt;
      if (Math.abs(t.swing) > limit) {
        t.swing = Math.sign(t.swing) * limit;
        t.swingV *= -0.3;
      }

      t.twistV += (-38 * t.twist - 3.2 * t.twistV - swingA * 0.25) * dt;
      t.twist += t.twistV * dt;

      const prevSpin = t.spin;
      if (Math.abs(t.spinV) > 2.5) {
        t.spinV *= Math.exp(-0.9 * dt);
      } else {
        const target = Math.round(t.spin / TAU) * TAU;
        t.spinV += (-(t.spin - target) * 14 - t.spinV * 5) * dt;
      }
      t.spin += t.spinV * dt;
      if (t.session && Math.abs(t.spinV) > 2.5) {
        t.turns += (Math.abs(t.spin - prevSpin) * 3) / TAU;
        const next = MILESTONES[t.milestone];
        if (next !== undefined && t.turns >= next) {
          t.milestone += 1;
          setHud(h => ({ ...h, note: hero.toyMilestones[t.milestone - 1] ?? '' }));
        }
      }
      t.punch = Math.max(0, t.punch - dt * 0.5) * Math.exp(-8 * dt);

      for (const s of t.sparks) {
        s.life -= dt;
        s.vy += 900 * dt;
        s.x += s.vx * dt;
        s.y += s.vy * dt;
      }
      t.sparks = t.sparks.filter(s => s.life > 0);

      if (reducedRef.current) {
        t.swing = 0; t.swingV = 0; t.twist = 0; t.twistV = 0; t.spin = 0; t.spinV = 0; t.punch = 0;
      }

      if (t.session) {
        const target = Math.round(t.spin / TAU) * TAU;
        if (Math.abs(t.spinV) < 0.05 && Math.abs(t.spin - target) < 0.01) {
          t.spin = 0;
          t.spinV = 0;
          endSession(t);
        } else {
          hudAcc += dt;
          if (hudAcc > 0.1) {
            hudAcc = 0;
            pushHud(t);
          }
        }
      }
    };

    let raf = 0;
    let last = performance.now();
    let visible = true;
    let lastPaint = 0;

    const frame = (now: number) => {
      raf = 0;
      if (!visible || document.hidden) return;
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;
      step(dt);
      const t = toyRef.current;
      const moving =
        t.session ||
        t.sparks.length > 0 ||
        Math.abs(t.swingV) > 0.005 ||
        Math.abs(t.twistV) > 0.005 ||
        Math.abs(t.spinV) > 0.01;
      // A settled clock only needs a repaint for the second hand.
      if (moving || now - lastPaint > 250) {
        draw();
        lastPaint = now;
      }
      raf = requestAnimationFrame(frame);
    };

    const wake = () => {
      if (raf || !visible) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };
    wakeRef.current = wake;

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) wake();
    });
    io.observe(root);
    const ro = new ResizeObserver(layout);
    if (root.parentElement) ro.observe(root.parentElement);
    window.addEventListener('resize', layout);
    document.addEventListener('visibilitychange', wake);

    layout();
    wake();

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      window.removeEventListener('resize', layout);
      document.removeEventListener('visibilitychange', wake);
    };
  }, [hero.toyMilestones]);

  const toCanvas = (clientX: number, clientY: number): Vec | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const t = toyRef.current;
    return {
      x: ((clientX - rect.left) / rect.width) * t.w,
      y: ((clientY - rect.top) / rect.height) * t.h,
    };
  };

  const onClock = (p: Vec) => {
    const t = toyRef.current;
    const c = clockCenter(t);
    return Math.hypot(p.x - c.x, p.y - c.y) <= t.radius + 6;
  };

  const knock = (p: Vec) => {
    const t = toyRef.current;
    const c = clockCenter(t);
    const dx = p.x - c.x;
    const dy = p.y - c.y;
    const push = dx < 0 ? 1 : -1;
    t.combo = t.time - t.lastKnock < COMBO_WINDOW ? Math.min(MAX_COMBO, t.combo + 1) : 1;
    t.lastKnock = t.time;

    const len = stringLength(t);
    t.swingV += (push * (170 + 35 * t.combo)) / len;
    t.twistV += push * 2.5 * (dy / t.radius) + push * 1.2;
    const spinning = Math.abs(t.spinV) > 2.5;
    const dir = spinning ? Math.sign(t.spinV) : Math.sign(-dy * push) || 1;
    t.spinV = Math.max(-70, Math.min(70, t.spinV + dir * (7 + 4.5 * t.combo)));
    t.punch = 0.05 + 0.01 * t.combo;

    for (let i = 0; i < 8 + t.combo * 3; i++) {
      const a = Math.random() * TAU;
      const speed = 120 + Math.random() * 220;
      t.sparks.push({
        x: p.x, y: p.y,
        vx: Math.cos(a) * speed, vy: Math.sin(a) * speed - 120,
        life: 0.35 + Math.random() * 0.25,
        color: Math.random() < 0.6 ? '#e87c20' : '#f5f0e6',
        size: 1.2 + Math.random() * 1.8,
      });
    }

    if (!t.session) {
      t.session = true;
      t.turns = 0;
      t.milestone = 0;
      setHud(h => ({ ...h, mode: 'spinning', turns: 0, combo: t.combo, newBest: false, note: '' }));
    }
    wakeRef.current();
  };

  const status = (() => {
    if (hud.mode === 'spinning') {
      return hud.turns < 1 ? hero.toyWarmup : hero.toySpinning.replace('{n}', String(hud.turns));
    }
    if (hud.mode === 'result') {
      const line = hero.toyResult.replace('{n}', String(hud.turns)).replace('{time}', hud.time);
      const tail = hud.newBest ? hero.toyNewBest : hero.toyBest.replace('{n}', String(hud.best));
      return `${line} ${tail}`;
    }
    return hero.toyHint;
  })();

  return (
    <div ref={rootRef} className="hero-toy">
      <canvas
        ref={canvasRef}
        className="hero-toy-canvas"
        style={{ width: size.w, height: size.h, marginTop: -size.lift }}
        aria-hidden
        onClick={e => {
          const p = toCanvas(e.clientX, e.clientY);
          if (p && onClock(p)) knock(p);
        }}
        onPointerMove={e => {
          const p = toCanvas(e.clientX, e.clientY);
          e.currentTarget.style.cursor = p && onClock(p) ? 'pointer' : 'default';
        }}
      />
      <button
        type="button"
        className="sr-only"
        onClick={() => {
          const c = clockCenter(toyRef.current);
          knock({ x: c.x - toyRef.current.radius * 0.6, y: c.y - toyRef.current.radius * 0.4 });
        }}
      >
        {hero.toyAria}
      </button>
      <div className="hero-toy-hud" aria-live="polite">
        <span className={hud.mode === 'spinning' ? 'hero-toy-status is-live' : 'hero-toy-status'}>
          {status}
        </span>
        {hud.mode === 'spinning' && hud.combo > 1 && (
          <span key={hud.combo} className="hero-toy-combo">x{hud.combo}</span>
        )}
        {hud.note && hud.mode === 'spinning' && (
          <span key={hud.note} className="hero-toy-note">{hud.note}</span>
        )}
      </div>
      <Link href={ROUTES.play} className="hero-toy-more">
        {hero.playLink}
      </Link>
    </div>
  );
}
