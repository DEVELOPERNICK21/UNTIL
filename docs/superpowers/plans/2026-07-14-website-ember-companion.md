# Website Ember Companion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a pointer-following Ember companion to the landing page that appears after the cinematic hero and whispers on click.

**Architecture:** A client-only `EmberCompanion` component (rAF lerp + SVG). Whisper copy in `LANDING_COPY`. Mounted only from `page.tsx`. IntersectionObserver on `.landing-cinematic-hero` gates visibility. No GSAP.

**Tech Stack:** Next.js 14 App Router, React 18 client components, TypeScript, CSS modules/globals

**Spec:** `docs/superpowers/specs/2026-07-14-website-ember-companion-design.md`

---

## File map

| File | Action |
|------|--------|
| `website/src/domain/copy.ts` | Add `emberCompanion` SSOT |
| `website/src/components/EmberCompanion.tsx` | Create companion |
| `website/src/app/globals.css` | Minimal companion / bubble styles |
| `website/src/app/page.tsx` | Mount companion |
| Spec success checkboxes | Mark done after verify |

---

### Task 1: Add Ember companion copy SSOT

**Files:**
- Modify: `website/src/domain/copy.ts`

- [ ] **Step 1: Append `emberCompanion` to `LANDING_COPY`**

Add before the closing `} as const` of `LANDING_COPY` (after `footer` is fine):

```ts
  emberCompanion: {
    ariaLabel: 'Ember, UNTIL companion',
    whispers: [
      'I’m Ember — I travel with you while you look around.',
      'Your day is still soft. UNTIL keeps it glanceable on your home screen.',
      'When you’re ready, Android has widgets, Ember, and Wear OS Day %.',
      'No rush. Scroll a little more — I’ll stay nearby.',
    ],
  },
```

- [ ] **Step 2: Commit**

```bash
git add website/src/domain/copy.ts
git commit -m "$(cat <<'EOF'
feat(website): add Ember companion whisper copy

EOF
)"
```

---

### Task 2: Implement `EmberCompanion` client component

**Files:**
- Create: `website/src/components/EmberCompanion.tsx`

- [ ] **Step 1: Create the component file with the following implementation**

```tsx
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
  const mood = useMemo(() => moodFromHour(new Date().getHours()), []);
  const colors = MOOD_COLOR[mood];

  const rootRef = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: 0, y: 0 });
  const target = useRef({ x: 0, y: 0 });
  const raf = useRef<number | null>(null);
  const visibleOk = useRef(true);
  const whisperTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const whisperIndex = useRef(0);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduceMotion(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    const el = document.querySelector(CINEMATIC_SELECTOR);
    if (!el) {
      setActive(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        // Unlock when cinematic is mostly gone
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
    if (!visibleOk.current || reduceMotion) return;
    const p = pos.current;
    const t = target.current;
    p.x += (t.x - p.x) * LERP;
    p.y += (t.y - p.y) * LERP;
    const node = rootRef.current;
    if (node) {
      node.style.transform = `translate3d(${p.x}px, ${p.y}px, 0)`;
    }
    raf.current = requestAnimationFrame(tick);
  }, [reduceMotion]);

  useEffect(() => {
    if (!active || reduceMotion) {
      if (raf.current != null) cancelAnimationFrame(raf.current);
      raf.current = null;
      if (reduceMotion && rootRef.current) {
        rootRef.current.style.transform = '';
      }
      return;
    }
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current != null) cancelAnimationFrame(raf.current);
    };
  }, [active, reduceMotion, tick]);

  useEffect(() => {
    if (!active || reduceMotion) return;

    const onMove = (e: PointerEvent) => {
      target.current = {
        x: e.clientX + OFFSET.x,
        y: e.clientY + OFFSET.y,
      };
    };
    const onVis = () => {
      visibleOk.current = document.visibilityState === 'visible';
      if (visibleOk.current && raf.current == null && active && !reduceMotion) {
        raf.current = requestAnimationFrame(tick);
      }
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [active, reduceMotion, tick]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setWhisper(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const clearWhisperTimer = () => {
    if (whisperTimer.current) clearTimeout(whisperTimer.current);
    whisperTimer.current = null;
  };

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
    window.setTimeout(() => setBounce(false), 420);
    clearWhisperTimer();
    whisperTimer.current = setTimeout(() => setWhisper(null), WHISPER_MS);
  };

  if (!active && !reduceMotion) {
    // Still mount nothing until unlocked — avoid flash during cinematic
  }

  const parkedClass = reduceMotion ? ' ember-companion--parked' : '';
  const hiddenClass = !active ? ' ember-companion--hidden' : '';

  return (
    <div
      className={`ember-companion${parkedClass}${hiddenClass}${
        bounce ? ' ember-companion--bounce' : ''
      }`}
      ref={rootRef}
      style={
        reduceMotion
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
```

