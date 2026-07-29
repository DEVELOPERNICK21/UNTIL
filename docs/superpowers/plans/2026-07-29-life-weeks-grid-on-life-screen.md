# Life Weeks Grid on Your Life Screen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Spec:** `docs/superpowers/specs/2026-07-29-life-weeks-grid-on-life-screen-design.md`

**Goal:** Show the same week-of-life dots from onboarding on the unlocked `Your life` screen, replacing the circular progress while keeping days lived / days left and the summary.

**Architecture:** Pure `computeLifeWeeks` in `core/time`. Shared `LifeWeeksGrid` in `ui/`. `PeriodDetailScreen` gains an optional `hero` slot that replaces `CircularProgress`. `LifeScreen` passes the weeks label + grid; `LifeWeeksPreviewScreen` switches to the same helper and grid.

**Tech Stack:** React Native, existing theme (`useTheme`, `Spacing`), Jest for pure helper tests

## Global Constraints

- Surfaces import hooks / `ui` / theme only; no `core` business logic in surfaces beyond display helpers already allowed for formatting
- Pure week math lives in `core/time` (no React)
- Cap rendered dots at 5200 (same as onboarding)
- Existing `DotsGrid` (fixed rows×cols) stays untouched
- Day / Month / Year detail screens keep circular progress
- Locked / no birth-date Life UI unchanged
- Human-copy rules for visible strings (no em dashes, no coach filler)
- Architecture layer boundaries from workspace rules

## File map

| File | Responsibility |
|------|----------------|
| `src/core/time/lifeWeeks.ts` | Pure `computeLifeWeeks` + `LIFE_WEEKS_DOT_CAP` |
| `src/core/time/index.ts` | Re-export life weeks helpers |
| `__tests__/lifeWeeks.test.ts` | Unit tests for week math |
| `src/ui/LifeWeeksGrid.tsx` | Shared week dots visual |
| `src/ui/index.ts` | Export `LifeWeeksGrid` |
| `src/surfaces/app/PeriodDetailScreen.tsx` | Optional `hero` replaces ring |
| `src/surfaces/app/LifeScreen.tsx` | Pass weeks label + grid as `hero` |
| `src/surfaces/auth/LifeWeeksPreviewScreen.tsx` | Use shared helper + grid |

---

### Task 1: Pure `computeLifeWeeks` (TDD)

**Files:**
- Create: `src/core/time/lifeWeeks.ts`
- Modify: `src/core/time/index.ts`
- Create: `__tests__/lifeWeeks.test.ts`

**Interfaces:**
- Consumes: none (pure)
- Produces:
  - `WEEKS_PER_YEAR: number` (`365.25 / 7`)
  - `LIFE_WEEKS_DOT_CAP: 5200`
  - `computeLifeWeeks(deathAge: number, remainingDaysLife: number | undefined): { totalWeeks: number; livedWeeks: number; renderWeeks: number }`
    - `totalWeeks = Math.round(deathAge * WEEKS_PER_YEAR)`
    - `remainingWeeks` = if `remainingDaysLife` is a number then `Math.max(0, Math.round(remainingDaysLife / 7))` else `0`
    - `livedWeeks = Math.max(0, Math.min(totalWeeks, totalWeeks - remainingWeeks))`
    - `renderWeeks = Math.min(totalWeeks, LIFE_WEEKS_DOT_CAP)`

- [ ] **Step 1: Write the failing tests**