- [ ] **Step 2: Commit**

```bash
git add website/src/components/EmberCompanion.tsx
git commit -m "$(cat <<'EOF'
feat(website): add EmberCompanion pointer-follow component

EOF
)"
```

---

### Task 3: Styles + mount on home page

**Files:**
- Modify: `website/src/app/globals.css`
- Modify: `website/src/app/page.tsx`

- [ ] **Step 1: Append CSS to `globals.css`**

```css
/* Ember companion (landing only) */
.ember-companion {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 60;
  pointer-events: none;
  will-change: transform;
  transition: opacity 0.45s ease;
}

.ember-companion--hidden {
  opacity: 0;
  visibility: hidden;
}

.ember-companion--parked {
  top: auto;
  left: auto;
  right: 1.25rem;
  bottom: 1.5rem;
  transform: none !important;
  will-change: auto;
}

.ember-companion-btn {
  pointer-events: auto;
  border: none;
  background: transparent;
  padding: 0;
  cursor: pointer;
  border-radius: 999px;
  line-height: 0;
  filter: drop-shadow(0 8px 18px rgba(0, 0, 0, 0.35));
}

.ember-companion-btn:focus-visible {
  outline: 2px solid var(--text, #fff);
  outline-offset: 4px;
}

.ember-companion--bounce .ember-companion-btn {
  animation: ember-bounce 0.42s ease;
}

@keyframes ember-bounce {
  0%,
  100% {
    transform: scale(1);
  }
  40% {
    transform: scale(1.12);
  }
  70% {
    transform: scale(0.96);
  }
}

.ember-companion-whisper {
  pointer-events: auto;
  position: absolute;
  bottom: calc(100% + 10px);
  left: 50%;
  transform: translateX(-50%);
  min-width: 160px;
  max-width: 220px;
  padding: 0.65rem 0.8rem;
  border-radius: 12px;
  background: rgba(20, 16, 28, 0.92);
  color: #f5f0ea;
  font-size: 0.85rem;
  line-height: 1.35;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
  text-align: center;
}
```

- [ ] **Step 2: Mount on home page**

At top of `website/src/app/page.tsx`:

```tsx
import { EmberCompanion } from '@/components/EmberCompanion';
```

Inside the fragment, after cinematic hero (or at end of fragment — either works; prefer end so it layers cleanly):

```tsx
      <EmberCompanion />
```

Place immediately before the closing `</>` of the home page return.

- [ ] **Step 3: Build**

```bash
cd website && yarn build
```

Expected: build succeeds (exit 0). ESLint option warnings may appear; treat type/compile failure as blocker.

- [ ] **Step 4: Manual check with `yarn dev`**

- Open `/` — no Ember during cinematic (or opacity 0)
- Scroll past cinematic — Ember fades in and follows pointer
- Click — whisper rotates; Escape / second click dismisses
- Open `/privacy` — no Ember
- Optional: OS reduce-motion — Ember parked bottom-right

- [ ] **Step 5: Commit**

```bash
git add website/src/app/globals.css website/src/app/page.tsx
git commit -m "$(cat <<'EOF'
feat(website): mount Ember companion after cinematic hero

EOF
)"
```

---

### Task 4: Mark spec criteria done

**Files:**
- Modify: `docs/superpowers/specs/2026-07-14-website-ember-companion-design.md`

- [ ] **Step 1: Check all success criteria `[x]`** after manual verify

- [ ] **Step 2: Commit**

```bash
git add docs/superpowers/specs/2026-07-14-website-ember-companion-design.md
git commit -m "$(cat <<'EOF'
docs: mark website Ember companion success criteria done

EOF
)"
```

---

## Spec coverage

| Requirement | Task |
|-------------|------|
| Pointer follow after cinematic | Tasks 2–3 |
| App-faithful SVG + mood colors | Task 2 |
| Whisper SSOT | Task 1–2 |
| Reduce motion park | Task 2–3 |
| Home only | Task 3 |
| No GSAP | Task 2 |

## Notes for implementers

- Fix gradient `id` collisions if multiple Embers ever mount (`ember-web-fill` is fine for single instance).
- If IntersectionObserver never fires inactive unlock on short pages, fallback already sets `active` when cinematic node missing.
- Do not import from React Native `src/ui/Ember.tsx`.