```ts
import {
  LIFE_WEEKS_DOT_CAP,
  WEEKS_PER_YEAR,
  computeLifeWeeks,
} from '../src/core/time/lifeWeeks';

describe('computeLifeWeeks', () => {
  it('computes total and lived weeks from deathAge and remaining days', () => {
    const deathAge = 80;
    const totalWeeks = Math.round(deathAge * WEEKS_PER_YEAR);
    const remainingDaysLife = 7 * 100; // 100 weeks left
    const result = computeLifeWeeks(deathAge, remainingDaysLife);
    expect(result.totalWeeks).toBe(totalWeeks);
    expect(result.livedWeeks).toBe(totalWeeks - 100);
    expect(result.renderWeeks).toBe(Math.min(totalWeeks, LIFE_WEEKS_DOT_CAP));
  });

  it('treats missing remainingDaysLife as zero remaining weeks (all lived up to total)', () => {
    const result = computeLifeWeeks(80, undefined);
    expect(result.livedWeeks).toBe(result.totalWeeks);
  });

  it('clamps lived weeks to [0, total]', () => {
    expect(computeLifeWeeks(80, -100).livedWeeks).toBeGreaterThanOrEqual(0);
    const over = computeLifeWeeks(10, 999999);
    expect(over.livedWeeks).toBe(0);
  });

  it('caps renderWeeks at LIFE_WEEKS_DOT_CAP', () => {
    const result = computeLifeWeeks(200, 0);
    expect(result.totalWeeks).toBeGreaterThan(LIFE_WEEKS_DOT_CAP);
    expect(result.renderWeeks).toBe(LIFE_WEEKS_DOT_CAP);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test __tests__/lifeWeeks.test.ts -v`  
Expected: FAIL (module / function not found)

- [ ] **Step 3: Write minimal implementation**

Create `src/core/time/lifeWeeks.ts`:

```ts
export const WEEKS_PER_YEAR = 365.25 / 7;
export const LIFE_WEEKS_DOT_CAP = 5200;

export function computeLifeWeeks(
  deathAge: number,
  remainingDaysLife: number | undefined,
): { totalWeeks: number; livedWeeks: number; renderWeeks: number } {
  const totalWeeks = Math.round(deathAge * WEEKS_PER_YEAR);
  const remainingWeeks =
    typeof remainingDaysLife === 'number'
      ? Math.max(0, Math.round(remainingDaysLife / 7))
      : 0;
  const livedWeeks = Math.max(0, Math.min(totalWeeks, totalWeeks - remainingWeeks));
  const renderWeeks = Math.min(totalWeeks, LIFE_WEEKS_DOT_CAP);
  return { totalWeeks, livedWeeks, renderWeeks };
}
```

Add to `src/core/time/index.ts`:

```ts
export * from './lifeWeeks';
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `yarn test __tests__/lifeWeeks.test.ts -v`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/core/time/lifeWeeks.ts src/core/time/index.ts __tests__/lifeWeeks.test.ts
git commit -m "feat(life): add computeLifeWeeks helper"
```

---

### Task 2: Shared `LifeWeeksGrid` UI

**Files:**
- Create: `src/ui/LifeWeeksGrid.tsx`
- Modify: `src/ui/index.ts`

**Interfaces:**
- Consumes: `useTheme` from theme; `Spacing` optional
- Produces: `LifeWeeksGrid({ livedWeeks, renderWeeks, fillColor?: string })`
  - Renders `renderWeeks` dots; index `< livedWeeks` filled with `fillColor ?? theme.percent`; else muted `#4A4A4A`
  - Dot style match onboarding: width/height 6, borderRadius 3, marginHorizontal 2, marginVertical 3
  - `flexDirection: 'row'`, `flexWrap: 'wrap'`, `justifyContent: 'center'`, `width: '100%'`

- [ ] **Step 1: Create `LifeWeeksGrid`**

```tsx
import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../theme';

export type LifeWeeksGridProps = {
  livedWeeks: number;
  renderWeeks: number;
  fillColor?: string;
};

export function LifeWeeksGrid({
  livedWeeks,
  renderWeeks,
  fillColor,
}: LifeWeeksGridProps) {
  const theme = useTheme();
  const livedFill = fillColor ?? theme.percent;
  const flags = useMemo(
    () =>
      Array.from({ length: Math.max(0, renderWeeks) }, (_, i) => i < livedWeeks),
    [renderWeeks, livedWeeks],
  );

  return (
    <View style={styles.grid} accessibilityLabel={`${livedWeeks} of ${renderWeeks} weeks lived`}>
      {flags.map((isLived, index) => (
        <View
          key={index}
          style={[
            styles.dot,
            isLived ? { backgroundColor: livedFill } : styles.dotRemaining,
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 2,
    marginVertical: 3,
  },
  dotRemaining: {
    backgroundColor: '#4A4A4A',
  },
});
```

- [ ] **Step 2: Export from `src/ui/index.ts`**

Add:

```ts
export { LifeWeeksGrid } from './LifeWeeksGrid';
export type { LifeWeeksGridProps } from './LifeWeeksGrid';
```

- [ ] **Step 3: Commit**

```bash
git add src/ui/LifeWeeksGrid.tsx src/ui/index.ts
git commit -m "feat(ui): add shared LifeWeeksGrid"
```

---

### Task 3: Optional `hero` on `PeriodDetailScreen`

**Files:**
- Modify: `src/surfaces/app/PeriodDetailScreen.tsx`

**Interfaces:**
- Consumes: existing `PeriodDetailProps`
- Produces: add `hero?: React.ReactNode` to props
  - When `hero` is provided: render `hero` instead of the `Pressable` + `CircularProgress` + tap cue block
  - When `hero` is omitted: keep current ring behavior for day/month/year/life default

- [ ] **Step 1: Extend props**

In `PeriodDetailProps`, add:

```ts
hero?: React.ReactNode;
```

Destructure `hero` in the component.

- [ ] **Step 2: Conditionally replace the ring**

Replace the ring `Pressable` block with:

```tsx
{hero != null ? (
  <View style={styles.heroWrap}>{hero}</View>
) : (
  <Pressable onPress={bounceRing} accessibilityRole="button">
    <Animated.View
      style={[styles.ringWrap, { transform: [{ scale: ringScale }] }]}
    >
      <CircularProgress
        progress={progress}
        size={RING_SIZE}
        strokeWidth={14}
        label={`${pct}%`}
      />
      <Text variant="micro" color="secondary" style={styles.tapRingCue}>
        {personality.cue}
      </Text>
    </Animated.View>
  </Pressable>
)}
```

Add style:

```ts
heroWrap: {
  width: '100%',
  marginBottom: Spacing[4],
  alignItems: 'center',
},
```

Keep stats row, summary card, footer unchanged.

- [ ] **Step 3: Manual smoke check (no automated UI test required)**

Confirm Day / Month / Year screens still compile and still use the ring path (`hero` undefined).

- [ ] **Step 4: Commit**

```bash
git add src/surfaces/app/PeriodDetailScreen.tsx
git commit -m "feat(life): allow PeriodDetailScreen hero to replace ring"
```

---

### Task 4: Wire `LifeScreen` hero (dots + weeks label + keep day stats)

**Files:**
- Modify: `src/surfaces/app/LifeScreen.tsx`

**Interfaces:**
- Consumes: `computeLifeWeeks` from `../../core/time/lifeWeeks` **only if surfaces already import core for display formatting**; prefer importing via a tiny hook or keep parity with existing Life screen which already derives numbers locally.
  - Spec + architecture: surfaces must NOT import `core` for business logic. Prefer: call `computeLifeWeeks` from a thin hook `useLifeWeeks` that imports the helper, **or** duplicate-free by putting the call in LifeScreen only if the repo already imports core from surfaces for display.
- Check existing Life/Home patterns first. If no surface imports `core`, create `src/hooks/useLifeWeeks.ts` that returns `{ totalWeeks, livedWeeks, renderWeeks }` from `useObserveTimeState` + `computeLifeWeeks`.
- Produces: unlocked Life passes `hero` with weeks headline + `LifeWeeksGrid`; keeps existing day passed/left/summary props

**Preferred approach (architecture-safe):**

- Create: `src/hooks/useLifeWeeks.ts`
- Modify: `src/hooks/index.ts` (export)
- Modify: `LifeScreen.tsx`

- [ ] **Step 1: Add `useLifeWeeks` hook**

```ts
import { useMemo } from 'react';
import { computeLifeWeeks } from '../core/time/lifeWeeks';
import { useObserveTimeState } from './useObserveTimeState';

export function useLifeWeeks() {
  const { userProfile, timeState } = useObserveTimeState();
  return useMemo(
    () =>
      computeLifeWeeks(
        userProfile.deathAge ?? 80,
        timeState.remainingDaysLife,
      ),
    [userProfile.deathAge, timeState.remainingDaysLife],
  );
}
```

Export from `src/hooks/index.ts`.

- [ ] **Step 2: Update unlocked `LifeScreen` return**

Import `Text`, `LifeWeeksGrid`, `useTheme`, `useLifeWeeks`, `StyleSheet` as needed.

Inside unlocked branch, before `PeriodDetailScreen`:

```ts
const theme = useTheme();
const { totalWeeks, livedWeeks, renderWeeks } = useLifeWeeks();
const livedWeeksLabel = livedWeeks.toLocaleString();
const totalWeeksLabel = totalWeeks.toLocaleString();
```

Pass:

```tsx
<PeriodDetailScreen
  kind="life"
  title="Your life"
  progress={progress}
  passedLabel={passedDays.toLocaleString()}
  leftLabel={remainingDays.toLocaleString()}
  passedCaption="Days lived"
  leftCaption="Days left"
  summary={`Based on ${deathAge} years. ${percentUsed}% used · ${100 - percentUsed}% remaining.`}
  hero={
    <View style={{ width: '100%', alignItems: 'center' }}>
      <Text style={{ color: theme.textPrimary, textAlign: 'center' }}>
        You have lived{' '}
      </Text>
      <Text
        style={{
          color: theme.percent,
          textAlign: 'center',
          marginBottom: Spacing[5],
        }}
      >
        {livedWeeksLabel} weeks / {totalWeeksLabel} weeks
      </Text>
      <LifeWeeksGrid
        livedWeeks={livedWeeks}
        renderWeeks={renderWeeks}
        fillColor={theme.percent}
      />
    </View>
  }
/>
```

Use project `Text` / `Typography` / `Weight` styles consistent with onboarding where practical; keep copy plain (no em dashes). Locked branch unchanged.

- [ ] **Step 3: Manual verify**

- Birth date set + Life access: open Home → Your life → dots visible, no ring, day stats still below.
- No birth date / locked: still CTA cards only.

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useLifeWeeks.ts src/hooks/index.ts src/surfaces/app/LifeScreen.tsx
git commit -m "feat(life): show week dots on Your life screen"
```

---

### Task 5: Refactor onboarding preview to shared grid

**Files:**
- Modify: `src/surfaces/auth/LifeWeeksPreviewScreen.tsx`

**Interfaces:**
- Consumes: `useLifeWeeks` (or `computeLifeWeeks` via hook), `LifeWeeksGrid`
- Produces: same visual as before; remove local `weeksArray` / `weekDot` styles

- [ ] **Step 1: Replace local math + dots**

Remove local `WEEKS_PER_YEAR` and `weeksArray` memo. Use:

```ts
const { totalWeeks, livedWeeks, renderWeeks } = useLifeWeeks();
```

Replace the mapped `View` dots with:

```tsx
<LifeWeeksGrid
  livedWeeks={livedWeeks}
  renderWeeks={renderWeeks}
  fillColor={theme.percent}
/>
```

Keep onboarding title styling (`You have lived` + emphasized weeks counts) as currently designed; only the grid markup moves.

Remove unused `weekDot` / `weekDotRemaining` styles if unused.

- [ ] **Step 2: Manual verify**

Walk identity setup → Life weeks preview: dots still render; Continue still works; analytics events unchanged.

- [ ] **Step 3: Run unit tests**

Run: `yarn test __tests__/lifeWeeks.test.ts -v`  
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/surfaces/auth/LifeWeeksPreviewScreen.tsx
git commit -m "refactor(onboarding): reuse LifeWeeksGrid on preview"
```

---

## Self-review (plan vs spec)

| Spec requirement | Task |
|------------------|------|
| Shared week dots visual | Task 2 + 5 |
| Replace ring on Life | Task 3 + 4 |
| Keep days lived / left + summary | Task 4 (existing PeriodDetail props) |
| Weeks label above grid | Task 4 |
| Pure shared math + 5200 cap | Task 1 |
| Onboarding uses same grid | Task 5 |
| Locked / no DOB unchanged | Task 4 (no edits to locked branch) |
| Day/Month/Year unchanged | Task 3 (`hero` optional) |
| Existing `DotsGrid` untouched | No task touches it |

No placeholders left. Types consistent: `computeLifeWeeks` → `useLifeWeeks` → `LifeWeeksGrid({ livedWeeks, renderWeeks })` → `PeriodDetailScreen.hero`.
